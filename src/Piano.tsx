import { useSelector, useDispatch } from 'react-redux';
import { SongState, setChordState } from './reducers';
import { midiMap } from './SongStructure/tone';

import styles from "./Piano.module.scss"

interface PianoProps {

}

export default function Piano() {
  // Generate the array of piano keys

  const song = useSelector((state: { song: SongState }) => state.song)
  const part = song.selectedBeat[0]
  const beat = song.selectedBeat[3]
  const notes = song.songStructure[part].chordTones.midiTones[beat]
  const noteKeys = notes.map(note => note - 53)
  const dispatch = useDispatch()

  const generatePianoKeys = (noteKeys: number[]) => {
    const whiteKeys = [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24, 26, 28, 30, 31, 33, 35];
    const numberOfKeys = 36;
    const keys = [];
  
    for (let i = 0; i < numberOfKeys; i++) {
      if (whiteKeys.includes(i)) {
        keys.push(<div key={'piano ' + i} className={styles.pianoKeys}><input key={i + 53} type="checkbox" className={styles.whiteCheck} checked={noteKeys.includes(i)} onChange={(event) => updateChordState(i, event.target.checked)}></input></div>);
      } else if (i >= 1 && i <= 35 && !whiteKeys.includes(i)) {
        keys.push(<div key={'piano ' + i} className={styles.pianoKeysBlack}><input key={i + 53} type="checkbox" className={styles.blackCheck} checked={noteKeys.includes(i)} onChange={(event) => updateChordState(i, event.target.checked)}></input></div>);
      }
    }
  
    return keys;
  };

  const pianoKeys = generatePianoKeys(noteKeys);

  function updateChordState(note: number, checked: boolean) {
    let midi = note + 53
    let osc = midiMap[note]
    dispatch(setChordState({ part: part, beat: beat, midi: midi, osc: osc, checked: checked }));
  }


  return (
    <div className={styles.piano}>
      {pianoKeys}
    </div>
  );
}



