import React, { useEffect, useRef } from "react";
import { playDrums } from "./SongStructure/playSong";
import { setDrumState, SongState } from "./reducers";
import { useDispatch, useSelector } from "react-redux";
import styles from "./DrumMachine.module.scss";

type Props = {
  onRenderWidthChange: any;
  part: number
};

export default function DrumMachine({ onRenderWidthChange, part }: Props) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const dispatch = useDispatch()

  const bpm = useSelector((state: { song: SongState }) => state.song.bpm);
  const drums = useSelector((state: { song: SongState }) => state.song.songStructure[part].drums);
  const steps = useSelector((state: { song: SongState }) => state.song.songStructure[part].stepIds);
  const drumGroove = useSelector((state: { song: SongState }) => state.song.songStructure[part].drumGroove);
  const numOfSteps = drumGroove.length


    const stepsRef = React.useRef<HTMLInputElement[][]>(
      Array.from({ length: drums.length }, () =>
        Array.from({ length: numOfSteps }, () => document.createElement("input"))
      )
    );
  
    useEffect(() => {
      for (let trackId = 0; trackId < drums.length; trackId++) {
        for (let i = 0; i < numOfSteps; i++) {
          const inputElement = stepsRef.current[trackId][i] as HTMLInputElement;
          if (drums[trackId][i].checked === true) {
            inputElement.checked = true;
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



  const lampsRef = React.useRef<HTMLInputElement[]>([]);
  const machineRef = useRef<HTMLDivElement>(null);
  

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

  const tracks: string[] = ["Kick", "Snare", "Low", "Mid", "High", "HiHatC", "HiHatO", "Ride", "Crash"]

  //Array of different sounds
  const trackIds = [...Array(tracks.length).keys()];
  //Array of beats
  const stepIds = [...steps.keys()]

  const handleStartClick = async () => {
    const drumHits: Array<Array<{ index: number; checked: boolean }>> = stepsRef.current.map((row) =>
    row.map((inputElement, columnIndex) => ({
      index: columnIndex,
      checked: inputElement.checked,
    }))
  );
    if (isPlaying) {
      setIsPlaying(false);
    } else {
     playDrums(bpm, drumGroove, drumHits, lampsRef.current);
      setIsPlaying(true);
    }
  };

  function addSpacingToRows(step: number) {
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

  useEffect(() => {
    if (machineRef.current) {
      const width = machineRef.current.scrollWidth;
      onRenderWidthChange(width);
    }
  }, [onRenderWidthChange]);
  
  return (
    <div className={styles.machine} ref={machineRef}>
      {/* Renders titles */}
      <div className={styles.labelList}>
        <div>Crash</div>
        <div>Ride</div>
        <div>Hi-Hat O</div>
        <div>Hi-Hat C</div>
        <div>High Tom</div>
        <div>Mid Tom</div>
        <div>Low Tom</div>
        <div>Snare</div>
        <div>Kick</div>
      </div>
  
      <div className={styles.grid}>
        {/* Renders ticks */}
        <div className={styles.row}>
          {stepIds.map((stepId) => {
            const measure = addSpacingToRows(stepId + 1).measure
            const beat = addSpacingToRows(stepId + 1).beat
            return(
            <label key={stepId} className={styles.lamp} measure-end={measure} beat-end={beat}>
              <label className={styles.grooveLabel}>
                {drumFractions[stepId]}
              </label>
              <input
                type="radio"
                name="lamp"
                id={'lamp' + '-' + stepId}
                disabled
                ref={(elm) => {
                  if (!elm) return;
                  lampsRef.current[stepId] = elm;
                }}
                className={styles.lamp__input}
              />
              <div className={styles.lamp__content} />
            </label>
            )
          })}
        </div>
  
        {/* Renders buttons */}
        <div className={styles.cellList}>
          {trackIds.reverse().map((trackId) => (
            <div key={trackId} className={styles.row}>
              {stepIds.map((stepId) => {
                const id = trackId + '-' + stepId;
                const measure = addSpacingToRows(stepId + 1).measure
                const beat = addSpacingToRows(stepId + 1).beat
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
      
      {/* Renders controls */}
      <div className={styles.controls}>
        <button onClick={handleStartClick} className={styles.button}>
          {isPlaying ? "Pause" : "Start"}
        </button>
      </div>
    </div>
  );
}
