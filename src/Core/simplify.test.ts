import { generateDoc } from './generate';
import { realizeSong } from './realize';
import { simplifyChords } from './edits';
import { distinctChords, limitChords, onePerBar, plainTriads, Simplify } from './simplify';
import { ChordEvent, HarmonicFunction, Key, Quality, chordBassPc, chordSymbol, chordTones, mod12 } from './theory';
import { BAR } from './time';

const C: Key = { tonic: 0, mode: 'major' };
const Cm: Key = { tonic: 0, mode: 'minor' };
const HALF_BAR = BAR / 2;

// A progression from [root, quality, function, length in half bars], laid end to end.
function prog(...chords: Array<[number, Quality, HarmonicFunction, number?, Partial<ChordEvent>?]>): ChordEvent[] {
  let start = 0;
  return chords.map(([root, quality, fn, halves = 2, extra = {}]) => {
    const c: ChordEvent = { start, dur: halves * HALF_BAR, root, quality, inversion: 0, fn, ...extra };
    start += c.dur;
    return c;
  });
}
const names = (h: ChordEvent[], key = C) => h.map(c => chordSymbol(c, key));
const bars = (h: ChordEvent[]) => h.map(c => [c.start / BAR, c.dur / BAR]);

// I vi IV V7 | I ii V7/vi vi: six different chords over 8 bars, landing on vi.
const verse = prog([0, 'maj', 'T'], [9, 'min', 'T'], [5, 'maj', 'PD'], [7, '7', 'D'], [0, 'maj', 'T'], [2, 'min', 'PD'], [4, '7', 'D', 2, { appliedTo: 9 }], [9, 'min', 'T']);

describe('fewer different chords', () => {
  it('keeps home and a chord of each function; the rest give way to the closest', () => {
    // I vi IV V7 | I ii V7 I
    const chorus = prog([0, 'maj', 'T'], [9, 'min', 'T'], [5, 'maj', 'PD'], [7, '7', 'D'], [0, 'maj', 'T'], [2, 'min', 'PD'], [7, '7', 'D'], [0, 'maj', 'T']);
    const out = limitChords(chorus, 3);
    expect(names(out)).toEqual(['C', 'C', 'F', 'G7', 'C', 'F', 'G7', 'C']);
    // Same rhythm: only the chords change.
    expect(bars(out)).toEqual(bars(chorus));
  });

  it('keeps the chord a section lands on', () => {
    expect(distinctChords(verse)).toBe(6);
    // vi stays beside home and V; IV gives way to vi (two notes shared), ii
    // and V7/vi to V7.
    expect(names(limitChords(verse, 3))).toEqual(['C', 'Am', 'Am', 'G7', 'C', 'G7', 'G7', 'Am']);
    expect(names(limitChords(verse, 2))).toEqual(['C', 'Am', 'Am', 'C', 'C', 'Am', 'C', 'Am']);
  });

  it('makes two chords I-V and one chord a vamp on home', () => {
    const authentic = prog([0, 'maj', 'T'], [5, 'maj', 'PD'], [2, 'm7', 'PD'], [7, '7', 'D'], [0, 'maj', 'T']);
    expect(names(limitChords(authentic, 2))).toEqual(['C', 'C', 'G7', 'G7', 'C']);
    expect(names(limitChords(authentic, 1))).toEqual(['C', 'C', 'C', 'C', 'C']);
  });

  it('holds a chord struck twice in one bar through it', () => {
    const split = prog([0, 'maj', 'T', 1], [9, 'min', 'T', 1], [7, 'maj', 'D'], [0, 'maj', 'T']);
    const out = limitChords(split, 2);
    expect(names(out)).toEqual(['C', 'G', 'C']);
    expect(bars(out)).toEqual([[0, 1], [1, 1], [2, 1]]);
  });

  it('leaves a progression already within the limit alone', () => {
    expect(limitChords(verse, 6)).toBe(verse);
  });
});

describe('one chord per bar', () => {
  it('keeps each bar\'s downbeat chord, and the chord a phrase lands on', () => {
    // 4 bars: | C Am | F | Dm G7 | G7 C | - the last bar closes the phrase.
    const busy = prog([0, 'maj', 'T', 1], [9, 'min', 'T', 1], [5, 'maj', 'PD'], [2, 'min', 'PD', 1], [7, '7', 'D', 1], [7, '7', 'D', 1], [0, 'maj', 'T', 1]);
    const out = onePerBar(busy, 4);
    expect(names(out)).toEqual(['C', 'F', 'Dm', 'C']);
    expect(bars(out)).toEqual([[0, 1], [1, 1], [2, 1], [3, 1]]);
  });

  it('lands each 4-bar phrase of a longer section on its cadence', () => {
    // Bar 4 of 8 ends the first phrase on a half cadence (ii V).
    const eight = prog([0, 'maj', 'T'], [5, 'maj', 'PD'], [9, 'min', 'T'], [2, 'min', 'PD', 1], [7, 'maj', 'D', 1], [0, 'maj', 'T'], [5, 'maj', 'PD'], [7, '7', 'D', 1], [0, 'maj', 'T', 1], [0, 'maj', 'T']);
    // Bar 7 isn't a phrase end, so it keeps its downbeat V7 - and the
    // V7-I cadence into bar 8 survives.
    expect(names(onePerBar(eight, 8))).toEqual(['C', 'F', 'Am', 'G', 'C', 'F', 'G7', 'C']);
  });
});

describe('diatonic triads', () => {
  it('turns extended and sus chords into the key\'s triad on their root', () => {
    const colourful = prog([0, 'maj7', 'T'], [2, 'm7', 'PD'], [7, '9', 'D'], [9, 'add9', 'T'], [4, '7', 'D', 2, { appliedTo: 9 }], [5, 'sus2', 'PD'], [10, '7', 'PD'], [5, 'min', 'PD'], [11, 'm7b5', 'D', 2, { inversion: 3 }]);
    const out = plainTriads(colourful, 'major');
    expect(names(out)).toEqual(['C', 'Dm', 'G', 'Am', 'Em', 'F', 'Bb', 'Fm', 'B°']);
    // The applied E7 is plain iii now; Bb7 keeps its own triad (no Bb in C
    // major); a borrowed iv that's already a triad is left alone.
    expect(out[4].appliedTo).toBeUndefined();
    expect(out[4].fn).toBe('T');
    // Its seventh gone, a chord that stood on it goes back to root position.
    expect(out[8].inversion).toBe(0);
  });

  it('keeps the major V of a minor key', () => {
    const minor = prog([0, 'm7', 'T'], [5, 'm9', 'PD'], [7, '7', 'D'], [7, '7sus4', 'D'], [8, 'maj7', 'T']);
    expect(names(plainTriads(minor, 'minor'), Cm)).toEqual(['Cm', 'Fm', 'G', 'G', 'Ab']);
  });
});

describe('simplifyChords', () => {
  const doc = generateDoc({ seed: 31, formId: 'verse-chorus', tonic: 0, mode: 'major' });
  const verses = doc.form.map((f, i) => (f.sectionId === 'verse' ? i : -1)).filter(i => i >= 0);
  const onsets = (rhythm: number[]) => { const o: number[] = []; rhythm.reduce((p, d) => (o.push(p), p + d), 0); return o; };

  const ways: Simplify[] = [{ kind: 'limit', count: 2 }, { kind: 'limit', count: 1 }, { kind: 'perBar' }, { kind: 'triads' }];

  it.each(ways)('keeps voicings, guide tones and bass consistent with the new chords (%o)', how => {
    let simplifiedSome = 0;
    for (const seed of [3, 31, 77, 120]) {
      const d = generateDoc({ seed, formId: 'verse-chorus' });
      const part = d.form.findIndex(f => f.sectionId === 'chorus');
      const edited = simplifyChords(d, part, how);
      if (edited === d) continue;
      simplifiedSome++;
      const before = d.sections.chorus.harmony;
      const s = edited.sections.chorus;
      expect(s.locks.harmony).toBe(true);
      expect(s.voicing).toHaveLength(s.harmony.length);
      expect(s.guideTones).toHaveLength(s.harmony.length);
      expect(s.harmony.reduce((t, c) => t + c.dur, 0)).toBe(s.bars * BAR);
      const on = onsets(s.bassRhythm);
      s.harmony.forEach((c, i) => {
        // Every voicing sounds its chord's root and third (shells and
        // ninths drop the fifth).
        const pcs = new Set(s.voicing[i].map(m => mod12(m - d.key.tonic)));
        chordTones(c).slice(0, 2).forEach(t => expect(pcs.has(t)).toBe(true));
        // A changed chord's downbeat bass is its bass note.
        const changed = !before.some(o => o.start === c.start && o.dur === c.dur && o.root === c.root && o.quality === c.quality && o.inversion === c.inversion);
        const down = on.indexOf(c.start);
        if (changed && down !== -1) expect(mod12(s.bass[down] - 24 - d.key.tonic)).toBe(chordBassPc(c));
      });
    }
    expect(simplifiedSome).toBeGreaterThan(0);
  });

  it('applies to every instance of the section, and is a no-op when there is nothing to simplify', () => {
    const edited = simplifyChords(doc, verses[0], { kind: 'limit', count: 1 });
    const parts = realizeSong(edited);
    expect(new Set(parts[verses[0]].chords).size).toBe(1);
    verses.forEach(i => expect(parts[i].chords).toEqual(parts[verses[0]].chords));
    expect(simplifyChords(edited, verses[0], { kind: 'limit', count: 1 })).toBe(edited);
  });
});
