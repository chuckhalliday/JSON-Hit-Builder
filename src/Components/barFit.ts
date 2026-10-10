// Phones fit a playing part to the screen a bar at a time: every bar takes
// the same width (a screen's), its steps spread or squeezed evenly to fill
// it, so each page turn shows exactly one whole bar.
//
// The natural layout puts each drum step's onset at a canvas x (stepXs, the
// staff's spacing), with the grid's step columns centered there. A fit moves
// those xs bar by bar - the staff's notes, chords, bar lines and words go
// along unscaled - and resizes the columns with their bar.

import { Groove } from '../types';
import { stepXs } from '../SongStructure/bass';
import { stepBarsOf } from '../Core/drumBars';

// A step column's natural width, and the rows' gap after their last column.
const COLUMN = 30;
const GAP = 8;
// A bar line sits this far past its bar's last step (as bassMeasures draws it).
const BAR_LINE = 36;

export interface ColumnFit {
  width: number;
  marginLeft: number;
  marginRight: number;
  // Where the column's bar line (if it ends a bar) sits from its left edge.
  line: number;
}

export interface BarFit {
  barWidth: number;
  // A natural canvas x, moved to its place in the fitted layout.
  x: (x: number) => number;
  // Each step column's place in the grid rows.
  columns: ColumnFit[];
}

export function fitBars(drumGroove: Groove, barWidth: number): BarFit {
  const n = drumGroove.length;
  // Every step's onset, then where the last one ends (a step appended past
  // the end doesn't move the others).
  const xs = stepXs([...drumGroove, 0]);
  const stepBars = stepBarsOf(drumGroove);
  // Where each bar starts (its first onset), then where the part ends; and
  // each step's bar among them.
  const starts: number[] = [];
  const barOf: number[] = [];
  stepBars.forEach((bar, i) => {
    if (i === 0 || bar !== stepBars[i - 1]) starts.push(xs[i]);
    barOf.push(starts.length - 1);
  });
  starts.push(xs[n]);
  const scales = starts.slice(1).map((end, m) => barWidth / (end - starts[m]));
  const origin = starts[0];

  // Before the first bar (the clef, the drum names) nothing moves.
  const x = (nx: number) => {
    if (n === 0 || nx < origin) return nx;
    let m = 0;
    while (m + 1 < scales.length && nx >= starts[m + 1]) m++;
    return origin + m * barWidth + (nx - starts[m]) * scales[m];
  };

  const scale = (i: number) => scales[barOf[Math.min(i, n - 1)]];
  // A column's left edge, centered on its moved onset; `n` is where a
  // column after the last would start.
  const left = (i: number) => x(xs[i]) - (COLUMN * scale(i)) / 2;
  const columns = drumGroove.map((_, i) => {
    const width = COLUMN * scale(i);
    const next = i + 1 < n ? left(i + 1) : left(n) - GAP * scale(i);
    return {
      width,
      // The first column moves from where it starts naturally.
      marginLeft: i === 0 ? left(0) - (origin - COLUMN / 2) : 0,
      marginRight: next - left(i) - width,
      // Centered on the staff's bar line (3px wide).
      line: x(xs[i] + BAR_LINE) - left(i) - 1.5,
    };
  });
  return { barWidth, x, columns };
}

// One fit per part's groove (and width), so a part keeps the same fit from
// render to render - the staff redraws only when it changes.
const fits = new WeakMap<Groove, BarFit>();
export function barFit(drumGroove: Groove, barWidth: number): BarFit {
  const cached = fits.get(drumGroove);
  if (cached && cached.barWidth === barWidth) return cached;
  const fit = fitBars(drumGroove, barWidth);
  fits.set(drumGroove, fit);
  return fit;
}
