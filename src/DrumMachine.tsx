import React, { useEffect, useRef } from "react";
import { playDrums } from "./SongStructure/playSong";
import { setDrumState, setIsPlaying, SongState, setCurrentBeat } from "./reducers";
import { useDispatch, useSelector } from "react-redux";
import styles from "./DrumMachine.module.scss";

interface DrumMachineProps {
  onRenderWidthChange: any;
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
}

export default function DrumMachine({
  onRenderWidthChange,
  part,
  lampsRef,
}: DrumMachineProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const dispatch = useDispatch()

  const song = useSelector((state: { song: SongState }) => state.song);
  const bpm = song.bpm
  const start = song.selectedBeat[0]
  const midi = song.midi
  const drums = song.songStructure[part].drums
  const steps = song.songStructure[part].stepIds
  const drumGroove = song.songStructure[part].drumGroove
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
     playDrums(bpm, midi, start, drumGroove, drumHits, lampsRef.current);
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

  useEffect(() => {
    function handleLampChange(event: any) {
      const lampId: number = parseInt(event.target.id);
      const getPosition = () => {
        let drumPosition: number = 0
        let bassPosition: number = 0
        let chordPosition: number = 0
        let drumSum = 0
        let bassSum = song.songStructure[part].bassGroove[0]
        let chordSum = song.songStructure[part].chordsGroove[0]
        let bassIndex = 1
        let chordIndex = 1

        for (let i=0; i < lampId; i++){
          drumSum+=song.songStructure[part].drumGroove[i]
          drumSum = parseFloat(drumSum.toFixed(2))
          if (drumSum === chordSum && bassSum === chordSum) {
            drumPosition = i + 1
            bassPosition = bassIndex
            chordPosition = chordIndex
          }
          if (drumSum === chordSum) {
            chordSum+= song.songStructure[part].chordsGroove[chordIndex]
            chordSum = parseFloat(chordSum.toFixed(2))
            chordIndex++
          }
          if (drumSum === bassSum) {
            bassSum+= song.songStructure[part].bassGroove[bassIndex]
            bassSum = parseFloat(bassSum.toFixed(2))
            bassIndex++
          }
        }
        return [drumPosition, bassPosition, chordPosition]
      }
      const position: number[] = getPosition()
      dispatch(setCurrentBeat([part, position[0], position[1], position[2]]))
    }

    lampsRef.current.forEach((lamp) => {
      lamp.addEventListener('change', handleLampChange);
    });

    return () => {
      lampsRef.current.forEach((lamp) => {
        lamp.removeEventListener('change', handleLampChange);
      });
    };
  }, []);
  
  return (
    <div className={styles.machine} ref={machineRef}>
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
                id={stepId.toString()}
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
          {isPlaying ? "Pause" : "Play Drums"}
        </button>
      </div>
    </div>
  );
}
