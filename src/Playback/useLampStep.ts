import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { lampToPositions } from '../SongStructure/beatMapping';
import { stepBarsOf } from '../Core/drumBars';
import { clampRegion, upcomingStep } from './loop';
import { setCurrentBeat, SongState } from '../reducers';
import { PHONE_QUERY, useMediaQuery } from '../Components/useMediaQuery';

// The element that scrolls the lamps sideways (the open part).
function sidewaysScroller(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowX;
    if (overflow === 'auto' || overflow === 'scroll') return node;
  }
  return null;
}

// The bar the view shows while playing - turned to (phones) or centered
// (wider screens) - by part. The staves draw their clefs and key signatures
// at its start, rather than at the part's.
export interface ShownBar {
  part: number;
  bar: number;
}
let shownBar: ShownBar | null = null;
const shownBarListeners = new Set<() => void>();
export function showingBar(part: number, bar: number) {
  if (shownBar?.part === part && shownBar.bar === bar) return;
  shownBar = { part, bar };
  shownBarListeners.forEach((listener) => listener());
}
const subscribeShownBar = (listener: () => void) => {
  shownBarListeners.add(listener);
  return () => { shownBarListeners.delete(listener); };
};
export const useShownBar = () => useSyncExternalStore(subscribeShownBar, () => shownBar);

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
    // Scrolls so the bar starting at `barStart` is `room` in from the left
    // edge - or `target` itself, when the bar is too wide for `target` to
    // fit. Instant, not smooth: this runs on every playback step, and a
    // scroll animation is main-thread work that can delay pending
    // sample-load promises past their scheduled audio-clock time.
    show(target: HTMLElement, barStart: HTMLElement, room = 0) {
      const fits = target.getBoundingClientRect().right - barStart.getBoundingClientRect().left <= scroller.clientWidth - inset - room;
      scroller.scrollLeft += (fits ? barStart : target).getBoundingClientRect().left - viewLeft - inset - room;
    },
    // Scrolls the bar from `barStart` to `barEnd` (its first and last
    // columns) to the middle of the view - unless it's wider than the view,
    // when it's shown as `show` would, so `target` stays in sight.
    center(target: HTMLElement, barStart: HTMLElement, barEnd: HTMLElement) {
      const left = barStart.getBoundingClientRect().left;
      const right = barEnd.getBoundingClientRect().right;
      if (right - left > scroller.clientWidth - 2 * inset) {
        this.show(target, barStart);
        return;
      }
      scroller.scrollLeft += (left + right) / 2 - (viewLeft + scroller.clientWidth / 2);
    },
    // Back to where the part opens.
    toStart() {
      scroller.scrollLeft = 0;
    },
    // A point on screen as content x: from the left edge of the part's rows
    // (whatever the scroll).
    contentX(clientX: number) {
      return clientX - viewLeft + scroller.scrollLeft - inset;
    },
    // Marks the stretch of the part playing (content x), and where the
    // dimming before it starts, on the overlays that dim the rest of the
    // part (App's [data-dim]) - set on them alone, as setting them on the
    // part view would restyle everything in it at every bar.
    mark(dimStart: number, from: number, to: number) {
      scroller.querySelectorAll<HTMLElement>('[data-dim]').forEach((overlay) => {
        overlay.style.setProperty('--dim-start', `${dimStart}px`);
        overlay.style.setProperty('--bar-from', `${from}px`);
        overlay.style.setProperty('--bar-to', `${to}px`);
      });
    },
  };
}

// Half the gap between bars: a bar's stretch runs halfway into the gaps
// either side of it (where its bar lines are).
const HALF_BAR_GAP = 24;

// Wider screens: puts `step`'s bar in the middle of the view - or, `atStart`,
// back where the part opens - and marks it as the one playing.
export function playBar(lamps: HTMLInputElement[], drumGroove: number[], step: number, atStart = false, stepBars = stepBarsOf(drumGroove)) {
  const column = (i: number) => (i >= 0 ? columnOf(lamps, drumGroove, i) : null);
  const target = column(step);
  const view = target && partView(target);
  if (!target || !view) return;
  const bar = stepBars[step];
  const first = stepBars.indexOf(bar);
  const last = stepBars.lastIndexOf(bar);
  const barStart = column(first);
  const barEnd = column(last);
  if (!barStart || !barEnd) return;
  if (atStart) view.toStart();
  else view.center(target, barStart, barEnd);
  // From the gap before a bar's first column to the gap after its last.
  const span = (from: number, to: number) => {
    const start = column(from)!.getBoundingClientRect();
    const end = column(to)!.getBoundingClientRect();
    const before = column(from - 1)?.getBoundingClientRect();
    const after = column(to + 1)?.getBoundingClientRect();
    return [
      view.contentX(before ? (before.right + start.left) / 2 : start.left - HALF_BAR_GAP),
      view.contentX(after ? (end.right + after.left) / 2 : end.right + HALF_BAR_GAP),
    ];
  };
  const [from, to] = span(first, last);
  // Before it, from the part's own start (its tracker's left edge) - the
  // room its clefs leave behind as they move with the bar playing included
  // - once its first bar has gone by; nothing while that one plays.
  const tracker = target.closest<HTMLElement>('[data-step-tracker]');
  const partStart = tracker ? view.contentX(tracker.getBoundingClientRect().left) : span(0, 0)[0];
  view.mark(bar === stepBars[0] ? from : partStart, from, to);
}

// Turns the part to `step`'s page: its bar where the part's first bar sits
// unscrolled, so the staves' clefs and key signatures fit before it (or the
// step itself, where the bar is wider than the screen).
export function turnTo(lamps: HTMLInputElement[], drumGroove: number[], step: number, stepBars = stepBarsOf(drumGroove)) {
  const target = columnOf(lamps, drumGroove, step);
  const barStart = columnOf(lamps, drumGroove, stepBars.indexOf(stepBars[step]));
  const first = columnOf(lamps, drumGroove, 0);
  const view = target && partView(target);
  if (view && barStart && first) view.show(target, barStart, view.contentX(first.getBoundingClientRect().left));
}

export function useLampStep(
  lampsRef: React.MutableRefObject<HTMLInputElement[]>,
  part: number,
  drumGroove: number[],
  bassGroove: number[],
  chordsGroove: number[],
  // Center the part's first bar too (playback ran on into it from another
  // part), rather than playing it where the part opens.
  centerFirstBar = false,
) {
  const dispatch = useDispatch();
  const store = useStore<{ song: SongState }>();
  const stepBars = useMemo(() => stepBarsOf(drumGroove), [drumGroove]);
  const phone = useMediaQuery(PHONE_QUERY);
  // The bar wider screens last centered (part and bar).
  const centeredRef = useRef<string | null>(null);

  // Wider screens keep the playing bar in the middle of the window, with
  // what was just played to its left and what's coming to its right (the
  // rest dimmed) - all but a part's first bar when playback starts there,
  // which plays where the part opens. A bar is centered as playback reaches
  // it (or jumps to it - a loop, a seek), and again if its lit step is out
  // of view (the part scrolled away), but not on every step - the part can
  // still be scrolled by hand within a bar. Instant, as `show` is.
  const center = useCallback((lampIndex: number) => {
    const current = columnOf(lampsRef.current, drumGroove, lampIndex);
    const view = current && partView(current);
    if (!current || !view) return;
    const bar = stepBars[lampIndex];
    const key = `${part}:${bar}`;
    if (key === centeredRef.current && view.inView(current)) return;
    centeredRef.current = key;
    playBar(lampsRef.current, drumGroove, lampIndex, bar === stepBars[0] && !centerFirstBar, stepBars);
    showingBar(part, bar);
  }, [lampsRef, part, drumGroove, stepBars, centerFirstBar]);

  // Phones turn the part like pages rather than scrolling with every
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
      showingBar(part, stepBars[next]);
    } else if (!view.inView(current)) {
      turnTo(lampsRef.current, drumGroove, lampIndex, stepBars);
      showingBar(part, stepBars[lampIndex]);
    }
  }, [lampsRef, part, drumGroove, stepBars, store]);

  // `scroll` is false for a lamp the user clicked: it's already in view.
  return useCallback((lampIndex: number, scroll = true) => {
    const lamp = lampsRef.current[lampIndex];
    if (lamp) {
      lamp.checked = true;
      if (scroll) (phone ? follow : center)(lampIndex);
    }
    // Positions only advance where the drum, bass and chord grids line up, so
    // most steps leave them unchanged. Skipping those dispatches spares a
    // re-render of every connected component on each step.
    const next = [part, ...lampToPositions(lampIndex, drumGroove, bassGroove, chordsGroove)];
    const current = store.getState().song.selectedBeat;
    if (next.every((value, i) => value === current[i])) return;
    dispatch(setCurrentBeat(next));
  }, [lampsRef, phone, follow, center, part, drumGroove, bassGroove, chordsGroove, dispatch, store]);
}
