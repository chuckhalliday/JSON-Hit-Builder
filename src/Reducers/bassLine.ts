import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BassLineState {
  bassVerse: { x: number, y: number }[];
  bassChorus: { x: number, y: number }[];
  bassBridge: { x: number, y: number }[]
}

const initialState: BassLineState = {
  bassVerse: Array.from({ length: 1 }),
  bassChorus: Array.from({ length: 1 }),
  bassBridge: Array.from({ length: 1 })
};

const bassLine = createSlice({
  name: "bassLine",
  initialState,
  reducers: {
    setBassVerse: (state, action: PayloadAction<{ x: number, y: number }[]>) => {
        console.log(action);
        state.bassVerse = action.payload;
      },
    setBassChorus: (state, action: PayloadAction<{ x: number, y: number }[]>) => {
        console.log(action);
        state.bassChorus = action.payload;
      },
    setBassBridge: (state, action: PayloadAction<{ x: number, y: number }[]>) => {
        console.log(action);
        state.bassBridge = action.payload;
      },
  },
});

export const { setBassVerse, setBassChorus, setBassBridge } = bassLine.actions;
export default bassLine;