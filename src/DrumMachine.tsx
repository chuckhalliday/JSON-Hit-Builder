import React, { useEffect, useRef } from "react";
import { playVerse } from "./SongStructure/playSong";
import styles from "./DrumMachine.module.scss";
import { setDrumVerse, setDrumChorus, setDrumBridge } from "./Reducers/drumLine";
import { useDispatch } from "react-redux";
import { setlampVerse, setlampChorus, setlampBridge } from "./Reducers/lamps";

type Props = {
  onRenderWidthChange: any;
  numOfSteps: number;
  drumGroove: number[];
  kick: string;
  snare: string;
  hat: string;
  bpm: number;
  part: string
};

export default function DrumMachine({
  onRenderWidthChange,
  numOfSteps,
  drumGroove,
  kick,
  snare,
  hat,
  bpm,
  part
}: Props) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const dispatch = useDispatch()

  const stepsRef = React.useRef<HTMLInputElement[][]>(
    Array.from({ length: 4 }, () =>
      Array.from({ length: numOfSteps }, () => document.createElement("input"))
    )
  );
  const lampsRef = React.useRef<HTMLInputElement[]>([]);
  const machineRef = useRef<HTMLDivElement>(null);

  function setLampState() {
    const lampLights: { index: number; checked: boolean }[] = lampsRef.current.map((inputElement, index) => ({
      index: index,
      checked: inputElement.checked,
    }));
  
    if (part === 'Verse') {
      dispatch(setlampVerse(lampLights));
    } else if (part === 'Chorus') {
      dispatch(setlampChorus(lampLights));
    } else if (part === 'Bridge') {
      dispatch(setlampBridge(lampLights));
    }
  }

  function setDrumState() {
      const drumHits: Array<Array<{ index: number; checked: boolean }>> = stepsRef.current.map((row, rowIndex) =>
        row.map((inputElement, columnIndex) => ({
          index: columnIndex,
          checked: inputElement.checked,
        }))
      );
  
      if (part === 'Verse') {
        dispatch(setDrumVerse(drumHits));
      } else if (part === 'Chorus') {
        dispatch(setDrumChorus(drumHits));
      } else if (part === 'Bridge') {
        dispatch(setDrumBridge(drumHits));
      }
  }

  useEffect(() => {
    let bassDrum: string = kick.replace(/\|/g, "");
    let snareDrum: string = snare.replace(/\|/g, "");
    let hiHat: string = hat.replace(/\|/g, "");

    for (let i = 0; i < bassDrum.length; i++) {
      if (bassDrum.charAt(i) === "x" || bassDrum.charAt(i) === "X") {
        const inputElement = stepsRef.current[3][i] as HTMLInputElement;
        inputElement.checked = true;
      }
    }

    for (let i = 0; i < snareDrum.length; i++) {
      if (snareDrum.charAt(i) === "y" || snareDrum.charAt(i) === "Y") {
        const inputElement = stepsRef.current[2][i] as HTMLInputElement;
        inputElement.checked = true;
      }
    }

    for (let i = 0; i < hiHat.length; i++) {
      if (
        hiHat.charAt(i) === "v" ||
        hiHat.charAt(i) === "w" ||
        hiHat.charAt(i) === "V" ||
        hiHat.charAt(i) === "W"
      ) {
        const inputElement = stepsRef.current[0][i] as HTMLInputElement;
        inputElement.checked = true;
      }
    }

    setLampState()
    setDrumState()
  }, [kick, snare, hat]);
  

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

  const tracks: string[] = ["Kick", "Snare", "Flair", "HiHat"]

  //Array of different sounds
  const trackIds = [...Array(tracks.length).keys()] as const;
  //Array of beats
  const stepIds = [...Array(numOfSteps).keys()] as const;
  
  const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
    //  playVerse(bpm, drumGroove, stepsRef.current, lampsRef.current);
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
          // Export the width as needed
        }
      }, [onRenderWidthChange]);
  
  return (
    <div className={styles.machine} ref={machineRef}>
      {/* Renders titles */}
      <div className={styles.labelList}>
        <div>HiHat</div>
        <div>Flair</div>
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
                onChange={setLampState}
              />
              <div className={styles.lamp__content} />
            </label>
            )
          })}
        </div>
  
        {/* Renders buttons */}
        <div className={styles.cellList}>
          {trackIds.map((trackId) => (
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
                      onChange={setDrumState}
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
