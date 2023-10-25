import { tone, midiTone } from "../SongStructure/tone";
import { triggerMidi, wait } from "./playFunctions";
 
async function playBassOsc(audioContext: AudioContext, bass: number, duration: number, velocity: number, release: number) {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
  
    const fundamentalFreq = bass;
  
    const harmonics = [1.5, 2, 3]; // Additional harmonics
    const harmonicGains = [0.2, 0.1, 0.05]; // Gain values for harmonics
  
    osc.type = "sawtooth"; // Use a sine waveform
    osc.frequency.value = fundamentalFreq;
  
    osc.connect(gainNode);
    gainNode.connect(filterNode);
    filterNode.connect(audioContext.destination);
  
    // Add additional harmonics
    for (let i = 0; i < harmonics.length; i++) {
      const harmonicOsc = audioContext.createOscillator();
      harmonicOsc.type = "sine";
      harmonicOsc.frequency.value = fundamentalFreq * harmonics[i];
      const harmonicGainNode = audioContext.createGain();
      harmonicGainNode.gain.value = harmonicGains[i];
      harmonicOsc.connect(harmonicGainNode);
      harmonicGainNode.connect(filterNode);
      harmonicOsc.start(audioContext.currentTime);
      harmonicOsc.stop(audioContext.currentTime + duration);
    }
  
    const attackTime = 0.01; // Adjust the attack time as needed
    const releaseTime = 0.05; // Adjust the release time as needed
  
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + attackTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - releaseTime);
  
    filterNode.type = "lowpass"; // Apply a low-pass filter
    filterNode.frequency.value = 800; // Adjust the cutoff frequency as needed
  
    const distortion = audioContext.createWaveShaper();
    const distortionAmount = 30; // Adjust distortion amount as needed
    const curve = new Float32Array(65536);
    for (let i = 0; i < 65536; i++) {
      const x = (i - 32768) / 32768;
      curve[i] = Math.tanh(x * distortionAmount);
    }
    distortion.curve = curve;
    gainNode.connect(distortion);
    distortion.connect(filterNode);
  
    osc.start(audioContext.currentTime);
    await wait(duration);
    osc.stop(audioContext.currentTime + releaseTime);
  
    osc.disconnect();
    gainNode.disconnect();
    filterNode.disconnect();
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
  
  async function playBass(midi: boolean, beat: number, pattern: {x: number, y: number, acc: string}[], groove: number[], bpm: number) {
    const beatDuration = 60 / bpm; // duration of one beat in seconds
    const audioContext = new AudioContext();
  
    for (let index = beat; index < pattern.length; index++) {
      const duration = groove[index] * beatDuration;
      let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      let bass = mapBassValue(midi, pattern[index]);
  
      if (!midi) {
        if (bass > 0) {
          await playBassOsc(audioContext, bass, duration, velocity, release);
        } else {
          await wait(duration);
        }
      } else {
        if (bass > 0) {
          triggerMidi('2', bass, duration, velocity, release);
          await wait(duration);
        } else {
          await wait(duration);
        }
      }
    }
  }
  
  export default playBass;