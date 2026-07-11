import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useDispatch} from "react-redux";
import { setSong } from "../reducers";
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

export default function Generate({ onClose }: GenerateProps) {
  const dispatch = useDispatch()
  const [grooves, setGrooves] = useState([
    // Initial primary bass groove
    [2, 2, 2, 2],
  ]);
  const [arrangement, setArrangement] = useState([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [triplet, setTriplet] = useState(0.0)
  const [selectedKey, setSelectedKey] = useState('');
  const [sharpFlat, setSharpFlat] = useState<string>('♮')
  const [tonality, setTonality] = useState<string | undefined>()
  const [key, setKey] = useState<number | undefined>()
  const [modify, setModify] = useState<number>(0)
  const [toneModify, setToneModify] = useState<number>(0)
  const [keyAdjust, setKeyAdjust] = useState<number | undefined>()
  const [bpm, setBpm] = useState<number | undefined>()
  const [songLength, setSongLength] = useState<number | undefined>()

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
        <h2>Generate New Song</h2>
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
          defaultValue="0" // Set an initial value (e.g., 5)
          className={styles.circularDial} // Apply your custom dial styles
          onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          setTriplet(newValue)
          }}
        /></p>
        <p>Key (optional): 
          <select id="note" onChange = {handleKeyChange}>
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
        <button onClick={() => updateSong()}>Regenerate</button>
      </div>
    </div>
  );
}
