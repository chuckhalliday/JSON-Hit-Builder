import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DrumLineState {
  drumVerse: Array<Array<{ index: number; checked: boolean }>>;
  drumChorus: Array<Array<{ index: number; checked: boolean }>>;
  drumBridge: Array<Array<{ index: number; checked: boolean }>>;
}

const initialState: DrumLineState = {
  drumVerse: Array.from({ length: 4 }, () =>
    Array.from({ length: 1 })
  ),
  drumChorus: Array.from({ length: 4 }, () =>
    Array.from({ length: 1 })
  ),
  drumBridge: Array.from({ length: 4 }, () =>
    Array.from({ length: 1 })
  ),
};

const drumLine = createSlice({
  name: "drumLine",
  initialState,
  reducers: {
    setDrumVerse: (state, action: PayloadAction<Array<Array<{ index: number; checked: boolean }>>>) => {
      console.log(action);
      state.drumVerse = action.payload;
    },
    setDrumChorus: (state, action: PayloadAction<Array<Array<{ index: number; checked: boolean }>>>) => {
      console.log(action);
      state.drumChorus = action.payload;
    },
    setDrumBridge: (state, action: PayloadAction<Array<Array<{ index: number; checked: boolean }>>>) => {
      console.log(action);
      state.drumBridge = action.payload;
    },
  },
});

export const { setDrumVerse, setDrumChorus, setDrumBridge } = drumLine.actions;
export default drumLine;