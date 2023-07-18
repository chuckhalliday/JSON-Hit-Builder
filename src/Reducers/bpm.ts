import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "../SongStructure/play";

interface BpmState {
  value: number;
}

const initialState: BpmState = {
  value: songVariables.bpm,
};

const bpm = createSlice({
  name: "bpm",
  initialState,
  reducers: {
    incrementByAmount: (state, action: PayloadAction<string>) => {
      console.log(action);
      state.value = parseFloat(action.payload);
    },
  },
});

export const { incrementByAmount } = bpm.actions;
export default bpm;