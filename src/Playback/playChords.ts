import { triggerMidi } from "./playFunctions";
import { indexToLamp } from "../SongStructure/beatMapping";
import { getAudioContext } from "./audioContext";
import { runPreScheduledSequence, scheduleTimer, Register } from "./scheduler";

export default async function playChords(midi: boolean, beat: number, pattern: string[], chords: { oscTones: number[][], midiTones: number[][]}, groove: number[], bpm: number, shouldStop?: () => boolean, lamps?: HTMLInputElement[], drumGroove?: number[]) {
    const beatDuration = 60 / bpm; // duration of one beat in seconds
    const audioContext = getAudioContext();

    const getDuration = (index: number) => groove[index] * beatDuration;

    const scheduleLamp = (index: number, time: number, register: Register) => {
      if (lamps && drumGroove) {
        const lampIndex = indexToLamp(groove, index, drumGroove);
        if (lamps[lampIndex]) {
          scheduleTimer(time, () => {
            lamps[lampIndex].checked = true;
            lamps[lampIndex].dispatchEvent(new Event('change', { bubbles: true }));
          }, register);
        }
      }
    };

    if (!midi) {
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 1000;
      gainNode.connect(filterNode);
      filterNode.connect(audioContext.destination);

      const onSchedule = (index: number, time: number, duration: number, register: Register) => {
        scheduleLamp(index, time, register);
        if (pattern[index] === '-') return;

        const chordTones = chords.oscTones[index];
        const now = time;
        const sustainLevel = 0.4;
        const minSegment = 0.001;
        const attackTime = Math.max(minSegment, Math.min(0.02, duration * 0.25));
        const decayTime = Math.max(minSegment, Math.min(0.02, duration * 0.25));
        const releaseTime = Math.max(minSegment, Math.min(0.05, duration * 0.25));
        const attackEnd = now + attackTime;
        const decayEnd = attackEnd + decayTime;
        const releaseStart = Math.max(decayEnd + minSegment, now + duration - releaseTime);
        const noteEnd = Math.max(releaseStart + minSegment, now + duration);

        for (const tone of chordTones) {
          const osc = audioContext.createOscillator();
          osc.frequency.value = tone;
          osc.type = 'sawtooth';
          const envelope = audioContext.createGain();
          osc.connect(envelope);
          envelope.connect(gainNode);

          envelope.gain.setValueAtTime(0, now);
          envelope.gain.linearRampToValueAtTime(0.6, attackEnd);
          envelope.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
          envelope.gain.setValueAtTime(sustainLevel, releaseStart);
          envelope.gain.linearRampToValueAtTime(0, noteEnd);

          osc.start(now);
          osc.stop(noteEnd);
          osc.onended = () => {
            osc.disconnect();
            envelope.disconnect();
          };
          register(() => { try { osc.stop(); } catch { /* already stopped */ } });
        }
      };

      const finalIndex = await runPreScheduledSequence(beat, pattern.length, getDuration, onSchedule, shouldStop);
      gainNode.disconnect();
      filterNode.disconnect();
      return finalIndex;
    } else {
      const velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

      const onSchedule = (index: number, time: number, duration: number, register: Register) => {
        scheduleLamp(index, time, register);
        if (pattern[index] === '-') return;
        const chordTones = chords.midiTones[index];
        for (const note of chordTones) {
          scheduleTimer(time, () => triggerMidi('3', note, duration, velocity, release), register);
        }
      };

      return runPreScheduledSequence(beat, pattern.length, getDuration, onSchedule, shouldStop);
    }
  }
