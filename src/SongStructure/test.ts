import { primaryGroove } from './bass'

describe('primaryGroove', () => {
  it('should return an array with total duration equal to or less than 8', () => {
    const groove = primaryGroove();
    const totalDuration = groove.reduce((sum, value) => sum + value, 0);

    expect(totalDuration).toBeLessThanOrEqual(8);
  });

  it('should only contain values from the randomValues array', () => {
    const groove = primaryGroove();
    const randomValues = [0.25, 0.5, 0.75, 1, 1.5, 2];

    const containsInvalidValues = groove.some(value => !randomValues.includes(value));
    expect(containsInvalidValues).toBe(false);
  });

  it('should have measure sums that are multiples of 2', () => {
    const groove = primaryGroove();
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