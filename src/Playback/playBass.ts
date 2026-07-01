import { tone, midiTone } from "../SongStructure/tone";
import { triggerMidi } from "./playFunctions";
import { indexToLamp } from "../SongStructure/beatMapping";
import { getAudioContext } from "./audioContext";
import { runPreScheduledSequence, scheduleTimer, Register } from "./scheduler";

const distortionAmount = 30; // Adjust distortion amount as needed
const distortionCurve = new Float32Array(65536);
for (let i = 0; i < 65536; i++) {
  const x = (i - 32768) / 32768;
  distortionCurve[i] = Math.tanh(x * distortionAmount);
}

function playBassOsc(audioContext: AudioContext, startTime: number, bass: number, duration: number, _velocity: number, _release: number): OscillatorNode[] {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    const fundamentalFreq = bass;

    const harmonics = [1.5, 2, 3]; // Additional harmonics
    const harmonicGains = [0.2, 0.1, 0.05]; // Gain values for harmonics

    osc.type = "sawtooth";
    osc.frequency.value = fundamentalFreq;

    osc.connect(gainNode);
    gainNode.connect(filterNode);
    filterNode.connect(audioContext.destination);

    const oscillators: OscillatorNode[] = [osc];

    for (let i = 0; i < harmonics.length; i++) {
      const harmonicOsc = audioContext.createOscillator();
      harmonicOsc.type = "sine";
      harmonicOsc.frequency.value = fundamentalFreq * harmonics[i];
      const harmonicGainNode = audioContext.createGain();
      harmonicGainNode.gain.value = harmonicGains[i];
      harmonicOsc.connect(harmonicGainNode);
      harmonicGainNode.connect(filterNode);
      harmonicOsc.start(startTime);
      harmonicOsc.stop(startTime + duration);
      harmonicOsc.onended = () => {
        harmonicOsc.disconnect();
        harmonicGainNode.disconnect();
      };
      oscillators.push(harmonicOsc);
    }

    const attackTime = 0.01;
    const releaseTime = 0.05;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + attackTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration - releaseTime);

    filterNode.type = "lowpass";
    filterNode.frequency.value = 800;

    const distortion = audioContext.createWaveShaper();
    distortion.curve = distortionCurve;
    gainNode.connect(distortion);
    distortion.connect(filterNode);

    osc.start(startTime);
    osc.stop(startTime + duration + releaseTime);
    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
      filterNode.disconnect();
      distortion.disconnect();
    };

    return oscillators;
  }
  
  function mapBassValue(midi: boolean, pattern: {x: number, y: number, acc: string}) {
    let bass = pattern.y
    const toneSet = midi ? midiTone : tone;
        
        switch (bass) {
            //E
            case 120: pattern.acc === 'flat' ? bass = toneSet.Eb[1] : bass = toneSet.E[1]; break
            case 67.5: pattern.acc === 'flat' ? bass = toneSet.Eb[2] : bass = toneSet.E[2]; break

            //F
            case 112.5: pattern.acc === 'sharp' ? bass = toneSet.Gb[1] : bass = toneSet.F[1]; break
            case 60: pattern.acc === 'sharp' ? bass = toneSet.Gb[2] : bass = toneSet.F[2]; break

            //G
            case 105: if (pattern.acc === 'sharp') {
                bass = toneSet.Ab[1];
              } else if (pattern.acc === 'flat'){
                bass = toneSet.Gb[1];
              } else {
                bass = toneSet.G[1];
              } break;
            case 52.5: if (pattern.acc === 'sharp') {
                bass = toneSet.Ab[2];
              } else if (pattern.acc === 'flat'){
                bass = toneSet.Gb[2];
              } else {
                bass = toneSet.G[2];
              } break;

            //A
            case 97.5: if (pattern.acc === 'sharp') {
                bass = toneSet.Bb[1];
              } else if (pattern.acc === 'flat'){
                bass = toneSet.Ab[1];
              } else {
                bass = toneSet.A[1];
              } break;
            case 45: if (pattern.acc === 'sharp') {
                bass = toneSet.Bb[2];
              } else if (pattern.acc === 'flat'){
                bass = toneSet.Ab[2];
              } else {
                bass = toneSet.A[2];
              } break

            //B
            case 90: pattern.acc === 'flat' ? bass = toneSet.Bb[1] : bass = toneSet.B[1]; break
            case 37.5: pattern.acc === 'flat' ? bass = toneSet.Bb[2] : bass = toneSet.B[2]; break

            //C
            case 82.5: pattern.acc === 'sharp' ? bass = toneSet.Db[2] : bass = toneSet.C[2]; break
            case 30: pattern.acc === 'sharp' ? bass = toneSet.Db[3] : bass = toneSet.C[3]; break

            //D
            case 75: if (pattern.acc === 'sharp') {
                bass = toneSet.Eb[2];
              } else if (pattern.acc === 'flat'){
                bass = toneSet.Db[2];
              } else {
                bass = toneSet.D[2];
              } break;
            default:
        }
    return bass
  }
  
  function playBass(midi: boolean, beat: number, pattern: {x: number, y: number, acc: string}[], groove: number[], bpm: number, shouldStop?: () => boolean, lamps?: HTMLInputElement[], drumGroove?: number[]) {
    const beatDuration = 60 / bpm; // duration of one beat in seconds
    const audioContext = getAudioContext();

    const getDuration = (index: number) => groove[index] * beatDuration;

    const onSchedule = (index: number, time: number, duration: number, register: Register) => {
      if (lamps && drumGroove) {
        const lampIndex = indexToLamp(groove, index, drumGroove);
        if (lamps[lampIndex]) {
          scheduleTimer(time, () => {
            lamps[lampIndex].checked = true;
            lamps[lampIndex].dispatchEvent(new Event('change', { bubbles: true }));
          }, register);
        }
      }

      const velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      const bass = mapBassValue(midi, pattern[index]);

      if (bass <= 0) return;

      if (!midi) {
        const oscillators = playBassOsc(audioContext, time, bass, duration, velocity, release);
        register(() => {
          for (const o of oscillators) {
            try { o.stop(); } catch { /* already stopped */ }
          }
        });
      } else {
        scheduleTimer(time, () => triggerMidi('2', bass, duration, velocity, release), register);
      }
    };

    return runPreScheduledSequence(beat, pattern.length, getDuration, onSchedule, shouldStop);
  }

  export default playBass;