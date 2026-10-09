// Simplifying a section's progression, three ways (Section controls'
// Simplify row):
//  - fewer different chords: at most N, however often they change;
//  - one chord per bar;
//  - plain triads: extended and suspended chords become the key's own triad
//    on their root.
// Each is a pure function of the progression; edits.ts writes the result
// back, re-voicing the chords that changed and fitting the bass under them.

import { ChordEvent, Mode, MODE_STEPS, QUALITIES, Quality, chordTones, diatonicTriad, mod12, thirdIndex } from './theory';
import { functionOf } from './chordOptions';
import { phraseLength } from './harmony';
import { BAR } from './time';

export type Simplify =
  | { kind: 'limit', count: number }
  | { kind: 'perBar' }
  | { kind: 'triads' };

// The same chord whatever its inversion or how it's labelled.
const identity = (c: Pick<ChordEvent, 'root' | 'quality'>) => `${mod12(c.root)}:${c.quality}`;

export const distinctChords = (harmony: ChordEvent[]) => new Set(harmony.map(identity)).size;

const barOf = (c: ChordEvent) => Math.floor(c.start / BAR);

interface Kind {
  chord: ChordEvent; // its first appearance
  first: number;
  weight: number; // ticks it sounds for in all
}

const byWeight = (a: Kind, b: Kind) => b.weight - a.weight || a.first - b.first;
const heaviest = (kinds: Kind[]): Kind | undefined => [...kinds].sort(byWeight)[0];

// At most `count` different chords. Kept: home (the tonic), where the
// section lands (its last chord, so the cadence still arrives), then a
// chord of each function the progression has - dominant before
// predominant, so two chords make I-V and three I-IV-V - then whichever
// sound longest. Every other chord gives way to the kept one closest to it:
// the same function first, then the most notes in common. The chords keep
// their rhythm, except that one now struck twice in a bar is held through it.
export function limitChords(harmony: ChordEvent[], count: number): ChordEvent[] {
  const kinds = new Map<string, Kind>();
  harmony.forEach((c, i) => {
    const kind = kinds.get(identity(c));
    if (kind) kind.weight += c.dur;
    else kinds.set(identity(c), { chord: c, first: i, weight: c.dur });
  });
  if (kinds.size <= count || harmony.length === 0) return harmony;

  const all = [...kinds.values()];
  const kept: Kind[] = [];
  const keep = (kind?: Kind) => {
    if (kind && !kept.includes(kind) && kept.length < count) kept.push(kind);
  };
  keep(heaviest(all.filter(k => mod12(k.chord.root) === 0)));
  keep(kinds.get(identity(harmony[harmony.length - 1])));
  for (const fn of ['D', 'PD', 'T']) {
    if (!kept.some(k => k.chord.fn === fn)) keep(heaviest(all.filter(k => k.chord.fn === fn)));
  }
  [...all].sort(byWeight).forEach(keep);

  const closest = (c: ChordEvent) => {
    const tones = chordTones(c);
    const score = (k: Kind) => (k.chord.fn === c.fn ? 2 : 0) + chordTones(k.chord).filter(t => tones.includes(t)).length;
    return kept.reduce((best, k) => (score(k) > score(best) || (score(k) === score(best) && byWeight(k, best) < 0) ? k : best));
  };
  const keptIds = new Set(kept.map(k => identity(k.chord)));
  const replaced = harmony.map((c): ChordEvent => {
    if (keptIds.has(identity(c))) return c;
    const { root, quality, fn, appliedTo } = closest(c).chord;
    return { start: c.start, dur: c.dur, root, quality, inversion: 0, fn, ...(appliedTo !== undefined ? { appliedTo } : {}) };
  });

  const out: ChordEvent[] = [];
  for (const c of replaced) {
    const last = out[out.length - 1];
    if (last && identity(last) === identity(c) && barOf(last) === barOf(c) && last.start + last.dur === c.start) {
      out[out.length - 1] = { ...last, dur: last.dur + c.dur };
    } else {
      out.push(c);
    }
  }
  return out;
}

// One chord per bar, held through it: the one on its downbeat - or, in a
// bar that closes a phrase, the one it lands on, so cadences still resolve
// (V-I keeps the I, a half cadence its V).
export function onePerBar(harmony: ChordEvent[], bars: number): ChordEvent[] {
  const phrase = phraseLength(bars);
  const out: ChordEvent[] = [];
  for (let i = 0; i < harmony.length;) {
    let j = i;
    while (j + 1 < harmony.length && barOf(harmony[j + 1]) === barOf(harmony[i])) j++;
    const closes = j === harmony.length - 1 || (barOf(harmony[i]) + 1) % phrase === 0;
    const start = harmony[i].start;
    out.push({ ...harmony[closes ? j : i], start, dur: harmony[j].start + harmony[j].dur - start });
    i = j + 1;
  }
  return out;
}

const PLAIN = new Set<Quality>(['maj', 'min', 'dim', 'aug']);

// The triad a quality's own third and fifth make (a sus chord's is major).
function ownTriad(q: Quality): Quality {
  const intervals = QUALITIES[q].intervals;
  if (intervals.includes(3)) return intervals.includes(6) ? 'dim' : 'min';
  return intervals.includes(8) ? 'aug' : 'maj';
}

// Extended and suspended chords as the key's triad on their root: Cmaj7 to
// C, Dm7 to Dm, an applied E7 to iii's Em. Minor's dominant keeps its major
// third (harmonic minor's V, as the generator writes it). A root outside
// the key has no triad of the key's, so it keeps its own (Bb7 to Bb).
// Plain triads, borrowed ones included, are left as they are.
export function plainTriads(harmony: ChordEvent[], mode: Mode): ChordEvent[] {
  return harmony.map(c => {
    if (PLAIN.has(c.quality)) return c;
    const root = mod12(c.root);
    const diatonic = MODE_STEPS[mode].includes(root);
    const minorDominant = mode === 'minor' && root === 7 && ownTriad(c.quality) === 'maj' && (thirdIndex(c.quality) !== -1 || c.fn === 'D');
    const quality = diatonic && !minorDominant ? diatonicTriad(root, mode)! : ownTriad(c.quality);
    // Without its seventh, a chord standing on it goes back to root position.
    const next: ChordEvent = { ...c, quality, inversion: c.inversion <= 2 ? c.inversion : 0 };
    if (diatonic) delete next.appliedTo;
    next.fn = functionOf(next, mode);
    return next;
  });
}

export function simplified(harmony: ChordEvent[], how: Simplify, bars: number, mode: Mode): ChordEvent[] {
  switch (how.kind) {
    case 'limit': return limitChords(harmony, how.count);
    case 'perBar': return onePerBar(harmony, bars);
    case 'triads': return plainTriads(harmony, mode);
  }
}

// Whether simplifying `how` would change the progression at all.
export const wouldSimplify = (harmony: ChordEvent[], how: Simplify, bars: number, mode: Mode) =>
  JSON.stringify(simplified(harmony, how, bars, mode)) !== JSON.stringify(harmony);
