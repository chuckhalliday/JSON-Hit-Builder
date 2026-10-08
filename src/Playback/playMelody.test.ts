import { melodySegments } from './playMelody';

describe('melodySegments', () => {
  const notes = [{ beat: 1, dur: 1, midi: 64 }, { beat: 2, dur: 2, midi: 67 }, { beat: 6, dur: 2, midi: 65 }];

  it('lays the stretch out as rests and notes that add up to it exactly', () => {
    const segments = melodySegments({ notes, from: 0, to: 8 });
    expect(segments).toEqual([
      { length: 1, midi: null, sound: 0 },
      { length: 1, midi: 64, sound: 1 },
      { length: 4, midi: 67, sound: 2 },
      { length: 2, midi: 65, sound: 2 },
    ]);
    expect(segments.reduce((t, s) => t + s.length, 0)).toBe(8);
  });

  it('plays only the notes starting inside a resumed or looped stretch, cut at its end', () => {
    expect(melodySegments({ notes, from: 1.5, to: 7 })).toEqual([
      { length: 0.5, midi: null, sound: 0 },
      { length: 4, midi: 67, sound: 2 },
      { length: 1, midi: 65, sound: 1 },
    ]);
    expect(melodySegments({ notes: [], from: 0, to: 4 })).toEqual([{ length: 4, midi: null, sound: 0 }]);
  });
});

describe('sung segments', () => {
  it('carries each note\'s syllable sounds, pronounced by whole words', () => {
    const notes = [
      { beat: 0, dur: 1, midi: 64, text: 'to', hyphen: true },
      { beat: 1, dur: 1, midi: 67, text: 'night', hyphen: false },
      { beat: 2, dur: 1, midi: 65, text: 'love', hyphen: false },
    ];
    // A stretch starting mid-word still sings "night" as in "tonight".
    const segments = melodySegments({ notes, from: 1, to: 3 });
    expect(segments.map(s => s.syllable && [...s.syllable.onset, s.syllable.vowel, ...s.syllable.coda].join(' '))).toEqual(['N AY T', 'L AH V']);
    // Without words, plain notes.
    expect(melodySegments({ notes: notes.map(({ beat, dur, midi }) => ({ beat, dur, midi })), from: 0, to: 3 }).every(s => !s.syllable)).toBe(true);
  });
});
