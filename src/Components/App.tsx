import React, { useState, useEffect } from 'react'
import Info from './Info';
import Generate from './Generate';
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import Piano from './Piano';
import { useSelector, useDispatch } from "react-redux"
import { playVerse } from '../SongStructure/playSong';
import { incrementByAmount, setIsPlaying, setMidi, SongState, setCurrentBeat } from '../reducers';
import styles from "../Styles/App.module.scss"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ifsfdjaensqwsrhoymfh.supabase.co'
const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmc2ZkamFlbnNxd3NyaG95bWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY3NTUzOTcsImV4cCI6MjAxMjMzMTM5N30.pHYsuL39FQql2zs7tMoL9i5Vqod2Or07nPwB-XnKFww')

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
  const [showGenerate, setShowGenerate] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAuthenticated(true);
      }
    };

    checkAuthentication();
  }, []);

  const login = async () => {
    if (!authenticated) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (!error) {
        setAuthenticated(true);
      }
    }
  };

  const logout = async () => {
    let { error } = await supabase.auth.signOut()
    setAuthenticated(false)
  }

  const handleGenerateClick = () => {
    setShowGenerate(true);
  };

  const handleCloseGenerate = () => {
    setShowGenerate(false);
  };

  const song = useSelector((state: { song: SongState }) => state.song)
  const bpm = song.bpm
  const isPlaying = song.isPlaying
  const midi = song.midi
  let verse = song.selectedBeat[0]
  let drumBeat = song.selectedBeat[1];
  let bassBeat = song.selectedBeat[2]
  let chordBeat = song.selectedBeat[3]

  const lampsRef = React.useRef<HTMLInputElement[]>([]);

  const dispatch = useDispatch()

  async function playSong(song: SongState, verse: number, drumBeat: number, bassBeat: number, chordBeat: number) {
    let tempo = song.bpm - 60;
    //const output = new midi.Output()
    //output.openPort(3)
  
    //Start recording
  
    //output.sendMessage([144, 16, 1])
    //await countIn(song.bpm, song.songStructure[0].drumGroove, song.songStructure[0].drums)
    //output.sendMessage([176, 50, tempo]);
      //Drop locators
      //output.sendMessage([144, 17, 1])
      //output.sendMessage([176, sum, 1])
      await playVerse(
        song.bpm,
        song.midi,
        drumBeat,
        bassBeat,
        chordBeat,
        song.songStructure[verse].drumGroove,
        song.songStructure[verse].drums,
        song.songStructure[verse].bassGroove,
        song.songStructure[verse].bassNoteLocations, 
        song.songStructure[verse].chordsGroove,
        song.songStructure[verse].chords,
        song.songStructure[verse].chordTones,
        lampsRef.current
      );
      verse++
      if (verse < song.songStructure.length) {
        dispatch(setCurrentBeat([verse, 0, 0, 0]))
        setCurrentPart(verse);
        handlePartOpen(`${verse}`); 
      } else {
      dispatch(setIsPlaying({ isPlaying: false }))
      console.log("End")
      }
    // Stop recording
    //output.sendMessage([144, 16, 1])
  }

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

  useEffect(() => {
     if (isPlaying) {
      playSong(song, verse, drumBeat, bassBeat, chordBeat);
    }
  }, [isPlaying, verse]);


 const handleStartClick = () => {
    if (isPlaying) {
      dispatch(setIsPlaying({isPlaying: false}));
    } else {
      if (!openedParts[0] && !openedParts[song.selectedBeat[0]]) {
        handlePartOpen(`${song.selectedBeat[0]}`)
      }
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
    <div >
      {authenticated ? (
        // Render your app components when authenticated
        <div className={styles.rowContainer}>
        <button className={styles.key} onClick={handleGenerateClick}>Key of : {song.key}</button>
        {showGenerate && (
          <div className={styles.generateOverlay}>
            <Generate onClose={handleCloseGenerate}/>
          </div>
        )}
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
              className={styles.bpm}
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
          <button onClick={logout} className={styles.button}>Log Out</button>
        </div>
        </div>
      ) : (
        <button onClick={login}>Log In with Google</button>
      )}
    </div>
  );
}

export default App;
