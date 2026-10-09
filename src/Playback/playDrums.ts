import { triggerMidi } from "./playFunctions";
import { getAudioContext } from "./audioContext";
import { runPreScheduledSequence, scheduleTimer, Register, SequenceTiming } from "./scheduler";
import { playDrumVoice, keyRootHz } from "./drumSynth";
import { feelFor, velocity } from "./realism";
import { DrumHit } from "../types";

// General MIDI drum notes for every drum-machine row (kick, snare, toms,
// hats, ride, crash).
const MIDI_NOTES: Record<number, number> = {
  0: 36, 1: 38, 2: 45, 3: 47, 4: 50, 5: 42, 6: 46, 7: 51, 8: 49,
};

// `mute` may be a function, asked as each hit is scheduled (half a second
// ahead), so muting a drum mid-part takes effect almost at once. So is
// `realism`.
export default function playBeat(midi: boolean, beat: number, pattern: DrumHit[], groove: number[], bpm: number, stepsRef: DrumHit[][], onStep?: (index: number) => void, shouldStop?: () => boolean, mute?: boolean | (() => boolean), acoustic = true, key?: string, timing?: SequenceTiming, end?: number, realism?: () => boolean) {
    const beatDuration = 60 / bpm // duration of one beat in seconds
    const swingRatio = 3/3; // adjust as needed

    let voice = -1;
    for (let v = 0; v < stepsRef.length; v++) {
      if (stepsRef[v] === pattern) { voice = v; break; }
    }
    const midiNote = MIDI_NOTES[voice];
    const rootHz = keyRootHz(key);

    const getDuration = (index: number) => {
      const isEvenSixteenth = index % 4 === 0 || index % 4 === 2;
      return isEvenSixteenth
        ? groove[index] * beatDuration * swingRatio
        : groove[index] * beatDuration;
    };

    const onSchedule = (index: number, time: number, duration: number, register: Register) => {
      if (onStep) {
        scheduleTimer(time, () => onStep(index), register);
      }

      if (midiNote === undefined || !pattern[index].checked) return;
      if (typeof mute === 'function' ? mute() : mute) return;

      // Accented hits are written at 90, the rest at 60.
      const feel = feelFor('drums', realism);
      const at = feel.at(time);
      const hit = velocity(pattern[index].accent ? 90 : 60, feel.level(time));

      if (!midi) {
        const audioContext = getAudioContext();
        const stop = playDrumVoice(audioContext, audioContext.destination, voice, at, hit / 100, acoustic, rootHz);
        if (stop) register(stop);
      } else {
        scheduleTimer(at, () => triggerMidi('drums', midiNote, duration, hit), register);
      }
    };

    // `end` (exclusive) stops early, e.g. at a loop's end bar.
    return runPreScheduledSequence(beat, end ?? groove.length, getDuration, onSchedule, shouldStop, timing);
  }
