import { MutableRefObject, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { SongState, setChordState, setCurrentBeat } from '../reducers';
import { midiMap } from '../SongStructure/tone';
import playChords from '../Playback/playChords';

import styles from "../Styles/Piano.module.scss"

export interface PlayHandle {
  play: () => void;
}

interface PianoProps {
  lampsRef: MutableRefObject<HTMLInputElement[]>;
  onPlayingChange?: (isPlaying: boolean) => void;
}

const Piano = forwardRef<PlayHandle, PianoProps>(function Piano({ lampsRef, onPlayingChange }, ref) {

  const song = useSelector((state: { song: SongState }) => state.song)
  const part = song.selectedBeat[0]
  const beat = song.selectedBeat[3]
  const notes = song.songStructure[part].chordTones.midiTones[beat]
  const noteKeys = notes.map(note => note - 53)
  const dispatch = useDispatch()

  const bpm = song.bpm
  const midi = song.midi
  const chords = song.songStructure[part].chords
  const chordTones = song.songStructure[part].chordTones
  const chordsGroove = song.songStructure[part].chordsGroove
  const drumGroove = song.songStructure[part].drumGroove

  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef(false);

  const handleStartClick = async () => {
    if (isPlaying) {
      stopRef.current = true;
      setIsPlaying(false);
      onPlayingChange?.(false);
      return;
    }
    stopRef.current = false;
    setIsPlaying(true);
    onPlayingChange?.(true);
    const endBeat = await playChords(midi, beat, chords, chordTones, chordsGroove, bpm, () => stopRef.current, lampsRef.current, drumGroove);
    setIsPlaying(false);
    onPlayingChange?.(false);
    const nextBeat = endBeat >= chordsGroove.length ? 0 : endBeat;
    dispatch(setCurrentBeat([part, song.selectedBeat[1], song.selectedBeat[2], nextBeat]));
  };

  useImperativeHandle(ref, () => ({
    play: handleStartClick
  }));

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
});

export default Piano;
