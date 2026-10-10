import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playDrums } from "../Playback/playSong";
import { setDrumState, setDrumCells, retractDrumEdit, SongState, setCurrentBeat, setLoop, extendLoop, pickLoopSpan } from "../reducers";
import { barSpan, clampRegion, overlapsRegion, stepSpan, sum } from "../Playback/loop";
import { useDispatch, useSelector, useStore } from "react-redux";
import { PlayHandle } from "./Piano";
import styles from "../Styles/DrumMachine.module.scss";
import { DrumHit, SongStructure } from "../types";
import { useLampStep } from "../Playback/useLampStep";
import { barCopyEdits, DrumCellEdit, stepBarsOf } from "../Core/drumBars";
import { BarFit } from "./barFit";

// The drums in the store's row order (by voice), named as their titles
// show them.
const DRUM_NAMES = ["Kick", "Snare", "Low Tom", "Mid Tom", "High Tom", "Closed Hat", "Open Hat", "Ride", "Crash"];
const VOICES = [...DRUM_NAMES.keys()];
// The top row: its bar-opening steps also offer to copy every drum.
const CRASH = 8;

// Two clicks on the same title or step within this many ms make a
// double-click, also on phones, where the browser may not count taps.
const DOUBLE_CLICK_MS = 400;

// Whether the step ending at `step` (1-based count) closes a bar or a beat;
// the columns of the ruler, lamps and grid space out after those.
function stepSpacing(drumGroove: number[], step: number) {
  let sum = 0;
  let measure
  let beat

  for (let i = 0; i < step; i++) {
    sum += drumGroove[i];
    if (sum >= 3.93 && sum <= 4.07) {
      measure = 'true'
      sum = 0
    } else if (Math.abs(sum - Math.round(sum)) <= 0.005) {
      beat = 'true'
    } else {
      measure = 'false'
      beat = 'false'
    }
  }
  return {
    measure: measure,
    beat: beat
  }
}

// Each step column's place in a fitted layout (see barFit), as styles - or
// none, for the natural layout.
function useColumnStyles(fit: BarFit | undefined) {
  return useMemo(() => fit?.columns.map(c => ({
    width: c.width,
    marginLeft: c.marginLeft,
    marginRight: c.marginRight,
    '--line': `${c.line}px`,
  } as React.CSSProperties)), [fit]);
}

interface StepTrackerProps {
  onRenderWidthChange: (width: number) => void;
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
  manualSeekEpochRef?: React.MutableRefObject<number>;
  // Shown in the label column (the next part's name, on its preview).
  caption?: React.ReactNode;
  // Bars fitted to the screen (phones, while playing).
  fit?: BarFit;
}

// The bar ruler and step lamps: the part's timeline, kept apart from the
// drum grid so it can stay in view (pinned under the keyboard) while the
// sections below it are collapsed or scrolled. Its columns line up with the
// grid's and the staff's, and its width sets theirs.
export function StepTracker({ onRenderWidthChange, part, lampsRef, manualSeekEpochRef, caption, fit }: StepTrackerProps) {
  const dispatch = useDispatch()
  const song = useSelector((state: { song: SongState }) => state.song);
  const steps = song.songStructure[part].stepIds
  const drumGroove = song.songStructure[part].drumGroove
  const bassGroove = song.songStructure[part].bassGroove
  const chordsGroove = song.songStructure[part].chordsGroove

  const handleStep = useLampStep(lampsRef, part, drumGroove, bassGroove, chordsGroove);
  const trackerRef = useRef<HTMLDivElement>(null);
  const columnStyles = useColumnStyles(fit);

  let drumFractions: string[] = []

  let at = 0
  for (let i = 0; i < drumGroove.length; at += drumGroove[i], i++) {
    if (drumGroove[i] === 0.5) {
      drumFractions.push('1/8')
    } else if (drumGroove[i] === 0.25){
      drumFractions.push('1/16')
    } else if (drumGroove[i] === 0.17){
      drumFractions.push('--T')
    } else if (drumGroove[i] === 0.16){
      drumFractions.push('*8T')
    } else if (drumGroove[i] === 0.08){
      drumFractions.push('--T')
    } else if (drumGroove[i] === 0.09){
      drumFractions.push('*16T')
    } else if (Math.abs(drumGroove[i] - 1 / 3) < 0.005) {
      // A shuffle's eighth-note triplets, three to a beat.
      drumFractions.push(Math.abs(at - Math.round(at)) < 0.005 ? '*4T' : '--T')
    } else {
      // Keeps every later step's label under its own step.
      drumFractions.push('')
    }
  }

  //Array of beats
  const stepIds = [...steps.keys()]

  // Bar of each step, and which steps open a bar (they carry the bar number
  // in the ruler above the lamps).
  const stepBars = stepBarsOf(drumGroove);
  const barStart = stepBars.map((bar, i) => i === 0 || bar !== stepBars[i - 1]);
  const loopRegion = clampRegion(song.loop, song.songStructure);
  const partBeats = sum(drumGroove);
  const stepInLoop = (step: number) => {
    if (!loopRegion) return false;
    const span = stepSpan(part, drumGroove, step);
    return overlapsRegion(loopRegion, part, partBeats, span.from, span.to);
  };
  const picking = song.loopPick ?? null;

  // With Set Start / Set End armed, a clicked bar number sets that loop
  // point. Otherwise click a bar number to loop that bar; shift-click to
  // stretch the loop to include it (across parts too).
  const handleBarClick = (event: React.MouseEvent, bar: number) => {
    event.preventDefault();
    event.stopPropagation();
    const span = barSpan(part, bar);
    if (picking) {
      dispatch(pickLoopSpan(span));
    } else {
      dispatch(event.shiftKey ? extendLoop(span) : setLoop({ start: { part, beat: span.from }, end: { part, beat: span.to } }));
    }
  };

  useEffect(() => {
    if (trackerRef.current) {
      const width = trackerRef.current.scrollWidth;
      onRenderWidthChange(width);
    }
  }, [onRenderWidthChange, drumGroove, fit]);

  return (
    <div className={fit ? `${styles.machine} ${styles.fit}` : styles.machine} ref={trackerRef} loop-pick={picking ?? undefined}>
      {/* Holds the drum grid's label column, so the columns line up. */}
      <div className={styles.labelList}>
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>

      <div className={styles.grid}>
        {/* Bar ruler: loop points */}
        <div className={styles.row}>
          {stepIds.map((stepId) => {
            const spacing = stepSpacing(drumGroove, stepId + 1)
            const bar = stepBars[stepId]
            return (
              <span
                key={stepId}
                className={styles.barCell}
                style={columnStyles?.[stepId]}
                measure-end={spacing.measure}
                beat-end={spacing.beat}
                in-loop={stepInLoop(stepId) ? (song.loopEnabled ? 'on' : 'off') : undefined}
              >
                {barStart[stepId] && (
                  <button
                    type="button"
                    className={styles.barTag}
                    onClick={(e) => handleBarClick(e, bar)}
                    title="Loop this bar (shift-click to extend the loop to it)"
                  >
                    {bar + 1}
                  </button>
                )}
              </span>
            )
          })}
        </div>
        {/* Renders ticks */}
        <div className={styles.row}>
          {stepIds.map((stepId) => {
            const { measure, beat } = stepSpacing(drumGroove, stepId + 1)
            return(
            <label key={stepId} className={styles.lamp} style={columnStyles?.[stepId]} measure-end={measure} beat-end={beat}>
              <label className={styles.grooveLabel}>
                {drumFractions[stepId]}
              </label>
              <input
                type="radio"
                name="lamp"
                id={stepId.toString()}
                ref={(elm) => {
                  if (!elm) return;
                  lampsRef.current[stepId] = elm;
                }}
                className={styles.lamp__input}
                onClick={(event) => {
                  // With Set Start / Set End armed, the lamp picks a loop
                  // point (that step) instead of moving the playhead.
                  if (picking) {
                    event.preventDefault();
                    dispatch(pickLoopSpan(stepSpan(part, drumGroove, stepId)));
                    return;
                  }
                  // Not onChange: handleStep mutates lamp.checked directly (see
                  // useLampStep) to avoid a re-render on every playback step.
                  // That bypasses React's change-detection tracker for radios,
                  // so a manual click on a lamp the playhead already visited
                  // can look like a no-op change and silently drop onChange.
                  // onClick fires unconditionally and isn't affected.
                  if (manualSeekEpochRef) {
                    manualSeekEpochRef.current++;
                  }
                  handleStep(stepId, false);
                }}
              />
              <div className={styles.lamp__content} />
            </label>
            )
          })}
        </div>
      </div>
    </div>
  );
}

interface DrumMachineProps {
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
  onPlayingChange?: (isPlaying: boolean) => void;
  // Stretch the rows to share its parent's height (phones), rather than
  // keeping their fixed size.
  fill?: boolean;
  // Which drums are muted (by voice), and muting or unmuting one - by
  // clicking its title.
  muted?: boolean[];
  onToggleMute?: (voice: number) => void;
  // Bars fitted to the screen (phones, while playing).
  fit?: BarFit;
}

// The menu a double-click opens: on a title (`step` null) it fills or
// clears the drum's whole part, on a step that step's bar. A bar's first
// step can also copy bars - see menuItems.
interface DrumMenu {
  voice: number;
  step: number | null;
  anchor: DOMRect;
}

// One of its options, with the edits it makes.
interface MenuItem {
  label: string;
  edits: DrumCellEdit[];
}

// The drum step grid. Its bar ruler and lamps are the StepTracker above.
const DrumMachine = forwardRef<PlayHandle, DrumMachineProps>(function DrumMachine({
  part,
  lampsRef,
  onPlayingChange,
  fill,
  muted,
  onToggleMute,
  fit,
}, ref) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const stopRef = useRef(false);
  const dispatch = useDispatch()
  const store = useStore<{ song: SongState }>();
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const song = useSelector((state: { song: SongState }) => state.song);
  const bpm = song.bpm
  const start = song.selectedBeat[1]
  const midi = song.midi
  const acoustic = song.acoustic
  const drums = song.songStructure[part].drums
  const steps = song.songStructure[part].stepIds
  const drumGroove = song.songStructure[part].drumGroove
  const bassGroove = song.songStructure[part].bassGroove
  const chordsGroove = song.songStructure[part].chordsGroove
  const numOfSteps = drumGroove.length

  const handleStep = useLampStep(lampsRef, part, drumGroove, bassGroove, chordsGroove);
  const columnStyles = useColumnStyles(fit);

    // Filled by the checkbox ref callbacks below. (Its initial value used to
    // be a grid of detached <input>s, built on every render and thrown away.)
    const stepsRef = React.useRef<HTMLInputElement[][]>([]);
  
    useEffect(() => {
      for (let trackId = 0; trackId < drums.length; trackId++) {
        for (let i = 0; i < numOfSteps; i++) {
          const inputElement = stepsRef.current[trackId]?.[i];
          // Mirror the store both ways: a re-roll or an edit propagated from
          // another instance of this section can also clear cells.
          if (inputElement && drums[trackId]?.[i]) {
            inputElement.checked = drums[trackId][i].checked === true;
          }
        }
      }
    }, [drums]);
  

  // The step toggled last and the song either side of it, so the second
  // click of a double-click can take the first one's toggle back.
  const lastToggleRef = useRef<{ voice: number, step: number, time: number, before: SongStructure, after: SongStructure } | null>(null);

  function updateDrumState(trackId: number, stepId: number) {
    const drumHits = {
      index: stepId,
      checked: stepsRef.current[trackId][stepId].checked
    }
    const before = store.getState().song.songStructure;
    dispatch(setDrumState({ index: part, drumPart: trackId, drumStep: stepId, drums: drumHits }));
    const after = store.getState().song.songStructure;
    lastToggleRef.current = after === before ? null : { voice: trackId, step: stepId, time: performance.now(), before, after };
  }

  //Rows top to bottom: crash down to kick
  const trackIds = [...DRUM_NAMES.keys()].reverse();
  //Array of beats
  const stepIds = [...steps.keys()]
  const stepBars = stepBarsOf(drumGroove);

  const [menu, setMenu] = useState<DrumMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openMenu = (anchor: HTMLElement, voice: number, step: number | null) =>
    setMenu({ voice, step, anchor: anchor.getBoundingClientRect() });

  // A part switch (playback moving on) takes the menu's part away.
  useEffect(() => setMenu(null), [part]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  // Under what was double-clicked, kept inside the window and clear of the
  // transport footer (above it instead when there's no room below).
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!menu || !el) return;
    const { width, height } = el.getBoundingClientRect();
    const footer = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--footer-height')) || 0;
    const below = menu.anchor.bottom + 4;
    const top = below + height <= window.innerHeight - footer - 8 ? below : Math.max(8, menu.anchor.top - height - 4);
    el.style.left = `${Math.max(8, Math.min(menu.anchor.left, window.innerWidth - width - 8))}px`;
    el.style.top = `${top}px`;
  }, [menu]);

  // Every click on a title mutes or unmutes its drum (so a double-click
  // leaves it as it was); a double-click also opens the menu.
  const lastTitleClickRef = useRef<{ voice: number, time: number } | null>(null);
  const handleTitleClick = (event: React.MouseEvent<HTMLElement>, voice: number) => {
    onToggleMute?.(voice);
    const last = lastTitleClickRef.current;
    const now = performance.now();
    if (last?.voice === voice && (event.detail === 2 || now - last.time < DOUBLE_CLICK_MS)) {
      lastTitleClickRef.current = null;
      openMenu(event.currentTarget, voice, null);
    } else {
      lastTitleClickRef.current = { voice, time: now };
    }
  };

  // The second click of a double-click on a step doesn't toggle it again:
  // it takes the first click's toggle back (undo history and all) and opens
  // the step's menu.
  const handleStepClick = (event: React.MouseEvent<HTMLElement>, voice: number, step: number) => {
    const last = lastToggleRef.current;
    if (!last || last.voice !== voice || last.step !== step) return;
    if (event.detail !== 2 && performance.now() - last.time >= DOUBLE_CLICK_MS) return;
    event.preventDefault();
    lastToggleRef.current = null;
    dispatch(retractDrumEdit({ before: last.before, after: last.after }));
    openMenu(event.currentTarget, voice, step);
  };

  // The menu's options, each with the edits it makes: fill and clear; then,
  // on a bar's first step, copying this drum's bar (and on the crash's,
  // every drum's) - from the first bar to every later one, or into a later
  // bar from the one before it.
  const menuBar = menu?.step != null ? stepBars[menu.step] : null;
  const fillItems: MenuItem[] = [];
  const copyItems: MenuItem[] = [];
  if (menu) {
    const { voice } = menu;
    const steps = stepIds.filter(step => menuBar === null || stepBars[step] === menuBar);
    const where = menuBar === null ? 'every step' : 'this bar';
    fillItems.push(
      { label: `Fill ${where}`, edits: steps.map(step => ({ voice, step, checked: true })) },
      { label: `Clear ${where}`, edits: steps.map(step => ({ voice, step, checked: false })) },
    );
    if (menuBar !== null && menu.step === steps[0]) {
      const from = menuBar === 0 ? 0 : menuBar - 1;
      const to = menuBar === 0 ? [...new Set(stepBars)].filter(bar => bar > 0) : [menuBar];
      const how = menuBar === 0 ? 'to every later bar' : `from bar ${menuBar}`;
      copyItems.push({ label: `Copy ${how}`, edits: barCopyEdits(drums, drumGroove, [voice], from, to) });
      if (voice === CRASH) {
        copyItems.push({ label: `Copy all drums ${how}`, edits: barCopyEdits(drums, drumGroove, VOICES, from, to) });
      }
    }
  }
  const changesSomething = (edits: DrumCellEdit[]) => edits.some(e => !!drums[e.voice]?.[e.step]?.checked !== e.checked);
  const applyMenuItem = (edits: DrumCellEdit[]) => {
    dispatch(setDrumCells({ index: part, cells: edits }));
    setMenu(null);
  };

  const handleStartClick = async () => {
    if (isPlaying) {
      stopRef.current = true;
      setIsPlaying(false);
      onPlayingChange?.(false);
      return;
    }

    // Play the store's pattern (the checkboxes mirror it). Reading the DOM
    // here could pick up stale cells after a re-roll shortened the grid.
    const drumHits: DrumHit[][] = drums;
    stopRef.current = false;
    setIsPlaying(true);
    onPlayingChange?.(true);
    const endBeat = await playDrums(bpm, midi, start, drumGroove, drumHits, handleStep, () => stopRef.current, acoustic, song.key, voice => !!mutedRef.current?.[voice]);
    setIsPlaying(false);
    onPlayingChange?.(false);
    const nextBeat = endBeat >= drumGroove.length ? 0 : endBeat;
    dispatch(setCurrentBeat([part, nextBeat, song.selectedBeat[2], song.selectedBeat[3]]));
  };

  useImperativeHandle(ref, () => ({
    play: handleStartClick
  }));

  return (
    <div className={[styles.machine, fill ? styles.fill : '', fit ? styles.fit : ''].filter(Boolean).join(' ')}>
      {/* Renders titles: click to mute, double-click to fill or clear */}
      <div className={styles.labelList}>
        {trackIds.map((trackId) => (
          <button
            key={trackId}
            type="button"
            className={styles.drumTitle}
            drum-muted={muted?.[trackId] ? 'true' : undefined}
            aria-pressed={!muted?.[trackId]}
            title={`${muted?.[trackId] ? 'Unmute' : 'Mute'} ${DRUM_NAMES[trackId].toLowerCase()} (double-click to fill or clear every step)`}
            onClick={(e) => handleTitleClick(e, trackId)}
          >
            {DRUM_NAMES[trackId]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Renders buttons */}
        <div className={styles.cellList}>
          {trackIds.map((trackId) => (
            <div key={trackId} className={styles.row} drum-muted={muted?.[trackId] ? 'true' : undefined}>
              {stepIds.map((stepId) => {
                const id = trackId + '-' + stepId;
                const { measure, beat } = stepSpacing(drumGroove, stepId + 1)
                return (
                  <label className={styles.cell} key={id} style={columnStyles?.[stepId]} measure-end={measure} beat-end={beat}>
                    <input
                      key={id}
                      id={id}
                      type="checkbox"
                      ref={(elm) => {
                        if (!elm) return;
                        if (!stepsRef.current[trackId]) {
                          stepsRef.current[trackId] = [];
                        }
                        stepsRef.current[trackId][stepId] = elm;
                      }}
                      className={styles.cell__input}
                      onChange={() => updateDrumState(trackId, stepId)}
                    />
                    <div className={styles.cell__content} onClick={(e) => handleStepClick(e, trackId, stepId)} />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* In the body, clear of the scrolling part's clipping. */}
      {menu && createPortal(
        <div ref={menuRef} className={styles.drumMenu} role="menu">
          <div className={styles.drumMenuTitle}>
            {DRUM_NAMES[menu.voice]}{menuBar !== null && ` · bar ${menuBar + 1}`}
          </div>
          {[fillItems, copyItems].map((items, group) => items.length > 0 && (
            <React.Fragment key={group}>
              {group > 0 && <div role="separator" className={styles.drumMenuRule} />}
              {items.map(item => (
                <button key={item.label} role="menuitem" disabled={!changesSomething(item.edits)} onClick={() => applyMenuItem(item.edits)}>
                  {item.label}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
});

export default DrumMachine;
