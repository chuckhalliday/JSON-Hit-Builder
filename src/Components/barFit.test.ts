import { barFit, fitBars } from './barFit';
import { stepXs, bassMeasures } from '../SongStructure/bass';

const eighths = new Array(8).fill(0.5);
const sixteenths = new Array(16).fill(0.25);

describe('fitting bars to the screen', () => {
  it('leaves a bar that is already the width as it was', () => {
    // 8 eighths: 38px a step, 48 after a beat, 78 after the bar.
    const fit = fitBars(eighths, 374);
    const xs = stepXs(eighths);
    expect(xs.map(fit.x)).toEqual(xs);
    expect(fit.columns.map(c => c.width)).toEqual(new Array(8).fill(30));
    // The rows' own spacing: the 8px gap, 10 more after a beat, 40 after the bar.
    expect(fit.columns.slice(0, 7).map(c => c.marginRight)).toEqual([8, 18, 8, 18, 8, 18, 8]);
    expect(fit.columns[0].marginLeft).toBe(0);
    expect(fit.columns[7].line).toBeCloseTo(49.5);
  });

  it('gives every bar the same width, squeezing dense ones and spreading sparse ones', () => {
    const groove = [...eighths, ...sixteenths, ...eighths];
    const fit = fitBars(groove, 400);
    const xs = stepXs([...groove, 0]);
    // Bars start at 0, 8 and 24.
    expect([0, 8, 24, 32].map(i => fit.x(xs[i]))).toEqual([115, 515, 915, 1315]);
    expect(fit.columns[0].width).toBeCloseTo(30 * 400 / 374);
    expect(fit.columns[8].width).toBeCloseTo(30 * 400 / (16 * 38 + 3 * 10 + 40));
    // Columns tile the rows: each one's left edge follows on from the last.
    let at = 115 - 15 + fit.columns[0].marginLeft;
    groove.forEach((_, i) => {
      expect(at + fit.columns[i].width / 2).toBeCloseTo(fit.x(xs[i]));
      at += fit.columns[i].width + fit.columns[i].marginRight;
    });
  });

  it('puts the bar lines where the staff draws them, moved with their bars', () => {
    const groove = [...eighths, ...sixteenths];
    const fit = fitBars(groove, 400);
    const xs = stepXs(groove);
    const [, lines] = bassMeasures(new Array(16).fill(0.5), groove);
    const left = (i: number) => fit.x(xs[i]) - fit.columns[i].width / 2;
    expect(left(7) + fit.columns[7].line + 1.5).toBeCloseTo(fit.x(lines[0]));
    expect(left(23) + fit.columns[23].line + 1.5).toBeCloseTo(fit.x(lines[1]));
  });

  it('leaves what comes before the first bar where it is', () => {
    const fit = fitBars(sixteenths, 300);
    expect(fit.x(45)).toBe(45);
    expect(fit.x(-10)).toBe(-10);
  });

  it('keeps one fit per groove and width', () => {
    const groove = [...eighths];
    expect(barFit(groove, 380)).toBe(barFit(groove, 380));
    expect(barFit(groove, 390)).not.toBe(barFit(groove, 380));
  });
});
