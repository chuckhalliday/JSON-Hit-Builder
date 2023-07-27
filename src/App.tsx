import React, { useState } from 'react'
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { useSelector, useDispatch } from "react-redux"
import { songVariables } from './SongStructure/play';
import { playSong } from './SongStructure/playSong';
import { incrementByAmount } from './reducers';

import styles from "./App.module.scss"


function App() {
  const [openedParts, setOpenedParts] = useState<{ [key: string]: boolean }>({});
  const [isPlaying, setIsPlaying] = React.useState(false);

  const songStructure = songVariables.songStructure
  const bpm = useSelector((state: { song: { bpm: number } }) => state.song.bpm);
  /*const verseDrums = useSelector((state: { drumLine: { drumVerse: Array<Array<{ index: number; checked: boolean }>> }}) => state.drumLine.drumVerse)
  const verseDrumGroove = useSelector((state: { drumGroove: { verseGroove: number[] }}) => state.drumGroove.verseGroove)
  const verseBass = useSelector((state: { song: { songStructure: Array<{ x: number; y: number }> }}) => state.bassLine.bassVerse)
  const verseBassGroove = useSelector((state: { bassGroove: { verseGroove: number[] }}) => state.bassGroove.verseGroove)

  const chorusDrums = useSelector((state: { drumLine: { drumChorus: Array<Array<{ index: number; checked: boolean }>> }}) => state.drumLine.drumChorus)
  const chorusDrumGroove = useSelector((state: { drumGroove: { chorusGroove: number[] }}) => state.drumGroove.chorusGroove)
  const chorusBass = useSelector((state: { bassLine: { bassChorus: Array<{ x: number; y: number }> }}) => state.bassLine.bassChorus)
  const chorusBassGroove = useSelector((state: { bassGroove: { chorusGroove: number[] }}) => state.bassGroove.chorusGroove)

  const bridgeDrums = useSelector((state: { drumLine: { drumBridge: Array<Array<{ index: number; checked: boolean }>> }}) => state.drumLine.drumBridge)
  const bridgeDrumGroove =useSelector((state: { drumGroove: { bridgeGroove: number[] }}) => state.drumGroove.bridgeGroove)
  const bridgeBass = useSelector((state: { bassLine: { bassBridge: Array<{ x: number; y: number }> }}) => state.bassLine.bassBridge) 
  const bridgeBassGroove = useSelector((state: { bassGroove: { bridgeGroove: number[] }}) => state.bassGroove.bridgeGroove) */

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

 /* const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
   playSong(songStructure, bpm,
  verseDrums, verseDrumGroove, 
  verseBass, verseBassGroove,
  chorusDrums,chorusDrumGroove,  
  chorusBass, chorusBassGroove,
  bridgeDrums, bridgeDrumGroove, 
  bridgeBass, bridgeBassGroove,
  verseLamps, chorusLamps, bridgeLamps)
      setIsPlaying(true);
    }
  }; */

  return (
    <div className={styles.rowContainer}>
      <div className={styles.key}>Key of : {songVariables.key}</div>
      {songStructure.map((songProps, index) => {
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
                    type={songProps.type}
                    part={index}
                  />
                </div>
              )}
            </div>
          );
        return songParts;
      })}
      {/* Renders controls */}
      <div className={styles.controls}>
      <button /*onClick={handleStartClick}*/ className={styles.button}>
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
