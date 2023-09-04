import { useSelector, useDispatch } from 'react-redux';
import { SongState } from './reducers';

import styles from "./Piano.module.scss"

interface PianoProps {

}

const generatePianoKeys = () => {
    const whiteKeys = [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24, 26, 28, 30, 31, 33, 35];
    const numberOfKeys = 36;
    const keys = [];
  
    for (let i = 0; i < numberOfKeys; i++) {
      if (whiteKeys.includes(i)) {
        keys.push(<div key={i} className={styles.pianoKeys}></div>);
      } else if (i >= 1 && i <= 35 && !whiteKeys.includes(i)) {
        keys.push(<div key={i} className={styles.pianoKeysBlack}></div>);
      }
    }
  
    return keys;
  };

export default function Piano() {
  // Generate the array of piano keys
  const pianoKeys = generatePianoKeys();

  const song = useSelector((state: { song: SongState }) => state.song)
  const part = song.selectedBeat[0]
  const beat = song.selectedBeat[3]
  const notes = song.songStructure[part].chordTones.midiTones[beat]

  return (
    <div className={styles.piano}>
      {pianoKeys}
    </div>
  );
}



