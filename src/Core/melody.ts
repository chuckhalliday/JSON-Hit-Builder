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
// locks it, as edits lock the other layers. A note held over a bar line
// whose chord hasn't its pitch is sung on to the nearest chord tone.

import { SongDoc } from './doc';
import { ChordEvent, Key, LETTERS, MODE_STEPS, Spelled, chordTones, keyScale, mod12, spellInChord } from './theory';
import { chordAt } from './bassline';
import { baseSectionId } from './generate';
import { transposedKey } from './realize';
import { lyricLines, partLyrics, placeLyrics, Syllable, LyricMeter, LyricTiming } from './lyrics';
import { BEATS_PER_BAR, PPQ } from './time';
import { streamFor, Rng } from './seeds';

// A stretch of a syllable sung on past its first pitch: what follows the
// `index`th bar line its sound is held over, or the `index`th rest its
// splits left, sung instead of rested.
export interface MelodyTurn {
  kind: 'bar' | 'fill';
  index: number;
}

// A syllable's pitches past its first, as set by hand: one for each bar line
// it's held over (null: as the chord there takes it), and one for each of
// its split rests that's sung (null: rested). Rests are sung in order - a
// pitch past the first one rested is never heard.
export interface SungOn {
  bars?: Array<number | null>;
  fills?: Array<number | null>;
}

export interface PartMelody {
  roll: number; // re-roll counter, part of the seed
  locked?: boolean;
  // The tune as frozen by an edit, per lyric line (as LyricTiming keys moves),
  // with each syllable's pitches past its first.
  lines?: Array<{ text: string; pitches: Array<number | null>; on?: Array<SungOn | null> } | null>;
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
  full: number; // its whole length before any splits: to the next syllable, or as long as its meter holds it
  splits: number; // times halved; each split leaves a rest after it
  // Those rests, in time order; with the pitch of any sung instead (SungOn).
  rests: Array<{ beat: number, dur: number, midi?: number }>;
  midi: number;
  spelled: Spelled; // its name against the chord it sounds over
  // How it's written: its sounding length - with any rests sung - cut at
  // each bar line (and into values the staff draws), every piece after the
  // first joined to the one before: tied, or slurred where it's sung on to
  // a new pitch (a bar whose chord hasn't the one held, or one set by hand).
  pieces: NotePiece[];
}

export interface NotePiece {
  beat: number;
  dur: number;
  midi: number;
  spelled: Spelled;
  join?: 'tie' | 'slur';
  turn?: MelodyTurn; // the stretch sung on it's part of (none: the syllable's first pitch)
}

export interface PartMelodyNotes {
  notes: MelodyNote[];
  // The silences between the notes (and before the first and after the
  // last), as written rests.
  rests: Array<{ beat: number, dur: number }>;
  owner: number; // the part whose words (and tune) these are
  shift: number; // semitones this part sits above the owner (key lifts)
  melody: PartMelody; // the owner's melody state
}

// The singable range the generator stays in (C4-F5), and the longest a note
// is held over a gap before the next syllable.
export const MELODY_LOW = 60;
export const MELODY_HIGH = 77;
const MAX_HOLD = 4;

type Parts = Array<{ type: string; lyrics?: string; lyricTiming?: LyricTiming; lyricMeter?: LyricMeter; drumGroove: number[]; bassGroove: number[]; bassNoteLocations: Array<{ midi: number }> }>;

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
// whole note - or as long as the words' meter holds it.
function durations(syllables: Syllable[], partBeats: number): number[] {
  return syllables.map((s, i) => Math.min(MAX_HOLD, s.hold ?? Infinity, (syllables[i + 1]?.beat ?? partBeats) - s.beat));
}

// A silence as written: from each point, the longest rest that starts on
// its own grid (a whole rest on a bar line, a half on beat 1 or 3, a quarter
// on a beat...) and fits, down to sixteenths (and any triplet remnant).
const REST_VALUES = [4, 2, 1, 0.5, 0.25];
const onBeatGrid = (beat: number, value: number) => Math.abs(beat / value - Math.round(beat / value)) < 1e-3;
export function restsBetween(from: number, to: number): Array<{ beat: number, dur: number }> {
  const out: Array<{ beat: number, dur: number }> = [];
  for (let at = from; to - at > 0.02;) {
    const dur = REST_VALUES.find(v => onBeatGrid(at, v) && at + v <= to + 1e-6)
      ?? Math.min(to, (Math.floor(at / 0.25 + 1e-3) + 1) * 0.25) - at;
    out.push({ beat: at, dur });
    at += dur;
  }
  return out;
}

// The note values the staff draws, in beats (a dotted half, quarter and
// eighth among them).
const DRAWN = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
const drawnAs = (length: number) => DRAWN.some(v => Math.abs(v - length) < 1e-3);

// A stretch of one bar a note sounds through, as written: one value if
// there's one that long; else, from off the beat, up to the beat first,
// then the longest values that fit. A remnant too short to write (a
// triplet's) stays on the piece before it.
export function writtenValues(from: number, to: number): Array<{ beat: number, dur: number }> {
  const out: Array<{ beat: number, dur: number }> = [];
  let at = from;
  if (!drawnAs(to - from) && !onBeatGrid(from, 1) && Math.ceil(from - 1e-3) < to - 0.25 + 1e-3) {
    out.push({ beat: from, dur: Math.ceil(from - 1e-3) - from });
    at = Math.ceil(from - 1e-3);
  }
  while (to - at > 0.02) {
    const left = to - at;
    let dur = drawnAs(left) ? left : DRAWN.find(v => v <= left + 1e-3) ?? left;
    if (left - dur < 0.25 - 1e-3) dur = left;
    out.push({ beat: at, dur });
    at += dur;
  }
  return out;
}

// The pitch held into a chord: as it is if it's one of the chord's tones,
// else the nearest that is (the lower on a tie, as a suspension falls).
export function fitToChord(midi: number, chord: Pick<ChordEvent, 'root' | 'quality'>, key: Key): number {
  const tones = chordTones(chord).map(rel => mod12(key.tonic + rel));
  for (let d = 0; d < 12; d++) {
    if (tones.includes(mod12(midi - d))) return midi - d;
    if (tones.includes(mod12(midi + d))) return midi + d;
  }
  return midi;
}

// A syllable's sound as written (MelodyNote.pieces), from the stretches it's
// sung over - its note, then any rests sung - each at its own pitch. Across
// each bar line one's held over, it takes the pitch set there (`bars`, in
// the owner's key: `shift` lifts it), else is tied on, or sung on to the
// nearest chord tone when the chord there hasn't its pitch. A new pitch is
// slurred to, the same one tied.
function writtenNote(spans: Array<{ beat: number, dur: number, midi: number, turn?: MelodyTurn }>, spelled: Spelled, bars: Array<number | null>, shift: number, harmony: ChordEvent[], key: Key): NotePiece[] {
  const pieces: NotePiece[] = [];
  let crossing = 0;
  spans.forEach((span, s) => {
    let pitch = span.midi;
    let name = s === 0 ? spelled : spellInChord(mod12(pitch), chordAt(harmony, tickOf(span.beat)), key);
    let turn = span.turn;
    const end = span.beat + span.dur;
    for (let from = span.beat; end - from > 0.02;) {
      const barEnd = Math.min(end, (Math.floor(from / BEATS_PER_BAR + 1e-6) + 1) * BEATS_PER_BAR);
      if (from > span.beat + 1e-6) {
        const chord = chordAt(harmony, tickOf(from));
        const set = bars[crossing];
        const next = set === null || set === undefined ? fitToChord(pitch, chord, key) : set + shift;
        if (next !== pitch) [pitch, name] = [next, spellInChord(mod12(next), chord, key)];
        turn = { kind: 'bar', index: crossing++ };
      }
      writtenValues(from, barEnd).forEach((v) => {
        const prev = pieces[pieces.length - 1];
        const join = !prev ? undefined : prev.midi === pitch ? 'tie' : 'slur';
        pieces.push({ ...v, midi: pitch, spelled: join === 'tie' ? prev.spelled : name, ...(join ? { join } : {}), ...(turn ? { turn } : {}) });
      });
      from = barEnd;
    }
  });
  return pieces;
}

// The owner's frozen tune with the stretch `turn` of syllable `at` of line
// `line` sung at `midi` (null: a bar line's back to the chord's choice, a
// rest's rested again - and those after it, never heard past it), for
// words `text`.
export function melodyWithTurn(melody: PartMelody, text: string, line: number, at: number, turn: MelodyTurn, midi: number | null): PartMelody {
  const lineTexts = lyricLines(text);
  const lines = lineTexts.map((lineText, k) => {
    const entry = melody.lines?.[k];
    const kept = entry && entry.text === lineText ? entry : null;
    if (k !== line || !kept) return kept;
    const on = [...(kept.on ?? [])];
    const list = turn.kind === 'bar' ? 'bars' : 'fills';
    const values = [...(on[at]?.[list] ?? [])];
    if (midi === null && turn.kind === 'fill') values.length = Math.min(values.length, turn.index);
    else values[turn.index] = midi;
    const filled = Array.from({ length: values.length }, (_, i) => values[i] ?? null);
    on[at] = { ...on[at], [list]: filled.some(v => v !== null) ? filled : undefined };
    return { ...kept, on: Array.from({ length: on.length }, (_, i) => on[i] ?? null) };
  });
  return { ...melody, lines };
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
  const ownerPlaced = placeLyrics(words.text, parts[owner].drumGroove, words.timing, words.meter).syllables;
  if (ownerPlaced.length === 0) return null;
  const pitches = ownerPitches(doc, parts, owner, ownerPlaced, words.text);
  const byPlace = new Map(ownerPlaced.map((s, i) => [`${s.line}:${s.at}`, pitches[i]]));

  const shift = doc.form[index].transpose - doc.form[owner].transpose;
  const here = owner === index ? ownerPlaced : placeLyrics(words.text, parts[index].drumGroove, words.timing, words.meter).syllables;
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
    // Those sung (in order, up to the first rested) carry its sound on.
    const frozen = ownerMelody.lines?.[s.line];
    const on = frozen && frozen.text === lineTexts[s.line] ? frozen.on?.[s.at] ?? null : null;
    const spans: Array<{ beat: number, dur: number, midi: number, turn?: MelodyTurn }> = [{ beat: s.beat, dur, midi }];
    const rests = Array.from({ length: splits }, (_, k) => dur * 2 ** k)
      .map((length, k, all) => {
        const rest = { beat: s.beat + dur + all.slice(0, k).reduce((a, b) => a + b, 0), dur: length };
        const sung = on?.fills?.[k];
        if (sung === null || sung === undefined || spans.length !== k + 1) return rest;
        spans.push({ ...rest, midi: sung + shift, turn: { kind: 'fill', index: k } });
        return { ...rest, midi: sung + shift };
      });
    const spelled = spellInChord(mod12(midi), chord, key);
    const pieces = writtenNote(spans, spelled, on?.bars ?? [], shift, section.harmony, key);
    return [{ text: s.text, hyphen: s.hyphen, line: s.line, at: s.at, step: s.step, beat: s.beat, dur, full, splits, rests, midi, spelled, pieces }];
  });
  const rests = [
    ...restsBetween(0, notes[0]?.beat ?? 0),
    ...notes.flatMap((n, k) => restsBetween(n.beat + n.full, notes[k + 1]?.beat ?? partBeats)),
  ];
  return { notes, rests, owner, shift, melody: ownerMelody };
}

// The owner's frozen tune once syllables have moved (the words placed as
// they are now): each moved one keeps its pitch where that fits the chord
// at its new place - one of the chord's tones, or off the strong beats one
// of the key's - and goes to the nearest chord tone where it doesn't; so do
// any rests it has sung. Pitches set past its bar lines go (they're other
// bar lines now). (A tune that isn't frozen follows the chords by itself.)
export function refitMoved(doc: SongDoc, parts: Parts, owner: number, moved: Array<{ line: number, at: number }>): PartMelody | undefined {
  const inst = doc.form[owner];
  const melody = inst?.melody;
  if (!melody?.lines) return melody;
  const words = partLyrics(parts, owner);
  const placed = placeLyrics(words.text, parts[owner].drumGroove, words.timing, words.meter).syllables;
  const notes = melodyFor({ ...doc, melody: true }, parts, owner)?.notes ?? [];
  const key = transposedKey(doc.key, inst.transpose);
  const harmony = doc.sections[inst.sectionId].harmony;
  const scale = MODE_STEPS[key.mode].map(step => mod12(key.tonic + step));
  const fitted = (pitch: number, beat: number, strong: boolean) => {
    const chord = chordAt(harmony, tickOf(beat));
    const fits = chordTones(chord).map(rel => mod12(key.tonic + rel)).includes(mod12(pitch)) || (!strong && scale.includes(mod12(pitch)));
    return fits ? pitch : fitToChord(pitch, chord, key);
  };
  const lineTexts = lyricLines(words.text);
  const lines = melody.lines.map(entry => entry && { ...entry, pitches: [...entry.pitches], ...(entry.on ? { on: [...entry.on] } : {}) });
  for (const { line, at } of moved) {
    const entry = lines[line];
    const pitch = entry && entry.text === lineTexts[line] ? entry.pitches[at] : null;
    const i = placed.findIndex(s => s.line === line && s.at === at);
    if (pitch === null || pitch === undefined || i === -1) continue;
    const tick = tickOf(placed[i].beat);
    entry!.pitches[at] = fitted(pitch, placed[i].beat, placed[i + 1]?.line !== line || tick % (2 * PPQ) === 0);
    const on = entry!.on?.[at];
    if (!on) continue;
    const note = notes.find(n => n.line === line && n.at === at);
    const fills = on.fills?.map((sung, k) => {
      const rest = note?.rests[k];
      return sung === null || !rest ? sung : fitted(sung, rest.beat, tickOf(rest.beat) % (2 * PPQ) === 0);
    });
    entry!.on![at] = fills?.some(v => v !== null) ? { fills } : null;
  }
  return { ...melody, lines };
}

// Whether a melody note can be halved again: down to sixteenths.
export const canSplitMelodyNote = (note: Pick<MelodyNote, 'dur' | 'splits'>) => note.dur / 2 >= 0.25 - 1e-6 && note.splits < 4;

// The owner's melody with syllable `at` of line `line` split `splits` times,
// for words `text`; lines reworded since lose theirs. Its rests are laid out
// anew, so any it sang are rests again.
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
  const on = next.lines?.[line]?.on?.[at];
  if (on?.fills) next.lines = next.lines!.map((entry, k) => (k === line && entry ? { ...entry, on: entry.on!.map((o, i) => (i === at ? (o!.bars ? { bars: o!.bars } : null) : o)) } : entry));
  return next;
}

// The owner's tune frozen as it stands - so chord or bass changes no longer
// reshape it - and locked, keeping the pitches set past syllables' first;
// with `edit`, one syllable set to a new pitch.
export function frozenMelody(doc: SongDoc, parts: Parts, owner: number, edit?: { line: number, at: number, midi: number }): PartMelody | null {
  const current = melodyFor(doc, parts, owner);
  if (!current) return null;
  const text = partLyrics(parts, owner).text;
  const lines = lyricLines(text).map((lineText, k) => {
    const pitches: Array<number | null> = [];
    current.notes.filter(n => n.line === k).forEach(n => { pitches[n.at] = n.midi; });
    if (edit && k === edit.line) pitches[edit.at] = edit.midi;
    const was = current.melody.lines?.[k];
    const on = was && was.text === lineText ? was.on : undefined;
    return { text: lineText, pitches: Array.from({ length: pitches.length }, (_, i) => pitches[i] ?? null), ...(on ? { on } : {}) };
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
