import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { playDrums } from "../Playback/playSong";
import { setDrumState, SongState, setCurrentBeat, setLoop, extendLoop, pickLoopSpan } from "../reducers";
import { barSpan, clampRegion, overlapsRegion, stepSpan, sum } from "../Playback/loop";
import { useDispatch, useSelector } from "react-redux";
import { PlayHandle } from "./Piano";
import styles from "../Styles/DrumMachine.module.scss";
import { DrumHit } from "../types";
import { useLampStep } from "../Playback/useLampStep";

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

interface StepTrackerProps {
  onRenderWidthChange: (width: number) => void;
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
  manualSeekEpochRef?: React.MutableRefObject<number>;
}

// The bar ruler and step lamps: the part's timeline, kept apart from the
// drum grid so it can stay in view (pinned under the keyboard) while the
// sections below it are collapsed or scrolled. Its columns line up with the
// grid's and the staff's, and its width sets theirs.
export function StepTracker({ onRenderWidthChange, part, lampsRef, manualSeekEpochRef }: StepTrackerProps) {
  const dispatch = useDispatch()
  const song = useSelector((state: { song: SongState }) => state.song);
  const steps = song.songStructure[part].stepIds
  const drumGroove = song.songStructure[part].drumGroove
  const bassGroove = song.songStructure[part].bassGroove
  const chordsGroove = song.songStructure[part].chordsGroove

  const handleStep = useLampStep(lampsRef, part, drumGroove, bassGroove, chordsGroove);
  const trackerRef = useRef<HTMLDivElement>(null);

  let drumFractions: string[] = []

  for (let i = 0; i < drumGroove.length; i++) {
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
    }
  }

  //Array of beats
  const stepIds = [...steps.keys()]

  // Bar of each step, and which steps open a bar (they carry the bar number
  // in the ruler above the lamps).
  const stepBars: number[] = [];
  const barStart: boolean[] = [];
  {
    let beats = 0;
    drumGroove.forEach((d, i) => {
      const bar = Math.floor((beats + 0.02) / 4);
      barStart.push(i === 0 || bar !== stepBars[i - 1]);
      stepBars.push(bar);
      beats += d;
    });
  }
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
  }, [onRenderWidthChange, drumGroove]);

  return (
    <div className={styles.machine} ref={trackerRef} loop-pick={picking ?? undefined}>
      {/* Holds the drum grid's label column, so the columns line up. */}
      <div className={styles.labelList} />

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
            <label key={stepId} className={styles.lamp} measure-end={measure} beat-end={beat}>
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
                  handleStep(stepId);
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
}

// The drum step grid. Its bar ruler and lamps are the StepTracker above.
const DrumMachine = forwardRef<PlayHandle, DrumMachineProps>(function DrumMachine({
  part,
  lampsRef,
  onPlayingChange,
}, ref) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const stopRef = useRef(false);
  const dispatch = useDispatch()

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
  

  function updateDrumState(trackId: number, stepId: number) {
    const drumHits = {
      index: stepId,
      checked: stepsRef.current[trackId][stepId].checked
    }
    dispatch(setDrumState({ index: part, drumPart: trackId, drumStep: stepId, drums: drumHits }));
  }


  const tracks: string[] = ["Kick", "Snare", "Low", "Mid", "High", "HiHatC", "HiHatO", "Ride", "Crash"]

  //Array of different sounds
  const trackIds = [...Array(tracks.length).keys()];
  //Array of beats
  const stepIds = [...steps.keys()]

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
    const endBeat = await playDrums(bpm, midi, start, drumGroove, drumHits, handleStep, () => stopRef.current, acoustic, song.key);
    setIsPlaying(false);
    onPlayingChange?.(false);
    const nextBeat = endBeat >= drumGroove.length ? 0 : endBeat;
    dispatch(setCurrentBeat([part, nextBeat, song.selectedBeat[2], song.selectedBeat[3]]));
  };

  useImperativeHandle(ref, () => ({
    play: handleStartClick
  }));

  return (
    <div className={styles.machine}>
      {/* Renders titles */}
      <div className={styles.labelList}>
        <div>Crash</div>
        <div>Ride</div>
        <div>Open Hat</div>
        <div>Closed Hat</div>
        <div>High Tom</div>
        <div>Mid Tom</div>
        <div>Low Tom</div>
        <div>Snare</div>
        <div>Kick</div>
      </div>
  
      <div className={styles.grid}>
        {/* Renders buttons */}
        <div className={styles.cellList}>
          {trackIds.reverse().map((trackId) => (
            <div key={trackId} className={styles.row}>
              {stepIds.map((stepId) => {
                const id = trackId + '-' + stepId;
                const { measure, beat } = stepSpacing(drumGroove, stepId + 1)
                return (
                  <label className={styles.cell} key={id} measure-end={measure} beat-end={beat}>
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
                    <div className={styles.cell__content} />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default DrumMachine;
