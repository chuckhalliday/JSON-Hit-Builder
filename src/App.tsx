import React, { useState, useEffect, useRef } from 'react'
import Info from './Info';
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import Piano from './Piano';
import { useSelector, useDispatch } from "react-redux"
import { playSong } from './SongStructure/playSong';
import { incrementByAmount, setIsPlaying, setMidi, SongState } from './reducers';

import styles from "./App.module.scss"


function listInputsAndOutputs(midiAccess: WebMidi.MIDIAccess) {
  console.log("MIDI ready!");
  for (const entry of midiAccess.inputs) {
    const input = entry[1];
    console.log(
      `Input port: name:'${input.name}'`
    );
  }

  for (const entry of midiAccess.outputs) {
    const output = entry[1];
    console.log(
      `Output port: name:'${output.name}'`,
    );
  }
}

function onMIDIFailure(msg: string) {
  console.error(`Failed to get MIDI access - ${msg}`);
}


function App() {
  const [openedParts, setOpenedParts] = useState<{ [key: string]: boolean }>({});
  const [currentPart, setCurrentPart] = useState<number>(0); // Track current open part
  const [showInfoScreen, setShowInfoScreen] = useState(true);

  const isPlaying = useSelector((state: { song: SongState }) => state.song.isPlaying)
  const midi = useSelector((state: { song: SongState }) => state.song.midi)
  const song = useSelector((state: { song: SongState }) => state.song)
  const bpm = useSelector((state: { song: { bpm: number } }) => state.song.bpm);

  const lampsRef = React.useRef<HTMLInputElement[]>([]);

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
    
    if (updatedOpenedParts[key]) {
      setCurrentPart(parseInt(key));
    } else {
      setCurrentPart(-1);
    }
  };

  const [renderWidth, setRenderWidth] = useState(0);

  const handleRenderWidthChange = (width: number) => {
    setRenderWidth(width);
  };

  const playThrough = async () => {
    playSong(song, setCurrentPart, handlePartOpen, lampsRef.current)
  }

  useEffect(() => {
    if (isPlaying) {
      playThrough()
    }
  }, [isPlaying]);


 const handleStartClick = async () => {
    if (isPlaying) {
      dispatch(setIsPlaying({isPlaying: false}));
    } else {
      dispatch(setIsPlaying({isPlaying: true}));
    }
  };

  const handleMidi = async () => {
    if (midi) {
      dispatch(setMidi({midi: false}));
      console.log("Midi off")
    } else {
      dispatch(setMidi({midi: true}));
      navigator.requestMIDIAccess().then(listInputsAndOutputs, onMIDIFailure)
    }
  };

  return (
    <div className={styles.rowContainer}>
      <div className={styles.key}>Key of : {song.key}</div>
      {song.songStructure.map((songProps, index) => {
        const songParts = [];
          const key = `${index}`;
          const isOpen = openedParts[key];

          return (
            <div key={key} className={styles.parts}>
              <button
                onClick={() => handlePartOpen(key)}
                className={isOpen ? `${styles.openButton}` : ''}
              >
                {songProps.type.charAt(0)}
              </button>
              <Piano />
              {isOpen && currentPart === index && (
                <div className={styles.openedPart}>
                  <h3>{songProps.type} ({songProps.repeat})</h3>
                  <BassStaff renderWidth={renderWidth} part={index} />
                  <DrumMachine
                    onRenderWidthChange={handleRenderWidthChange}
                    part={index}
                    lampsRef={lampsRef}
                  />
                </div>
              )}
            </div>
          );
        })}
      <div className={styles.info}>
      {showInfoScreen && <Info />}
      </div>
      {/* Renders controls */}
      <div className={styles.controls}>
      <button onClick={handleStartClick} className={styles.button}>
          {isPlaying ? "Pause" : "Play Song"}
        </button>
      <button onClick={handleMidi} className={styles.button}>
          {midi ? "Use Osc" : "Use Midi"}
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
