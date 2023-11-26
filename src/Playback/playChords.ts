import { triggerMidi, wait } from "./playFunctions";

export default async function playChords(midi: boolean, beat: number, pattern: string[], chords: { oscTones: number[][], midiTones: number[][]}, groove: number[], bpm: number) {
    const beatDuration = 60 / bpm; // duration of one beat in seconds
    const audioContext = new AudioContext();
  
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass'; // Adjust the filter type as needed
    filterNode.frequency.value = 1000; // Adjust the frequency as needed
    let chordTones: number[] = [];
    let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
  
    if (!midi) {
      for (let i = beat; i < pattern.length; i++) {
        const duration = groove[i] * beatDuration;
        if (pattern[i] === '-') {
          await wait(duration);
          continue;
        } else {
          chordTones = chords.oscTones[i]
        }
  
        const oscillators = chordTones.map(tone => {
        const osc = audioContext.createOscillator();
        osc.frequency.value = tone;
        osc.type = 'sawtooth';
        return osc;
      });
  
      const now = audioContext.currentTime;
  
      oscillators.forEach(osc => {
        const envelope = audioContext.createGain();
        osc.connect(envelope);
        envelope.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(audioContext.destination);
  
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.6, now + 0.02); // Attack
        envelope.gain.linearRampToValueAtTime(0.4, now + 0.04); // Decay
      });
  
      oscillators.forEach(osc => {
        osc.start(now);
      })
  
      await wait(duration);
  
      oscillators.forEach(osc => {
        const releaseTime = audioContext.currentTime + 0.1; // Adjust the release time as needed
        osc.stop(releaseTime);
      });
    }
  
    // Disconnect nodes and close the context
    gainNode.disconnect();
    filterNode.disconnect();
    audioContext.close();
  
    } else {
      for (let i = beat; i < pattern.length; i++) {
        const duration = groove[i] * beatDuration;
        if (pattern[i] === '-') {
          await wait(duration);
          continue;
        } else {
          chordTones = chords.midiTones[i]
          chordTones.map(note => {
            triggerMidi('3', note, duration, velocity, release)
          })
          await wait(duration)
        }
      }
    }
  }
  