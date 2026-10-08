import { triggerMidi } from "./playFunctions";
import { getAudioContext } from "./audioContext";
import { runPreScheduledSequence, scheduleTimer, Register, SequenceTiming } from "./scheduler";
import { midiToFreq } from "../Core/theory";

// The melody notes of the stretch of a part being played (beats from the
// part's start).
export interface MelodyPlayback {
  notes: Array<{ beat: number, dur: number, midi: number }>;
  from: number;
  to: number;
}

interface Segment {
  length: number; // beats to the next segment
  midi: number | null; // null: a rest before the next note
  sound: number; // beats the note sounds
}

const EPS = 1e-6;

// The stretch as back-to-back segments - each note, and any rest before
// one - so the melody runs on the same clock as the other tracks.
export function melodySegments({ notes, from, to }: MelodyPlayback): Segment[] {
  const sung = notes.filter(n => n.beat >= from - EPS && n.beat < to - EPS);
  if (sung.length === 0) return to > from ? [{ length: to - from, midi: null, sound: 0 }] : [];
  const segments: Segment[] = [];
  if (sung[0].beat > from + EPS) segments.push({ length: sung[0].beat - from, midi: null, sound: 0 });
  sung.forEach((n, k) => {
    const length = (sung[k + 1]?.beat ?? to) - n.beat;
    segments.push({ length, midi: n.midi, sound: Math.min(n.dur, length) });
  });
  return segments;
}

// A lead voice. "Synth": a filtered square, a little vibrato. "Acoustic":
// a breathier sine-and-triangle blend with a softer attack, more voice-like.
function scheduleMelodyNote(audioContext: AudioContext, destination: AudioNode, midi: number, now: number, duration: number, acoustic: boolean, register: Register) {
  const freq = midiToFreq(midi);
  const attack = Math.min(acoustic ? 0.06 : 0.015, duration * 0.3);
  const release = Math.min(0.08, duration * 0.3);
  const end = now + Math.max(duration, attack + release + 0.01);

  const oscs = acoustic
    ? [['sine', 1, 0.5], ['triangle', 1.001, 0.25], ['sine', 2, 0.06]] as const
    : [['square', 1, 0.16], ['triangle', 0.5, 0.2]] as const;
  const envelope = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = Math.min(acoustic ? freq * 4 : freq * 6, 7000);
  envelope.connect(filter);
  filter.connect(destination);

  // Vibrato that eases in, as a singer's does on a held note.
  const lfo = audioContext.createOscillator();
  lfo.frequency.value = 5.2;
  const depth = audioContext.createGain();
  depth.gain.setValueAtTime(0, now);
  depth.gain.linearRampToValueAtTime(freq * 0.006, now + Math.min(0.4, duration));
  lfo.connect(depth);

  const nodes = oscs.map(([type, ratio, level]) => {
    const osc = audioContext.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * ratio;
    depth.connect(osc.frequency);
    const gain = audioContext.createGain();
    gain.gain.value = level;
    osc.connect(gain);
    gain.connect(envelope);
    return { osc, gain };
  });

  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(0.5, now + attack);
  envelope.gain.setValueAtTime(0.42, Math.max(now + attack, end - release));
  envelope.gain.linearRampToValueAtTime(0, end);

  lfo.start(now);
  lfo.stop(end);
  nodes.forEach(({ osc }) => { osc.start(now); osc.stop(end); });
  nodes[0].osc.onended = () => {
    nodes.forEach(({ osc, gain }) => { osc.disconnect(); gain.disconnect(); });
    lfo.disconnect();
    depth.disconnect();
    envelope.disconnect();
    filter.disconnect();
  };
  register(() => {
    for (const node of [lfo, ...nodes.map(n => n.osc)]) {
      try { node.stop(); } catch { /* already stopped */ }
    }
  });
}

export default async function playMelody(midi: boolean, melody: MelodyPlayback, bpm: number, shouldStop?: () => boolean, mute?: boolean, acoustic = true, timing?: SequenceTiming): Promise<number> {
  const beatDuration = 60 / bpm;
  const segments = melodySegments(melody);
  const getDuration = (i: number) => segments[i].length * beatDuration;

  if (midi) {
    const onSchedule = (i: number, time: number, _duration: number, register: Register) => {
      const { midi: note, sound } = segments[i];
      if (note === null || mute) return;
      scheduleTimer(time, () => triggerMidi('melody', note, sound * beatDuration * 0.95, 90, 64), register);
    };
    return runPreScheduledSequence(0, segments.length, getDuration, onSchedule, shouldStop, timing);
  }

  const audioContext = getAudioContext();
  const bus = audioContext.createGain();
  bus.gain.value = 0.5;
  bus.connect(audioContext.destination);
  const onSchedule = (i: number, time: number, _duration: number, register: Register) => {
    const { midi: note, sound } = segments[i];
    if (note === null || mute) return;
    scheduleMelodyNote(audioContext, bus, note, time, sound * beatDuration * 0.95, acoustic, register);
  };
  const finalIndex = await runPreScheduledSequence(0, segments.length, getDuration, onSchedule, shouldStop, timing);
  const ringOut = Math.max(0, (timing?.endTime ?? 0) - audioContext.currentTime) + 1;
  setTimeout(() => bus.disconnect(), ringOut * 1000);
  return finalIndex;
}
