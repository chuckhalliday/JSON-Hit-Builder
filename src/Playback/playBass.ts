import { triggerMidi } from "./playFunctions";
import { indexToLamp } from "../SongStructure/beatMapping";
import { getAudioContext } from "./audioContext";
import { runPreScheduledSequence, scheduleTimer, Register } from "./scheduler";
import { NoteLocation } from "../types";

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

  function playBass(midi: boolean, beat: number, pattern: NoteLocation[], groove: number[], bpm: number, shouldStop?: () => boolean, lamps?: HTMLInputElement[], drumGroove?: number[], mute?: boolean) {
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
      // Read the note's pre-computed pitch. The staff→pitch mapping now lives in
      // bassPitch() at generation/edit time, so the scheduler no longer inspects
      // pixel coordinates.
      const bass = midi ? pattern[index].midi : pattern[index].osc;

      if (bass <= 0 || mute) return;

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
