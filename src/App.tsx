import React, { useState } from 'react'
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { useSelector, useDispatch } from "react-redux"
import { incrementByAmount } from './Reducers/bpm';
import { songVariables } from './SongStructure/play';

import styles from "./App.module.scss"

const songStructure = songVariables.songStructure


function App() {
  const [openedParts, setOpenedParts] = useState<{ [key: string]: boolean }>({});
  const [isPlaying, setIsPlaying] = React.useState(false);
  const bpm = useSelector((state: { bpm: { value: number } }) => state.bpm.value);
  const dispatch = useDispatch()

  const handlePartOpen = (key: string) => {
    setOpenedParts((prevState) => ({
      ...prevState,
      [key]: !prevState[key]
    }));
  };

  const [renderWidth, setRenderWidth] = useState(0);

  const handleRenderWidthChange = (width: number) => {
    setRenderWidth(width);
  };

  const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      //playSong(bpm, drumGroove, stepsRef.current, lampsRef.current);
      setIsPlaying(true);
    }
  };

  return (
    <div className={styles.rowContainer}>
      <div className={styles.key}>Key of : {songVariables.key}</div>
      {songStructure.map((songProps, index) => {
        const songParts = [];
        for (let i = 0; i < songProps.repeat; i++) {
          const key = `${index}_${i}`;
          const isOpen = openedParts[key];

          songParts.push(
            <div key={key} className={styles.parts}>
              <button onClick={() => handlePartOpen(key)}>
                {songProps.type.charAt(0)}
              </button>
              {isOpen && (
                <div className={styles.openedPart}>
                  <h3>{songProps.type} ({i + 1})</h3>
                  <BassStaff renderWidth={renderWidth}
                  bass={songProps.bass}
                  drumGroove={songProps.drumGroove}
                  bassGroove={songProps.bassGroove}
                  part={songProps.type}/>
                  <DrumMachine
                    onRenderWidthChange={handleRenderWidthChange}
                    numOfSteps={songProps.drumGroove.length}
                    drumGroove={songProps.drumGroove}
                    kick={songProps.kick}
                    snare={songProps.snare}
                    hat={songProps.hiHat}
                    bpm={bpm}
                    part={songProps.type}
                  />
                </div>
              )}
            </div>
          );
        }
        return songParts;
      })}
      {/* Renders controls */}
      <div className={styles.controls}>
      <button onClick={handleStartClick} className={styles.button}>
          {isPlaying ? "Pause" : "Start"}
        </button>
        <label className={styles.fader}>
          <span>BPM:{bpm}</span>
          <input
            type="range"
            min={90}
            max={150}
            step={1}
            onChange={(e) => dispatch(incrementByAmount(e.target.value))}
            defaultValue={bpm}
          />
        </label>
        <label className={styles.fader}>
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
          //  onChange={handleVolumeChange} 
            defaultValue={1}
          />
        </label>
      </div>
    </div>
  );
}

export default App;
