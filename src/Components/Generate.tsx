import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSong, SongState } from "../reducers";
import generateSong from "../SongStructure/generateSong";
import styles from "../Styles/App.module.scss";

interface GenerateProps {
  onClose: () => void;
}

const noteMapping: { [key: number]: string } = {
  2: "../notes/halfnote.webp",
  1.5: "../notes/dottedquarternote.webp",
  1: "../notes/quarternote.webp",
  0.75: "../notes/dottedeighthnote.webp",
  0.5: "../notes/eighthnote.webp",
  0.25: "../notes/sixteenthnote.webp",
};

// Accepted bounds for the optional BPM / song-length fields: one source of
// truth for the input attributes, the placeholders, and the clamp.
const minBpm = 40;
const maxBpm = 240;
const minLength = 60;
const maxLength = 600;

// Semitone offset each key letter maps to (same values handleKeyChange uses).
const keyOffsets: { [letter: string]: number } = { A: -3, B: -1, C: 0, D: 2, E: 4, F: -7, G: -5 };

// Parse a stored key string like "D# Minor" back into the menu's key
// controls. Anything unparseable (no song yet, or a mode the menu can't
// express) returns null and the controls open blank.
function parseKey(keyString: string) {
  const [note, mode] = keyString.split(' ');
  if (!note || !(note[0] in keyOffsets) || (mode !== 'Major' && mode !== 'Minor')) {
    return null;
  }
  const accidental = note[1] === '#' ? '#' : note[1] === 'b' ? '♭' : '♮';
  return {
    letter: note[0],
    accidental,
    tonality: mode,
    key: keyOffsets[note[0]],
    modify: accidental === '#' ? 1 : accidental === '♭' ? -1 : 0,
    toneModify: mode === 'Minor' ? 3 : 0,
  };
}

// The blank "surprise me" state the menu opened with before recipes were
// pre-loaded; fresh arrays each call because the menu mutates them in place.
const defaultGrooves = () => [[2, 2, 2, 2]];
const defaultArrangement = () => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

export default function Generate({ onClose }: GenerateProps) {
  const dispatch = useDispatch()
  // Pre-load the controls with the recipe that produced the current song
  // (grooves copied: the store freezes its arrays, the menu splices in place).
  // Songs without a stored recipe (e.g. older saves) open the blank state.
  const params = useSelector((state: { song: SongState }) => state.song.params);
  const songKey = useSelector((state: { song: SongState }) => state.song.key);
  const parsedKey = parseKey(songKey);

  const [grooves, setGrooves] = useState(params ? params.grooves.map(groove => [...groove]) : defaultGrooves());
  const [arrangement, setArrangement] = useState(params ? params.arrangement.map(section => [...section]) : defaultArrangement());
  const [triplet, setTriplet] = useState(params ? params.triplet : 0.0)
  const [selectedKey, setSelectedKey] = useState(parsedKey?.letter ?? '');
  const [sharpFlat, setSharpFlat] = useState<string>(parsedKey?.accidental ?? '♮')
  const [tonality, setTonality] = useState<string | undefined>(parsedKey?.tonality)
  const [key, setKey] = useState<number | undefined>(parsedKey?.key)
  const [modify, setModify] = useState<number>(parsedKey?.modify ?? 0)
  const [toneModify, setToneModify] = useState<number>(parsedKey?.toneModify ?? 0)
  const [keyAdjust, setKeyAdjust] = useState<number | undefined>()
  const [bpm, setBpm] = useState<number | undefined>(params?.bpm)
  const [songLength, setSongLength] = useState<number | undefined>(params?.songLength)

  // Revert every control to the blank state (random key/BPM/length, single
  // half-note groove) — the refresh button next to the title.
  const resetDefaults = () => {
    setGrooves(defaultGrooves());
    setArrangement(defaultArrangement());
    setTriplet(0.0);
    setSelectedKey('');
    setSharpFlat('♮');
    setTonality(undefined);
    setKey(undefined);
    setModify(0);
    setToneModify(0);
    setBpm(undefined);
    setSongLength(undefined);
  };

  const handleKeyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSharpFlat('♮')
    setTonality('Major')
    setToneModify(0)
    setSelectedKey(e.target.value);
    if (e.target.value === '') {
      setSharpFlat('♮')
      setModify(0)
      setToneModify(0)
      setTonality(undefined)
      setKey(undefined)
    } else if (e.target.value === 'A') {
      setKey(-3)
    } else if (e.target.value === 'B') {
      setKey(-1)
    } else if (e.target.value === 'C') {
      setKey(0)
    } else if (e.target.value === 'D') {
      setKey(2)
    } else if (e.target.value === 'E') {
      setKey(4)
    } else if (e.target.value === 'F') {
      setKey(-7)
    } else if (e.target.value === 'G') {
      setKey(-5)
    }
  };

  const handleModifyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '♮') {
      setSharpFlat('♮')
      setModify(0)
    } else if (e.target.value === '#') {
      setSharpFlat('#')
      setModify(1)
    } else if (e.target.value === '♭') {
      setSharpFlat('♭')
      setModify(-1)
    } else {
      setSharpFlat('♮')
      setModify(0)
    }
  }

  const handleTonalityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'Major' || e.target.value === 'Minor') {
      setTonality(e.target.value);
      if (e.target.value === 'Major') {
        setToneModify(0)
      } else if (e.target.value === 'Minor') {
        setToneModify(3)
      }
    } else {
      setTonality(undefined)
    }
  };

  useEffect(()=> {
    if (key != undefined) {
      setKeyAdjust(key + modify + toneModify)
    } else {
      setKeyAdjust(undefined)
    }
  })

  // Number inputs only enforce min/max on the spinner arrows, not typed
  // values, so clamp here — a too-short length would yield a zero-part song.
  const clamp = (value: number | undefined, min: number, max: number) =>
    value === undefined ? undefined : Math.min(max, Math.max(min, value));

  const updateSong = () => {
    dispatch(setSong(generateSong(grooves, arrangement, triplet, keyAdjust, tonality, clamp(bpm, minBpm, maxBpm), clamp(songLength, minLength, maxLength))))
    onClose()
  }

  const sameArrays = (a: number[][], b: number[][]) =>
    a.length === b.length && a.every((row, i) => row.length === b[i].length && row.every((value, j) => value === b[i][j]));

  // True while every control still matches the pre-loaded recipe — the user
  // is effectively asking for "the same song again", which the un-pinned
  // randomness won't deliver. Compared by value so editing a control and
  // putting it back counts as unchanged.
  const recipeUnchanged = params != null &&
    sameArrays(grooves, params.grooves) &&
    sameArrays(arrangement, params.arrangement) &&
    triplet === params.triplet &&
    bpm === params.bpm &&
    songLength === params.songLength &&
    selectedKey === (parsedKey?.letter ?? '') &&
    sharpFlat === (parsedKey?.accidental ?? '♮') &&
    tonality === parsedKey?.tonality;

  const [showShuffleWarning, setShowShuffleWarning] = useState(false);

  const handleRegenerate = () => {
    if (recipeUnchanged) {
      setShowShuffleWarning(true);
    } else {
      updateSong();
    }
  };
  const generateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (generateRef.current && !generateRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
  
    document.addEventListener("mousedown", handler);
  
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const combineNumbers = (grooveIndex: number, index: number) => {
    const newGrooves = [...grooves];
    const numberSum = newGrooves[grooveIndex][index] + newGrooves[grooveIndex][index + 1];
    if (
      numberSum === 0.5 ||
      numberSum === 0.75 ||
      numberSum === 1 ||
      numberSum === 1.5 ||
      numberSum === 2
    ) {
      newGrooves[grooveIndex].splice(index, 2, numberSum);
      setGrooves(newGrooves);
    }
  };

  const divideNumbers = (grooveIndex: number, index: number) => {
    const newGrooves = [...grooves];
    if (newGrooves[grooveIndex][index] === 4) {
      newGrooves[grooveIndex].splice(index, 1, 2);
      newGrooves[grooveIndex].splice(index, 0, 2);
    } else if (newGrooves[grooveIndex][index] === 2) {
      newGrooves[grooveIndex].splice(index, 1, 1);
      newGrooves[grooveIndex].splice(index, 0, 1);
    } else if (newGrooves[grooveIndex][index] === 1) {
      newGrooves[grooveIndex].splice(index, 1, 0.5);
      newGrooves[grooveIndex].splice(index, 0, 0.5);
    } else if (newGrooves[grooveIndex][index] === 0.5) {
      newGrooves[grooveIndex].splice(index, 1, 0.25);
      newGrooves[grooveIndex].splice(index, 0, 0.25);
    }
    setGrooves(newGrooves);
  };

  const addGroove = () => {
    const newGrooves = [...grooves, [2, 2, 2, 2]]; // Add a new groove with initial values
    setGrooves(newGrooves);
  };

  const removeGroove = (grooveIndex: number) => {
    const newGrooves = [...grooves];
    newGrooves.splice(grooveIndex, 1); // Remove the groove at the specified index
    setGrooves(newGrooves);
    setArrangement([   
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],])
  };

  const incrementPart = (value: number, partType: number, partNum: number) => {
    const newArr = [...arrangement]
    if (value < grooves.length - 1){
      newArr[partType].splice(partNum, 1, value+1)
      setArrangement(newArr)
    } else {
      newArr[partType].splice(partNum, 1, 0)
      setArrangement(newArr)
    }
  }

  return (
    <div className={styles.generateContainer} ref={generateRef}>
      <button onClick={onClose}>x</button>
      <div>
        <h2>Generate New Song <button onClick={resetDefaults} title="Reset to blank defaults">↺</button></h2>
        <p>~Under Construction~</p>     
        {grooves.map((groove, grooveIndex) => (
          <div key={grooveIndex}>
            <p>Bass Groove {grooveIndex + 1}:</p>
            <span>
              {groove.map((item: number, index: number) => (
                index === groove.length - 1 ? (
                <span key={index}  onClick={() => divideNumbers(grooveIndex, index)}>
                  <span> </span>
                  <img className={styles.resize} src={noteMapping[item]} alt={`Note ${item}`} />
                  <span> </span>
                  </span>
                  ) : (
                <span key={index}>
                  <span onClick={() => divideNumbers(grooveIndex, index)}>
                    <img className={styles.resize} src={noteMapping[item]} alt={`Note ${item}`} />
                  </span>
                  <span> </span>
                  <button
                    className={styles.grooveButton}
                    onClick={() => combineNumbers(grooveIndex, index)}
                  >
                    +
                  </button>
                </span>
                )
              ))}
            </span>
            {grooveIndex > 0 && (
                <button onClick={() => removeGroove(grooveIndex)}>-</button>
            )}
            {grooveIndex < 3 && (
                <button onClick={addGroove}>+</button>
            )}
          </div>
        ))}
        <div>
            <p>Verse Structure:</p>
            <button onClick={() => incrementPart(arrangement[0][0], 0, 0)}>BG: {arrangement[0][0]+1}</button>
            <button onClick={() => incrementPart(arrangement[0][1], 0, 1)}>BG: {arrangement[0][1]+1}</button>
            <button onClick={() => incrementPart(arrangement[0][2], 0, 2)}>BG: {arrangement[0][2]+1}</button>
            <button onClick={() => incrementPart(arrangement[0][3], 0, 3)}>BG: {arrangement[0][3]+1}</button>

            <p>Chorus Structure:</p>
            <button onClick={() => incrementPart(arrangement[1][0], 1, 0)}>BG: {arrangement[1][0]+1}</button>
            <button onClick={() => incrementPart(arrangement[1][1], 1, 1)}>BG: {arrangement[1][1]+1}</button>
            <button onClick={() => incrementPart(arrangement[1][2], 1, 2)}>BG: {arrangement[1][2]+1}</button>
            <button onClick={() => incrementPart(arrangement[1][3], 1, 3)}>BG: {arrangement[1][3]+1}</button>

            <p>Bridge Structure:</p>
            <button onClick={() => incrementPart(arrangement[2][0], 2, 0)}>BG: {arrangement[2][0]+1}</button>
            <button onClick={() => incrementPart(arrangement[2][1], 2, 1)}>BG: {arrangement[2][1]+1}</button>
            <button onClick={() => incrementPart(arrangement[2][2], 2, 2)}>BG: {arrangement[2][2]+1}</button>
            <button onClick={() => incrementPart(arrangement[2][3], 2, 3)}>BG: {arrangement[2][3]+1}</button>
        </div>
        <p>Triplet Frequency:     
          <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={triplet} // Controlled so pre-load and reset move the thumb
          className={styles.circularDial} // Apply your custom dial styles
          onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          setTriplet(newValue)
          }}
        /></p>
        <p>Key (optional): 
          <select id="note" value={selectedKey} onChange = {handleKeyChange}>
            <option></option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
            <option>E</option>
            <option>F</option>
            <option>G</option>
          </select>
          {selectedKey && (
          <select id="modify" value={sharpFlat} onChange={handleModifyChange}>
            <option>♮</option>
            {(selectedKey === "A" || selectedKey === "C" || selectedKey === "D" || selectedKey === "F" || selectedKey === "G") ? (
              <option>#</option>
            ) : (
              null
            )}
            {(selectedKey === "A" || selectedKey === "B" || selectedKey === "D" || selectedKey === "E" || selectedKey === "G") ? (
              <option>♭</option>
            ) : (
              null
            )}
          </select>
          )}
        </p>
        {selectedKey && (
        <p>Tonality:
          <select id="tonality" value={tonality} onChange = {handleTonalityChange}>
            <option>Major</option>
            <option>Minor</option>
          </select>
          </p>
        )}
        <p>BPM (optional):
          <input
            className={styles.numberInput}
            type="number"
            min={minBpm}
            max={maxBpm}
            placeholder={`${minBpm}-${maxBpm}`}
            value={bpm ?? ''}
            onChange={(e) => setBpm(e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </p>
        <p>Song Length (optional):
          <input
            className={styles.numberInput}
            type="number"
            min={minLength}
            max={maxLength}
            placeholder={`${minLength}-${maxLength}`}
            value={songLength ?? ''}
            onChange={(e) => setSongLength(e.target.value === '' ? undefined : Number(e.target.value))}
          /> seconds
        </p>
        <br/>
        <button onClick={handleRegenerate}>Regenerate</button>
        {showShuffleWarning && recipeUnchanged && (
          <div className={styles.shuffleWarning}>
            <p>
              Every visible setting matches the current song, but the parts of the
              algorithm the menu doesn't expose still get rerolled:
            </p>
            <ul>
              <li>Bass note choices (the grooves only pin the rhythm, not the pitches)</li>
              <li>Drum hit patterns (kick, snare, hi-hat, crash placement)</li>
              <li>Chord change timing, chord substitutions, and voicings</li>
              <li>Bass note accidentals (sharp/flat spelling)</li>
              <li>The Verse/Chorus/Bridge part order and repeat counts</li>
            </ul>
            <button onClick={updateSong}>Regenerate Anyway</button>
            <button onClick={() => setShowShuffleWarning(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
