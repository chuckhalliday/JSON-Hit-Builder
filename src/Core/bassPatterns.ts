// Common bass rhythms a part can be set to in one go (the Rhythm menu over
// the bass clef). Each is one bar, repeated through the section. Every chord
// change still lands on a note - the bass takes each chord's bass note on its
// change - so a bar whose pattern has no note where its chord changes (3-3-2
// under a chord on beat 3) gets one there. A shuffle sits on eighth-note
// triplets, three drum steps to a beat; the straight patterns on the eighth
// grid the generator already writes. edits.ts writes the result back.

import { ChordEvent } from './theory';
import { BAR, EIGHTH, HALF, PPQ } from './time';

export type BassPatternId = 'eighths' | 'quarters' | 'dottedQuarter' | 'oneTwoAndThree' | 'threeThreeTwo' | 'shuffle';

export interface BassPattern {
  id: BassPatternId;
  name: string;
  about: string;
  bar: number[]; // note durations in ticks, summing to a bar
  swing?: boolean; // on eighth-note triplets
}

// An eighth-note triplet: a shuffle's swung pair is two of them, then one.
export const TRIPLET_EIGHTH = PPQ / 3;

const DOTTED_QUARTER = PPQ + EIGHTH;

export const BASS_PATTERNS: BassPattern[] = [
  { id: 'eighths', name: 'Straight eighths', about: 'Eight even notes a bar: the driving rock and pop pulse', bar: Array(8).fill(EIGHTH) },
  { id: 'quarters', name: 'Straight quarters', about: 'A note on every beat', bar: Array(4).fill(PPQ) },
  { id: 'dottedQuarter', name: 'Dotted quarter–eighth', about: 'Long-short: notes on 1, the & of 2, 3 and the & of 4', bar: [DOTTED_QUARTER, EIGHTH, DOTTED_QUARTER, EIGHTH] },
  { id: 'oneTwoAndThree', name: 'One, two-and, three', about: 'Notes on 1, 2, the & of 2 and 3, held through 4', bar: [PPQ, EIGHTH, EIGHTH, HALF] },
  { id: 'threeThreeTwo', name: '3-3-2 funk', about: 'Syncopated: notes on 1, the & of 2 and 4 (and on 3 in a bar whose chord changes there)', bar: [DOTTED_QUARTER, DOTTED_QUARTER, PPQ] },
  { id: 'shuffle', name: 'Shuffle / swing', about: 'Swung long-short pairs on every beat, in triplets - the drums swing with it', bar: Array.from({ length: 4 }, () => [2 * TRIPLET_EIGHTH, TRIPLET_EIGHTH]).flat(), swing: true },
];

export const bassPattern = (id: BassPatternId) => BASS_PATTERNS.find(p => p.id === id);

const onsets = (durations: number[]) => {
  const out: number[] = [];
  durations.reduce((pos, d) => (out.push(pos), pos + d), 0);
  return out;
};

// The section's bass rhythm in this pattern: the bar repeated, and a note
// cut in two wherever a chord changes inside it.
export function patternRhythm(pattern: BassPattern, bars: number, harmony: ChordEvent[]): number[] {
  const rhythm = Array.from({ length: bars }, () => pattern.bar).flat();
  for (const chord of harmony) {
    let pos = 0;
    for (let k = 0; k < rhythm.length; pos += rhythm[k], k++) {
      if (chord.start > pos && chord.start < pos + rhythm[k]) {
        rhythm.splice(k, 1, chord.start - pos, pos + rhythm[k] - chord.start);
        break;
      }
    }
  }
  return rhythm;
}

// Whether a section's bass already plays this pattern.
export const playsPattern = (bassRhythm: number[], pattern: BassPattern, bars: number, harmony: ChordEvent[]) => {
  const rhythm = patternRhythm(pattern, bars, harmony);
  return rhythm.length === bassRhythm.length && rhythm.every((d, k) => d === bassRhythm[k]);
};

// The drum steps under a pattern, beat by beat, and the tick each old
// step's hits move to. A shuffle puts every beat on three triplet steps:
// hits on the beat stay, the rest swing to the triplet they're heard on -
// an "e" to the middle one, an "&" or "a" to the last. A straight pattern
// turns a beat a shuffle left back into two eighths, its swung hits back on
// the "&"; every other beat keeps its steps. (Notes off these steps -
// none, for the patterns here - are cut in by the caller.)
export function patternGrid(steps: number[], swing: boolean): { steps: number[], moved: number[] } {
  const on = onsets(steps);
  const moved = [...on];
  const out: number[] = [];
  for (let i = 0; i < steps.length;) {
    const beat = on[i] - (on[i] % PPQ);
    let j = i;
    while (j < steps.length && on[j] < beat + PPQ) j++;
    const beatSteps = steps.slice(i, j);
    const whole = on[i] === beat && beatSteps.reduce((a, b) => a + b, 0) === PPQ;
    const shuffled = beatSteps.length === 3 && beatSteps.every(d => d === TRIPLET_EIGHTH);
    if (whole && swing) {
      out.push(TRIPLET_EIGHTH, TRIPLET_EIGHTH, TRIPLET_EIGHTH);
      for (let k = i; k < j; k++) {
        const into = on[k] - beat;
        moved[k] = beat + (into === 0 ? 0 : into < EIGHTH ? TRIPLET_EIGHTH : 2 * TRIPLET_EIGHTH);
      }
    } else if (whole && shuffled) {
      out.push(EIGHTH, EIGHTH);
      for (let k = i; k < j; k++) moved[k] = beat + (on[k] === beat ? 0 : EIGHTH);
    } else {
      out.push(...beatSteps);
    }
    i = j;
  }
  return { steps: out, moved };
}

// A bar of the pattern as cells on its grid (eighths, or a shuffle's
// triplets), grouped by beat: true where a note starts. For the menu.
export function patternCells(pattern: BassPattern): boolean[][] {
  const unit = pattern.swing ? TRIPLET_EIGHTH : EIGHTH;
  const starts = new Set(onsets(pattern.bar));
  return Array.from({ length: BAR / PPQ }, (_, beat) =>
    Array.from({ length: PPQ / unit }, (_, k) => starts.has(beat * PPQ + k * unit)));
}
