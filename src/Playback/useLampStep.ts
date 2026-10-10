import { useCallback, useMemo } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { lampToPositions } from '../SongStructure/beatMapping';
import { stepBarsOf } from '../Core/drumBars';
import { clampRegion, upcomingStep } from './loop';
import { setCurrentBeat, SongState } from '../reducers';

// The element that scrolls the lamps sideways (the open part).
function sidewaysScroller(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowX;
    if (overflow === 'auto' || overflow === 'scroll') return node;
  }
  return null;
}

// A step's column: its lamp's <label>, as wide as the step's cells.
const columnOf = (lamps: HTMLInputElement[], drumGroove: number[], step: number) =>
  (step < drumGroove.length ? lamps[step]?.parentElement ?? null : null);

// The open part's sideways view, found from one of its columns.
function partView(column: HTMLElement) {
  const scroller = column.isConnected ? sidewaysScroller(column) : null;
  if (!scroller) return null;
  const viewLeft = scroller.getBoundingClientRect().left + scroller.clientLeft;
  // Where the part's content starts when it isn't scrolled.
  const inset = parseFloat(getComputedStyle(scroller).paddingLeft) || 0;
  return {
    inView(el: HTMLElement) {
      const { left, right } = el.getBoundingClientRect();
      return left >= viewLeft - 1 && right <= viewLeft + scroller.clientWidth + 1;
    },
    // Scrolls so the bar starting at `barStart` is at the left edge - or
    // `target` itself, when the bar is too wide for `target` to fit.
    // Instant, not smooth: this runs on every playback step, and a scroll
    // animation is main-thread work that can delay pending sample-load
    // promises past their scheduled audio-clock time.
    show(target: HTMLElement, barStart: HTMLElement) {
      const fits = target.getBoundingClientRect().right - barStart.getBoundingClientRect().left <= scroller.clientWidth - inset;
      scroller.scrollLeft += (fits ? barStart : target).getBoundingClientRect().left - viewLeft - inset;
    },
  };
}

// Turns the part to `step`'s page: its bar at the left edge (or the step
// itself, where the bar is wider than the screen).
export function turnTo(lamps: HTMLInputElement[], drumGroove: number[], step: number, stepBars = stepBarsOf(drumGroove)) {
  const target = columnOf(lamps, drumGroove, step);
  const barStart = columnOf(lamps, drumGroove, stepBars.indexOf(stepBars[step]));
  const view = target && partView(target);
  if (view && barStart) view.show(target, barStart);
}

export function useLampStep(
  lampsRef: React.MutableRefObject<HTMLInputElement[]>,
  part: number,
  drumGroove: number[],
  bassGroove: number[],
  chordsGroove: number[],
) {
  const dispatch = useDispatch();
  const store = useStore<{ song: SongState }>();
  const stepBars = useMemo(() => stepBarsOf(drumGroove), [drumGroove]);

  // Playback turns the part like pages rather than scrolling with every
  // step: as a bar's last step is reached, the bar played next snaps to the
  // left edge, so it is in full view before it starts. A step lit out of
  // view (playback started off screen, or the part was scrolled away) brings
  // its own bar back.
  const follow = useCallback((lampIndex: number) => {
    const current = columnOf(lampsRef.current, drumGroove, lampIndex);
    const view = current && partView(current);
    if (!current || !view) return;
    const song = store.getState().song;
    const next = upcomingStep(part, drumGroove, lampIndex, song.loopEnabled ? clampRegion(song.loop, song.songStructure) : null);
    const nextColumn = next === null ? null : columnOf(lampsRef.current, drumGroove, next);
    if (next !== null && nextColumn && (stepBars[next] !== stepBars[lampIndex] || !view.inView(nextColumn))) {
      turnTo(lampsRef.current, drumGroove, next, stepBars);
    } else if (!view.inView(current)) {
      turnTo(lampsRef.current, drumGroove, lampIndex, stepBars);
    }
  }, [lampsRef, part, drumGroove, stepBars, store]);

  // `scroll` is false for a lamp the user clicked: it's already in view.
  return useCallback((lampIndex: number, scroll = true) => {
    const lamp = lampsRef.current[lampIndex];
    if (lamp) {
      lamp.checked = true;
      if (scroll) follow(lampIndex);
    }
    // Positions only advance where the drum, bass and chord grids line up, so
    // most steps leave them unchanged. Skipping those dispatches spares a
    // re-render of every connected component on each step.
    const next = [part, ...lampToPositions(lampIndex, drumGroove, bassGroove, chordsGroove)];
    const current = store.getState().song.selectedBeat;
    if (next.every((value, i) => value === current[i])) return;
    dispatch(setCurrentBeat(next));
  }, [lampsRef, follow, part, drumGroove, bassGroove, chordsGroove, dispatch, store]);
}
