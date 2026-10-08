import { lineSyllables, partLyrics, placeLyrics, syllabify, withLyricMove } from './lyrics';
import { generateDoc } from './generate';
import { realizeSong } from './realize';
import { stepXs } from '../SongStructure/bass';

const eighths = (bars: number) => new Array(bars * 8).fill(0.5);
const beatsOf = (text: string, groove: number[]) => placeLyrics(text, groove).syllables.map(s => s.beat);

describe('syllabify', () => {
  it('splits common lyric words', () => {
    const cases: Record<string, string> = {
      beautiful: 'beau·ti·ful', tomorrow: 'to·mor·row', little: 'lit·tle', people: 'peo·ple',
      running: 'run·ning', singing: 'sing·ing', father: 'fa·ther', control: 'con·trol',
      children: 'chil·dren', laughter: 'laugh·ter', nation: 'na·tion', lonely: 'lone·ly',
      careful: 'care·ful', something: 'some·thing', someone: 'some·one', remember: 're·mem·ber',
      wanted: 'wan·ted', kisses: 'kis·ses',
    };
    for (const [word, split] of Object.entries(cases)) expect(syllabify(word).join('·')).toBe(split);
  });

  it('keeps one-syllable words whole, silent endings included', () => {
    for (const word of ['love', 'fire', 'heart', 'smile', 'loves', 'walked', 'hours', 'the', "don't"]) {
      expect(syllabify(word)).toEqual([word]);
    }
  });

  it('splits exactly at hyphens the writer puts in', () => {
    expect(syllabify('ev-ry')).toEqual(['ev', 'ry']);
    expect(syllabify('beau-ti-ful')).toEqual(['beau', 'ti', 'ful']);
  });

  it('keeps punctuation on the syllable it touches, and skips bare punctuation', () => {
    expect(syllabify('"baby,')).toEqual(['"ba', 'by,']);
    expect(syllabify('—')).toEqual([]);
    expect(lineSyllables('oh, baby').map(s => [s.text, s.hyphen])).toEqual([['oh,', false], ['ba', true], ['by', false]]);
  });
});

describe('placeLyrics', () => {
  it('places nothing until words are written, or for a "-" part', () => {
    expect(placeLyrics('', eighths(8)).syllables).toEqual([]);
    expect(placeLyrics('  \n ', eighths(8)).syllables).toEqual([]);
    expect(placeLyrics('-', eighths(8)).syllables).toEqual([]);
  });

  it('gives each line its share of the bars, landing on the downbeat of its last bar', () => {
    // 8 bars, 4 lines: a line every 2 bars; three syllables run in on the beat.
    expect(beatsOf('one two three\nfour five six\nsev en eight\nnine ten twelve', eighths(8)))
      .toEqual([2, 3, 4, 10, 11, 12, 18, 19, 20, 26, 27, 28]);
  });

  it('moves to eighths, then every step, as a line gets busier', () => {
    // Seven syllables don't fit on the beat before the landing: eighths.
    expect(beatsOf('a b c d e f g', eighths(2))).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4]);
    // On a sixteenth grid, a line too busy for eighths uses every step.
    const sixteenths = new Array(32).fill(0.25);
    const busy = beatsOf('a b c d e f g h i j k', sixteenths);
    expect(busy).toHaveLength(11);
    expect(busy[busy.length - 1]).toBe(4);
    expect(busy[1] - busy[0]).toBe(0.25);
  });

  it('starts at the top of the phrase when even every step before the landing is too few', () => {
    const line = new Array(12).fill('la').join(' ');
    expect(beatsOf(line, eighths(2))).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]);
  });

  it('counts syllables that find no step as overflow', () => {
    const line = new Array(20).fill('la').join(' ');
    const placed = placeLyrics(line, eighths(2));
    expect(placed.total).toBe(20);
    expect(placed.syllables).toHaveLength(16);
    expect(placed.overflow).toBe(4);
  });

  it('splits bars into beats when there are more lines than bars', () => {
    // 1 bar, 2 lines: two-beat phrases landing on their second beat.
    expect(beatsOf('a b\nc d', eighths(1))).toEqual([0, 1, 2, 3]);
  });

  it('lands on real step indices, triplets included, and marks word continuations', () => {
    // One bar: an eighth-note triplet on beat 1, then straight eighths. Eight
    // syllables are more than the steps up to beat 3, so they run from the top.
    const groove = [0.16, 0.17, 0.17, ...new Array(7).fill(0.5)];
    const placed = placeLyrics('beau-ti-ful day is here a-gain', groove);
    expect(placed.syllables.map(s => [s.text, s.step, s.hyphen])).toEqual([
      ['beau', 0, true], ['ti', 1, true], ['ful', 2, false], ['day', 3, false],
      ['is', 4, false], ['here', 5, false], ['a', 6, true], ['gain', 7, false],
    ]);
  });
});

describe('dragged syllables', () => {
  const text = 'one two three\nfour five six';
  // 4 bars of eighths: two-bar phrases, each landing on beats 2, 3, 4 of its stretch.
  const groove = eighths(4);

  it('moves a syllable to the beat it was dragged to, and marks it', () => {
    const timing = withLyricMove(text, undefined, 0, 1, 2.5);
    const placed = placeLyrics(text, groove, timing).syllables;
    expect(placed.map(s => s.beat)).toEqual([2, 2.5, 4, 10, 11, 12]);
    expect(placed.map(s => s.moved)).toEqual([false, true, false, false, false, false]);
    expect(placed[1].step).toBe(5);
  });

  it('can move a syllable anywhere between its neighbours, across the phrase it started in', () => {
    // The first syllable of line 2 back into line 1's stretch, just past "three".
    const placed = placeLyrics(text, groove, withLyricMove(text, undefined, 1, 0, 4.5)).syllables;
    expect(placed[3].beat).toBe(4.5);
  });

  it("puts back moves that land off the grid or on or past a neighbour", () => {
    for (const beat of [2.3, 2, 4, 9]) {
      const placed = placeLyrics(text, groove, withLyricMove(text, undefined, 0, 1, beat)).syllables;
      expect(placed[1]).toMatchObject({ beat: 3, moved: false });
    }
  });

  it('keeps moves in order when two cross: the later one goes back', () => {
    let timing = withLyricMove(text, undefined, 0, 0, 3.5);
    timing = withLyricMove(text, timing, 0, 1, 2.5);
    const placed = placeLyrics(text, groove, timing).syllables;
    const beats = placed.map(s => s.beat);
    beats.slice(1).forEach((b, i) => expect(b).toBeGreaterThan(beats[i]));
  });

  it('forgets a line\'s moves once the line is reworded, and keeps the other lines\'', () => {
    let timing = withLyricMove(text, undefined, 0, 1, 2.5);
    timing = withLyricMove(text, timing, 1, 2, 13);
    const reworded = 'one two three four\nfour five six';
    const placed = placeLyrics(reworded, groove, timing).syllables;
    expect(placed.filter(s => s.moved).map(s => [s.line, s.at])).toEqual([[1, 2]]);
    // Putting every move back clears the timing altogether.
    expect(withLyricMove(text, withLyricMove(text, timing, 0, 1, null), 1, 2, null)).toBeUndefined();
  });
});

describe('partLyrics', () => {
  const parts = [
    { type: 'Verse', lyrics: 'first verse' },
    { type: 'Chorus', lyrics: 'the hook' },
    { type: 'Verse' },
    { type: 'Chorus' },
    { type: 'Chorus', lyrics: '-' },
    { type: 'Chorus' },
    { type: 'Bridge' },
  ];

  it("uses a part's own words, or a repeated section's earlier ones", () => {
    expect(partLyrics(parts, 0)).toEqual({ text: 'first verse', from: null });
    expect(partLyrics(parts, 3)).toEqual({ text: 'the hook', from: 1 });
    // Past a wordless chorus to the last one with words.
    expect(partLyrics(parts, 5)).toEqual({ text: 'the hook', from: 1 });
  });

  it('carries the dragged syllables of the words a repeat sings', () => {
    const timing = withLyricMove('the hook', undefined, 0, 0, 1);
    const withTiming = parts.map((p, i) => (i === 1 ? { ...p, lyricTiming: timing } : p));
    expect(partLyrics(withTiming, 3).timing).toBe(timing);
    expect(partLyrics(withTiming, 1).timing).toBe(timing);
  });

  it("doesn't repeat verse words, and leaves '-' parts and first instances wordless", () => {
    expect(partLyrics(parts, 2)).toEqual({ text: '', from: null });
    expect(partLyrics(parts, 4)).toEqual({ text: '', from: null });
    expect(partLyrics(parts, 6)).toEqual({ text: '', from: null });
  });
});

describe('stepXs', () => {
  it('matches where the staff draws the bass notes', () => {
    for (const formId of ['pop', 'verse-chorus', 'blues', 'build-drop']) {
      for (const seed of [3, 41, 977]) {
        for (const part of realizeSong(generateDoc({ seed, formId, triplet: 0.5 }))) {
          const xs = stepXs(part.drumGroove);
          const stepOnsets: number[] = [];
          part.drumGroove.reduce((t, d) => (stepOnsets.push(t), t + d), 0);
          let onset = 0;
          part.bassGroove.forEach((d, k) => {
            const step = stepOnsets.findIndex(t => Math.abs(t - onset) < 0.02);
            expect(xs[step]).toBe(part.bassGrid[k + 1]);
            onset += d;
          });
        }
      }
    }
  });
});
