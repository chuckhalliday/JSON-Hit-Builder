import React, { useState, useRef } from 'react'
import Info from './Info';
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { useSelector, useDispatch } from "react-redux"
import { playSong } from './SongStructure/playSong';
import { incrementByAmount } from './reducers';

import styles from "./App.module.scss"


function App() {
  const [openedParts, setOpenedParts] = useState<{ [key: string]: boolean }>({});
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showInfoScreen, setShowInfoScreen] = useState(true);

  const song = useSelector((state: { song: {
    bpm: number,
    key: string,
    songStructure: {
        type: string;
        repeat: number;
        bass: string[];
        bassGroove: number[];
        bassGrid: number[];
        bassNoteLocations: {
            x: number;
            y: number;
        }[];
        drums: {
            index: number;
            checked: boolean;
            accent?: boolean;
        }[][];
        drumGroove: number[];
        chords: string;
        chordsGroove: number[];
    }[]  
} }) => state.song)
  const bpm = useSelector((state: { song: { bpm: number } }) => state.song.bpm);

  //const lampsRef = React.useRef<HTMLInputElement[]>([]);

  const dispatch = useDispatch()

  const handlePartOpen = (key: string) => {
    const updatedOpenedParts: { [key: string]: boolean } = {};

    updatedOpenedParts[key] = !openedParts[key];

    for (const partKey in openedParts) {
      if (partKey !== key) {
        updatedOpenedParts[partKey] = false;
      }
    }

    setOpenedParts(updatedOpenedParts);
    const anyPartOpen = Object.values(updatedOpenedParts).some((isOpen) => isOpen);
    setShowInfoScreen(!anyPartOpen);
  };

  const [renderWidth, setRenderWidth] = useState(0);

  const handleRenderWidthChange = (width: number) => {
    setRenderWidth(width);
  };

 const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
   playSong(song)
      setIsPlaying(true);
    }
  };

  return (
    <div className={styles.rowContainer}>
      <div className={styles.key}>Key of : {song.key}</div>
      {song.songStructure.map((songProps, index) => {
        const songParts = [];
          const key = `${index}`;
          const isOpen = openedParts[key];

          songParts.push(
            <div key={key} className={styles.parts}>
              <button onClick={() => handlePartOpen(key)}>
                {songProps.type.charAt(0)}
              </button>
              {isOpen && (
                <div className={styles.openedPart}>
                  <h3>{songProps.type} ({songProps.repeat})</h3>
                  <BassStaff renderWidth={renderWidth}
                  part={index}/>
                  <DrumMachine
                    onRenderWidthChange={handleRenderWidthChange}
                    part={index}
                  />
                </div>
              )}
            </div>
          );
        return songParts;
      })}
      <div className={styles.info}>
      {showInfoScreen && <Info />}
      </div>
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
        {/*<label className={styles.fader}>
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange} 
            defaultValue={1}
          />
    </label> */}
      </div>
    </div>
  );
}

export default App;
