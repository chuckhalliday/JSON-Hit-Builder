import { randomGroove } from './groove'
import { createDrums } from './drums'
import { createChords } from './chords';
import { createRandomSong } from './createSong';
import { bassPitch } from './bassPitch';
import { tone, midiTone } from './tone';

describe('primaryGroove', () => {
  it('should return an array with total duration equal to or less than 8', () => {
    const groove = randomGroove();
    const totalDuration = groove.reduce((sum, value) => sum + value, 0);

    expect(totalDuration).toBeLessThanOrEqual(8);
  });

  it('should only contain values from the randomValues array', () => {
    const groove = randomGroove();
    const randomValues = [0.25, 0.5, 0.75, 1, 1.5, 2];

    const containsInvalidValues = groove.some(value => !randomValues.includes(value));
    expect(containsInvalidValues).toBe(false);
  });

  it('should have measure sums that are multiples of 2', () => {
    const groove = randomGroove();
    let measureSum = 0;

    for (const value of groove) {
      measureSum += value;
      if (measureSum === 2) {
        measureSum = 0;
      } else if (measureSum > 2) {
        fail('Measure sum is not a multiple of 2');
      }
    }
  });
});

describe('createDrums', () => {
  it('handles edge case of empty input', () => {
    const bassGroove: number[][] = [[]];
    const result = createDrums(bassGroove, 0);
    expect(result).toEqual([[]]);
  });
  it('produces an array that sums to equal the input array', () => {
    const bassGroove: number[][] = [[0.5, 0.25, 0.25, 1, 0.5], [0.5, 0.25, 0.25, 1, 0.5]];
    const result = createDrums(bassGroove, 0.3);
  
    const inputSum = bassGroove.reduce((sum, innerArray) => {
      return sum + innerArray.reduce((innerSum, value) => innerSum + value, 0);
    }, 0);
  
    const outputSum = result.reduce((sum, innerArray) => {
      return sum + innerArray.reduce((innerSum, value) => innerSum + value, 0);
    }, 0);
  
    expect(outputSum).toEqual(inputSum);
  });
});

describe('createChords', () => {
  it('handles edge case of empty input', () => {
    const bassGroove: number[] = [];
    const result = createChords(bassGroove);
    expect(result).toEqual([]);
  });
  it('produces an array that sums to equal the input array', () => {
    const bassGroove: number[] = [0.5, 0.25, 0.25, 1.5, 0.5];
    const result = createChords(bassGroove);

    const inputSum = bassGroove.reduce((sum, value) => sum + value, 0);
    const outputSum = result.reduce((sum, value) => sum + value, 0);

    expect(outputSum).toEqual(inputSum);
  });
});

describe('createRandomSong (seeded generation)', () => {
  it('reproduces an identical song for the same seed', () => {
    const a = createRandomSong(12345);
    const b = createRandomSong(12345);
    expect(a.seed).toBe(12345);
    expect(JSON.stringify(b.songStructure)).toEqual(JSON.stringify(a.songStructure));
    expect(b.bpm).toEqual(a.bpm);
    expect(b.key).toEqual(a.key);
  });

  it('produces different songs for different seeds', () => {
    const a = createRandomSong(1);
    const b = createRandomSong(2);
    expect(JSON.stringify(a.songStructure)).not.toEqual(JSON.stringify(b.songStructure));
  });

  it('returns the chosen seed when none is supplied, and that seed reproduces it', () => {
    const a = createRandomSong();
    expect(typeof a.seed).toBe('number');
    const b = createRandomSong(a.seed);
    expect(JSON.stringify(b.songStructure)).toEqual(JSON.stringify(a.songStructure));
  });
});

describe('bassPitch (staff position -> pitch)', () => {
  // Every staff Y + accidental the old mapBassValue() switch handled, with the
  // note it must resolve to. Guards the extracted mapping against regressions.
  const cases: [number, string, keyof typeof tone, number][] = [
    [120, 'none', 'E', 1], [120, 'flat', 'Eb', 1],
    [67.5, 'none', 'E', 2], [67.5, 'flat', 'Eb', 2],
    [112.5, 'none', 'F', 1], [112.5, 'sharp', 'Gb', 1],
    [60, 'none', 'F', 2], [60, 'sharp', 'Gb', 2],
    [105, 'none', 'G', 1], [105, 'sharp', 'Ab', 1], [105, 'flat', 'Gb', 1],
    [52.5, 'none', 'G', 2], [52.5, 'sharp', 'Ab', 2], [52.5, 'flat', 'Gb', 2],
    [97.5, 'none', 'A', 1], [97.5, 'sharp', 'Bb', 1], [97.5, 'flat', 'Ab', 1],
    [45, 'none', 'A', 2], [45, 'sharp', 'Bb', 2], [45, 'flat', 'Ab', 2],
    [90, 'none', 'B', 1], [90, 'flat', 'Bb', 1],
    [37.5, 'none', 'B', 2], [37.5, 'flat', 'Bb', 2],
    [82.5, 'none', 'C', 2], [82.5, 'sharp', 'Db', 2],
    [30, 'none', 'C', 3], [30, 'sharp', 'Db', 3],
    [75, 'none', 'D', 2], [75, 'sharp', 'Eb', 2], [75, 'flat', 'Db', 2],
  ];

  it.each(cases)('y=%p acc=%p resolves to %p[%p]', (y, acc, name, octave) => {
    expect(bassPitch(y as number, acc as string)).toEqual({
      osc: tone[name as keyof typeof tone][octave as number],
      midi: midiTone[name as keyof typeof midiTone][octave as number],
    });
  });

  it('treats an off-grid / rest position as a rest (pitch <= 0)', () => {
    expect(bassPitch(-20, 'none').osc).toBeLessThanOrEqual(0);
    expect(bassPitch(-20, 'none').midi).toBeLessThanOrEqual(0);
  });
});