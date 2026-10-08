// The vocal melody: one note per sung syllable, at the syllable's place.
//
// A song's melody is switched on as a whole (SongDoc.melody); each part's is
// then made from its words. Like the words' dragged syllables, a melody
// belongs to the part that owns the words - a repeated chorus singing the
// first one's words sings its tune too (raised with any key lift).
//
// Pitches are generated live from the part's chords, key and bass line, so
// the tune follows a re-rolled progression; a hand edit freezes the whole
// tune (a snapshot per lyric line, kept while the line reads the same) and
// locks it, as edits lock the other layers.

import { SongDoc } from './doc';
import { ChordEvent, Key, LETTERS, MODE_STEPS, Spelled, chordTones, keyScale, mod12, spellInChord } from './theory';
import { chordAt } from './bassline';
import { baseSectionId } from './generate';
import { transposedKey } from './realize';
import { lyricLines, partLyrics, placeLyrics, Syllable, LyricTiming } from './lyrics';
import { PPQ } from './time';
import { streamFor, Rng } from './seeds';

export interface PartMelody {
  roll: number; // re-roll counter, part of the seed
  locked?: boolean;
  // The tune as frozen by an edit, per lyric line (as LyricTiming keys moves).
  lines?: Array<{ text: string; pitches: Array<number | null> } | null>;
  // How many times each syllable's note was split in half (the rhythm
  // strip), per lyric line likewise. Pitches don't depend on it, so it
  // survives re-rolls and never locks the tune.
  rhythm?: Array<{ text: string; splits: number[] } | null>;
}

export interface MelodyNote {
  text: string; // the syllable sung
  hyphen: boolean; // its word goes on
  line: number;
  at: number;
  step: number; // drum step it starts on
  beat: number; // onset, beats from the part's start
  dur: number; // how long it sounds, in beats
  full: number; // its whole length before any splits: to the next syllable
  splits: number; // times halved; each split leaves a rest after it
  rests: Array<{ beat: number, dur: number }>; // those rests, in time order
  midi: number;
  spelled: Spelled; // its name against the chord it sounds over
}

export interface PartMelodyNotes {
  notes: MelodyNote[];
  owner: number; // the part whose words (and tune) these are
  shift: number; // semitones this part sits above the owner (key lifts)
  melody: PartMelody; // the owner's melody state
}

// The singable range the generator stays in (C4-F5), and the longest a note
// is held over a gap before the next syllable.
export const MELODY_LOW = 60;
export const MELODY_HIGH = 77;
const MAX_HOLD = 4;

type Parts = Array<{ type: string; lyrics?: string; lyricTiming?: LyricTiming; drumGroove: number[]; bassGroove: number[]; bassNoteLocations: Array<{ midi: number }> }>;

// ---- Generation ------------------------------------------------------------

interface Slot {
  tick: number;
  strong: boolean; // beat 1 or 3, or a line's last syllable
  lineEnd: boolean;
  last: boolean; // the part's last syllable
  linePos: number; // 0..1 through its line
}

interface Context {
  key: Key;
  harmony: ChordEvent[];
  bassAt: (tick: number) => number | null; // sounding bass MIDI, or null in a rest
  energy: number;
  rng: Rng;
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// Score one candidate pitch for a slot, given the line so far.
function score(c: number, slot: Slot, prev: number[], prevBass: number | null, ctx: Context): number {
  const chord = chordAt(ctx.harmony, slot.tick);
  const tones = chordTones(chord).map(rel => mod12(ctx.key.tonic + rel));
  const chordIndex = tones.indexOf(mod12(c));
  const p1 = prev[prev.length - 1];
  const p2 = prev[prev.length - 2];
  let s = 0;

  // Harmony: chord tones on strong beats; anything else only as a step.
  if (chordIndex !== -1) {
    s += slot.strong ? 3 : 1.5;
  } else if (slot.strong) {
    s -= 3;
  } else {
    s += p1 !== undefined && Math.abs(c - p1) <= 2 ? 0.5 : -2;
  }
  // Phrase ends rest on stable tones: the root to close the part, else the
  // third or fifth; a seventh doesn't end a line.
  if (slot.lineEnd && chordIndex !== -1) {
    if (slot.last) s += chordIndex === 0 ? 2.5 : chordIndex === 1 ? 0.5 : -1;
    else s += chordIndex === 1 ? 1 : chordIndex === 0 || chordIndex === 2 ? 0.5 : -1;
  }

  // Melodic line: mostly steps, a leap answered by a step the other way.
  if (p1 !== undefined) {
    const d = c - p1;
    const ad = Math.abs(d);
    s += ad === 0 ? -0.7 : ad <= 2 ? 2 : ad <= 4 ? 1 : ad === 6 ? -2.5 : ad <= 7 ? 0 : ad <= 12 ? -3 : -8;
    if (p2 !== undefined && Math.abs(p1 - p2) >= 5) {
      if (sign(d) === -sign(p1 - p2) && ad <= 2) s += 1.5;
      else if (sign(d) === sign(p1 - p2)) s -= 1.5;
    }
  }

  // Shape: an arch over each line, sitting higher as the energy rises.
  const center = 64 + ctx.energy * 5;
  s -= 0.3 * Math.abs(c - (center + 3 * Math.sin(Math.PI * slot.linePos)));

  // Counterpoint against the bass.
  const b = ctx.bassAt(slot.tick);
  if (b !== null) {
    const iv = mod12(c - b);
    if (slot.strong && (iv === 1 || iv === 6 || iv === 11)) s -= 2.5;
    if (iv === 0) s -= slot.strong ? 1 : 0.3;
    if (p1 !== undefined && prevBass !== null && c !== p1 && b !== prevBass) {
      const prevIv = mod12(p1 - prevBass);
      const together = sign(c - p1) === sign(b - prevBass);
      if (together && (iv === 0 || iv === 7) && prevIv === iv) s -= 12; // parallel 5ths/8ves: out
      else if (together && (iv === 0 || iv === 7) && Math.abs(c - p1) > 2) s -= 1.5; // hidden ones
      else if (!together) s += 0.8; // contrary motion
    }
  }
  return s;
}

function generate(slots: Slot[], fixed: Array<number | null>, ctx: Context): number[] {
  const scale = MODE_STEPS[ctx.key.mode].map(step => mod12(ctx.key.tonic + step));
  const out: number[] = [];
  let prevBass: number | null = null;
  slots.forEach((slot, i) => {
    let pick = fixed[i];
    if (pick === null || pick === undefined) {
      const chordPcs = chordTones(chordAt(ctx.harmony, slot.tick)).map(rel => mod12(ctx.key.tonic + rel));
      const candidates: Array<[number, number]> = [];
      for (let c = MELODY_LOW; c <= MELODY_HIGH; c++) {
        if (scale.includes(mod12(c)) || chordPcs.includes(mod12(c))) candidates.push([c, score(c, slot, out, prevBass, ctx)]);
      }
      candidates.sort((a, b) => b[1] - a[1]);
      // Among the near-best, weighted toward the best.
      const best = candidates[0][1];
      const near = candidates.filter(([, s]) => s >= best - 1.5);
      const weights = near.map(([, s]) => Math.exp(2 * (s - best)));
      let r = ctx.rng() * weights.reduce((a, b) => a + b, 0);
      pick = near[near.length - 1][0];
      for (let k = 0; k < near.length; k++) {
        r -= weights[k];
        if (r <= 0) { pick = near[k][0]; break; }
      }
    }
    out.push(pick);
    prevBass = ctx.bassAt(slot.tick);
  });
  return out;
}

// ---- A part's tune ---------------------------------------------------------

const tickOf = (beat: number) => Math.round(beat * 12) * (PPQ / 12);

// Sounding lengths: to the next syllable (or the part's end), at most a
// whole note.
function durations(syllables: Syllable[], partBeats: number): number[] {
  return syllables.map((s, i) => Math.min(MAX_HOLD, (syllables[i + 1]?.beat ?? partBeats) - s.beat));
}

// The owner part's pitches, one per placed syllable.
function ownerPitches(doc: SongDoc, parts: Parts, owner: number, syllables: Syllable[], text: string): number[] {
  const inst = doc.form[owner];
  const section = doc.sections[inst.sectionId];
  const part = parts[owner];
  const key = transposedKey(doc.key, inst.transpose);
  const bassOnsets: number[] = [];
  part.bassGroove.reduce((t, d) => (bassOnsets.push(tickOf(t)), t + d), 0);
  const bassAt = (tick: number) => {
    let k = 0;
    for (let i = 0; i < bassOnsets.length; i++) if (bassOnsets[i] <= tick) k = i;
    const midi = part.bassNoteLocations[k]?.midi ?? 0;
    return midi > 0 ? midi : null;
  };
  const lineTexts = lyricLines(text);
  const lineLength = (line: number) => syllables.filter(s => s.line === line).length;
  const slots: Slot[] = syllables.map((s, i) => {
    const tick = tickOf(s.beat);
    const lineEnd = syllables[i + 1]?.line !== s.line;
    return { tick, strong: lineEnd || tick % (2 * PPQ) === 0, lineEnd, last: i === syllables.length - 1, linePos: lineLength(s.line) > 1 ? s.at / (lineLength(s.line) - 1) : 0.5 };
  });
  const frozen = inst.melody?.lines;
  const fixed = syllables.map(s => {
    const entry = frozen?.[s.line];
    return entry && entry.text === lineTexts[s.line] ? entry.pitches[s.at] ?? null : null;
  });
  return generate(slots, fixed, {
    key,
    harmony: section.harmony,
    bassAt,
    energy: inst.energy,
    rng: streamFor(doc.seed, 'melody', baseSectionId(section.id), inst.melody?.roll ?? 0),
  });
}

// A part's melody notes - none when the song has no melody, the part isn't
// a sculpted one, or it sings no words.
export function melodyFor(doc: SongDoc | null | undefined, parts: Parts, index: number): PartMelodyNotes | null {
  if (!doc?.melody || doc.form.length !== parts.length || !doc.form[index]) return null;
  const words = partLyrics(parts, index);
  if (!words.text) return null;
  const owner = words.from ?? index;
  const ownerPlaced = placeLyrics(words.text, parts[owner].drumGroove, words.timing).syllables;
  if (ownerPlaced.length === 0) return null;
  const pitches = ownerPitches(doc, parts, owner, ownerPlaced, words.text);
  const byPlace = new Map(ownerPlaced.map((s, i) => [`${s.line}:${s.at}`, pitches[i]]));

  const shift = doc.form[index].transpose - doc.form[owner].transpose;
  const here = owner === index ? ownerPlaced : placeLyrics(words.text, parts[index].drumGroove, words.timing).syllables;
  const inst = doc.form[index];
  const section = doc.sections[inst.sectionId];
  const key = transposedKey(doc.key, inst.transpose);
  const partBeats = parts[index].drumGroove.reduce((a, b) => a + b, 0);
  const lengths = durations(here, partBeats);
  const ownerMelody = doc.form[owner].melody ?? { roll: 0 };
  const lineTexts = lyricLines(words.text);
  const notes = here.flatMap((s, i) => {
    const pitch = byPlace.get(`${s.line}:${s.at}`);
    if (pitch === undefined) return [];
    const midi = pitch + shift;
    const chord = chordAt(section.harmony, tickOf(s.beat));
    const entry = ownerMelody.rhythm?.[s.line];
    const splits = entry && entry.text === lineTexts[s.line] ? entry.splits[s.at] ?? 0 : 0;
    const full = lengths[i];
    const dur = full / 2 ** splits;
    // A split's rests follow the note, shortest first: 1/4 + rest 1/4 + rest 1/2.
    const rests = Array.from({ length: splits }, (_, k) => dur * 2 ** k)
      .map((length, k, all) => ({ beat: s.beat + dur + all.slice(0, k).reduce((a, b) => a + b, 0), dur: length }));
    return [{ text: s.text, hyphen: s.hyphen, line: s.line, at: s.at, step: s.step, beat: s.beat, dur, full, splits, rests, midi, spelled: spellInChord(mod12(midi), chord, key) }];
  });
  return { notes, owner, shift, melody: ownerMelody };
}

// Whether a melody note can be halved again: down to sixteenths.
export const canSplitMelodyNote = (note: Pick<MelodyNote, 'dur' | 'splits'>) => note.dur / 2 >= 0.25 - 1e-6 && note.splits < 4;

// The owner's melody with syllable `at` of line `line` split `splits` times,
// for words `text`; lines reworded since lose theirs.
export function melodyWithSplits(melody: PartMelody | undefined, text: string, line: number, at: number, splits: number): PartMelody {
  const rhythm = lyricLines(text).map((lineText, k) => {
    const entry = melody?.rhythm?.[k];
    const counts = entry && entry.text === lineText ? [...entry.splits] : [];
    if (k === line) counts[at] = Math.max(0, splits);
    const kept = Array.from({ length: Math.max(counts.length, 0) }, (_, i) => counts[i] ?? 0);
    return kept.some(n => n > 0) ? { text: lineText, splits: kept } : null;
  });
  const next: PartMelody = { ...(melody ?? { roll: 0 }) };
  if (rhythm.some(Boolean)) next.rhythm = rhythm;
  else delete next.rhythm;
  return next;
}

// The owner's tune frozen as it stands - so chord or bass changes no longer
// reshape it - and locked; with `edit`, one syllable set to a new pitch.
export function frozenMelody(doc: SongDoc, parts: Parts, owner: number, edit?: { line: number, at: number, midi: number }): PartMelody | null {
  const current = melodyFor(doc, parts, owner);
  if (!current) return null;
  const text = partLyrics(parts, owner).text;
  const lines = lyricLines(text).map((lineText, k) => {
    const pitches: Array<number | null> = [];
    current.notes.filter(n => n.line === k).forEach(n => { pitches[n.at] = n.midi; });
    if (edit && k === edit.line) pitches[edit.at] = edit.midi;
    return { text: lineText, pitches: Array.from({ length: pitches.length }, (_, i) => pitches[i] ?? null) };
  });
  return { ...current.melody, locked: true, lines };
}

// ---- On the treble staff ---------------------------------------------------

const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

// A spelled pitch's diatonic step: letters counted up from C0 (C4 = 28,
// the treble staff's lines E4-F5 = 30-38).
export function diatonicStep(midi: number, spelled: Spelled): number {
  const octave = Math.floor((midi - spelled.acc) / 12) - 1;
  return octave * 7 + LETTERS.indexOf(spelled.letter);
}

// The pitch at a diatonic step, with the key's accidental for that letter
// (F at a step means F# in D major) or the one given.
export function pitchAtStep(step: number, key: Key, acc?: number): { midi: number, spelled: Spelled } {
  const letterIndex = ((step % 7) + 7) % 7;
  const octave = Math.floor(step / 7);
  const letter = LETTERS[letterIndex];
  const keyAcc = keyScale(key).find(s => s.letter === letter)?.acc ?? 0;
  const a = acc ?? keyAcc;
  return { midi: (octave + 1) * 12 + LETTER_PC[letterIndex] + a, spelled: { letter, acc: a } };
}

// The note value a length is drawn as (the staff has no ties).
export function noteValue(dur: number): number {
  return dur >= 3.5 ? 4 : dur >= 2.75 ? 2.5 : dur >= 1.75 ? 2 : dur >= 1.25 ? 1.5 : dur >= 0.875 ? 1 : dur >= 0.625 ? 0.75 : dur >= 0.375 ? 0.5 : 0.25;
}
