import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { lampToPositions } from '../SongStructure/beatMapping';
import { setCurrentBeat } from '../reducers';

export function useLampStep(
  lampsRef: React.MutableRefObject<HTMLInputElement[]>,
  part: number,
  drumGroove: number[],
  bassGroove: number[],
  chordsGroove: number[],
) {
  const dispatch = useDispatch();
  return useCallback((lampIndex: number) => {
    const lamp = lampsRef.current[lampIndex];
    if (lamp) {
      lamp.checked = true;
      lamp.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    const [drumPos, bassPos, chordPos] = lampToPositions(lampIndex, drumGroove, bassGroove, chordsGroove);
    dispatch(setCurrentBeat([part, drumPos, bassPos, chordPos]));
  }, [lampsRef, part, drumGroove, bassGroove, chordsGroove, dispatch]);
}
