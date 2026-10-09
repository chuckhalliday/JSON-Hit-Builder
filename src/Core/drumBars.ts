// The bars of a part's drum grid, for the editor: which bar each step falls
// in, and copying one bar's pattern onto others.

import { DrumHit, Groove } from '../types';
import { BAR, beatsToTickPositions } from './time';

// One drum step to turn on or off.
export interface DrumCellEdit {
  voice: number;
  step: number;
  checked: boolean;
}

// Each step's bar and its tick within that bar. Positions are snapped to
// exact ticks, so rounded triplets line up from bar to bar.
const stepPlaces = (drumGroove: Groove) =>
  beatsToTickPositions(drumGroove).slice(0, -1).map(t => ({ bar: Math.floor(t / BAR), at: t % BAR }));

// The bar each step falls in.
export const stepBarsOf =(drumGroove: Groove) => stepPlaces(drumGroove).map(p => p.bar);

// The edits that make each bar in `to` play what bar `from` plays, on the
// given voices. Steps match by their place in the bar: a step with nothing
// at its place in `from` (a sixteenth, copying a bar of eighths) is
// cleared, and hits on steps the target bar lacks are left behind. Lists
// only the cells that change.
export function barCopyEdits(drums: DrumHit[][], drumGroove: Groove, voices: number[], from: number, to: number[]): DrumCellEdit[] {
  const places = stepPlaces(drumGroove);
  const source = new Map<number, number>();
  places.forEach((p, step) => { if (p.bar === from) source.set(p.at, step); });
  const edits: DrumCellEdit[] = [];
  places.forEach((p, step) => {
    if (!to.includes(p.bar)) return;
    const src = source.get(p.at);
    voices.forEach(voice => {
      const cell = drums[voice]?.[step];
      if (!cell) return;
      const checked = src !== undefined && !!drums[voice][src]?.checked;
      if (!!cell.checked !== checked) edits.push({ voice, step, checked });
    });
  });
  return edits;
}
