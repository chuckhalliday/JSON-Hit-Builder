import { randomGroove } from './groove'
import { createDrums } from './drums'
import { createChords } from './chords';

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