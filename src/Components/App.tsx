import React, { useState, useEffect, useCallback } from 'react'
import Info from './Info';
import Generate from './Generate';
import Save from './Save';
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import Piano, { PlayHandle } from './Piano';
import { useSelector, useDispatch } from "react-redux"
import { playVerse } from '../Playback/playSong';
import { preloadDrumSamples } from '../Playback/playDrums';
import { useLampStep } from '../Playback/useLampStep';
import { incrementByAmount, setIsPlaying, setMidi, SongState, setCurrentBeat, newSong } from '../reducers';
import type { AppDispatch } from '../store'
import styles from "../Styles/App.module.scss"
import { supabase } from '../supabaseClient'

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
  const [saveScreen, setSaveScreen] = useState(false);
  const anyPartOpen = Object.values(openedParts).some(Boolean);

  const login = async () => {
    if (!authenticated) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const devLogin = async () => {
    const email = import.meta.env.VITE_DEV_EMAIL;
    const password = import.meta.env.VITE_DEV_PASSWORD;
    if (!email || !password) {
      alert('Set VITE_DEV_EMAIL and VITE_DEV_PASSWORD in .env.local to use dev login.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Dev login failed: ${error.message}`);
      return;
    }
    setAuthenticated(true);
  };

  // Warm the drum sample cache as early as possible so the first playback of a
  // session doesn't race a cold fetch+decode against the scheduler's lead time.
  useEffect(() => {
    preloadDrumSamples().catch(() => { /* first hit will just load it lazily */ });
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        alert(`Failed to check login status: ${error.message}`);
        return;
      }
      if (session) {
        setAuthenticated(true);
      }
    };

    checkAuthentication();
  }, []);


  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert(`Logout failed: ${error.message}`);
      return;
    }
    setAuthenticated(false)
  }

  const handleGenerateClick = () => {
    setShowGenerate(true);
  };

  const handleCloseGenerate = () => {
    setShowGenerate(false);
  };

  const handleSaveClick = () => {
    setSaveScreen(true);
  };

  const handleCloseSave = () => {
    setSaveScreen(false);
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
  const stopRef = React.useRef(false);
  // Bumped whenever the user manually picks a lamp position. Lets an in-flight
  // pause (see stop-branch below) detect that its paused position is stale and
  // avoid clobbering the newer manual selection.
  const manualSeekEpochRef = React.useRef(0);

  const partGrooves = song.songStructure[verse] ?? { drumGroove: [], bassGroove: [], chordsGroove: [] };
  const handleStep = useLampStep(lampsRef, verse, partGrooves.drumGroove, partGrooves.bassGroove, partGrooves.chordsGroove);

  const pianoRef = React.useRef<PlayHandle>(null);
  const bassStaffRef = React.useRef<PlayHandle>(null);
  const drumMachineRef = React.useRef<PlayHandle>(null);
  const [includeChords, setIncludeChords] = useState(true);
  const [includeBass, setIncludeBass] = useState(true);
  const [includeDrums, setIncludeDrums] = useState(true);

  const dispatch = useDispatch<AppDispatch>()

  // Generate the initial song on mount. Replaces the old import-time generation
  // so startup is an explicit, dispatchable (and seedable) action.
  useEffect(() => {
    dispatch(newSong());
  }, []);


  async function playSong(song: SongState, verse: number, drumBeat: number, bassBeat: number, chordBeat: number) {
    const seekEpochAtStart = manualSeekEpochRef.current;
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
      const result = await playVerse(
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
        handleStep,
        () => stopRef.current,
        includeDrums,
        includeBass,
        includeChords
      );

      if (stopRef.current) {
        // If the user picked a new lamp position while this stop was still
        // in flight, their selection is newer than where we stopped - don't
        // overwrite it with the stale paused position.
        if (manualSeekEpochRef.current === seekEpochAtStart) {
          const wrap = (idx: number, len: number) => (idx >= len ? 0 : idx);
          const drumLen = song.songStructure[verse].drumGroove.length;
          const bassLen = song.songStructure[verse].bassGroove.length;
          const chordLen = song.songStructure[verse].chordsGroove.length;
          dispatch(setCurrentBeat([
            verse,
            wrap(result.drumBeat, drumLen),
            wrap(result.bassBeat, bassLen),
            wrap(result.chordBeat, chordLen),
          ]))
        }
        dispatch(setIsPlaying({ isPlaying: false }))
        return;
      }

      const nextVerse = verse + 1
      if (nextVerse < song.songStructure.length) {
        dispatch(setCurrentBeat([nextVerse, 0, 0, 0]))
        setCurrentPart(nextVerse);
        handlePartOpen(`${nextVerse}`);
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

  // Stable identity so DrumMachine's width-measuring effect (which lists this in
  // its deps) doesn't re-run on every App render. The prev-guard also stops a
  // feedback loop where measuring width triggers a re-render that re-measures.
  const handleRenderWidthChange = useCallback((width: number) => {
    setRenderWidth(prev => (prev === width ? prev : width));
  }, []);

  useEffect(() => {
     if (isPlaying) {
      playSong(song, verse, drumBeat, bassBeat, chordBeat);
    }
  }, [isPlaying, verse]);


 const handleStartClick = () => {
    if (isPlaying) {
      stopRef.current = true;
      dispatch(setIsPlaying({isPlaying: false}));
    } else {
      stopRef.current = false;
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
        {showGenerate && (
          <div className={styles.generateOverlay}>
            <Generate onClose={handleCloseGenerate}/>
          </div>
        )}
        {saveScreen && (
          <div className={styles.generateOverlay}>
            <Save onClose={handleCloseSave}/>
          </div>
        )}
        {song.songStructure.length > 0 && <Piano ref={pianoRef} lampsRef={lampsRef} />}
        <div className={styles.partsRow}>
        {song.songStructure.map((songProps, index) => {
          const songParts = [];
          const key = `${index}`;
          const isOpen = openedParts[key];

          return (
            <div key={key} className={styles.parts}>
              <button
                onClick={() => handlePartOpen(key)}
                className={isOpen ? `${styles.partButton} ${styles.openButton}` : styles.partButton}
              >
                {songProps.type.charAt(0)}
              </button>
              {isOpen && currentPart === index && (
                <div className={styles.openedPart}>
                  <h3>{songProps.type} ({songProps.repeat})</h3>
                  <BassStaff ref={bassStaffRef} renderWidth={renderWidth} part={index} lampsRef={lampsRef} />
                  <DrumMachine
                    ref={drumMachineRef}
                    onRenderWidthChange={handleRenderWidthChange}
                    part={index}
                    lampsRef={lampsRef}
                    manualSeekEpochRef={manualSeekEpochRef}
                  />
                </div>
              )}
            </div>
          );
        })}
        </div>
        <div className={styles.info}>
          {showInfoScreen && !anyPartOpen && <Info />}
        </div>
        {/* Renders controls */}
        <div className={styles.controls}>
          <button className={styles.key} onClick={handleGenerateClick}>Key of :<br />{song.key}</button>
          <div className={styles.songControls}>
            <button
              onClick={() => setIncludeChords(prev => !prev)}
              className={includeChords ? styles.button : `${styles.button} ${styles.openButton}`}
            >
              Chords
            </button>
            <button
              onClick={() => setIncludeBass(prev => !prev)}
              className={includeBass ? styles.button : `${styles.button} ${styles.openButton}`}
            >
              Bass
            </button>
            <button
              onClick={() => setIncludeDrums(prev => !prev)}
              className={includeDrums ? styles.button : `${styles.button} ${styles.openButton}`}
            >
              Drums
            </button>
          </div>
          <div className={styles.bpmControls}>
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
            <button
              onClick={handleStartClick}
              className={isPlaying ? `${styles.button} ${styles.openButton}` : styles.button}
            >
              {isPlaying ? "Pause" : "Play Song"}
            </button>
          </div>
          <div className={styles.midiControls}>
            <button onClick={handleMidi} className={styles.button}>
              {midi ? "Use Osc" : "Use Midi"}
            </button>
            <button onClick={handleSaveClick} className={styles.button}>Save/Load</button>
            <button onClick={logout} className={styles.button}>Log Out</button>
          </div>
        </div>
        </div>
      ) : (
        <div>
          {import.meta.env.DEV && (
            <button className="login" onClick={devLogin}>Dev Login</button>
          )}
          <button className="login" onClick={login}>Log In with Google</button>
        </div>
      )}
    </div>
  );
}

export default App;
