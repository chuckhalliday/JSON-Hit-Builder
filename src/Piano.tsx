import { useSelector, useDispatch } from 'react-redux';
import { SongState } from './reducers';

import styles from "./Piano.module.scss"

interface PianoProps {

}

const generatePianoKeys = (noteKeys: number[]) => {
    const whiteKeys = [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24, 26, 28, 30, 31, 33, 35];
    const numberOfKeys = 36;
    const keys = [];
  
    for (let i = 0; i < numberOfKeys; i++) {
      if (whiteKeys.includes(i)) {
        keys.push(<div key={i} className={styles.pianoKeys}><input type="radio" className={styles.whiteCheck} checked={noteKeys.includes(i)}></input></div>);
      } else if (i >= 1 && i <= 35 && !whiteKeys.includes(i)) {
        keys.push(<div key={i} className={styles.pianoKeysBlack}><input type="radio" className={styles.blackCheck} checked={noteKeys.includes(i)}></input></div>);
      }
    }
  
    return keys;
  };

export default function Piano() {
  // Generate the array of piano keys

  const song = useSelector((state: { song: SongState }) => state.song)
  const part = song.selectedBeat[0]
  const beat = song.selectedBeat[3]
  const notes = song.songStructure[part].chordTones.midiTones[beat]
  const noteKeys = notes.map(note => note - 53)
  const pianoKeys = generatePianoKeys(noteKeys);


  return (
    <div className={styles.piano}>
      {pianoKeys}
    </div>
  );
}



