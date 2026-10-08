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
