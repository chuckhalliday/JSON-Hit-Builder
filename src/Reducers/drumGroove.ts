import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "../SongStructure/play";

interface DrumGrooveState {
  verseGroove: number[];
  chorusGroove: number[];
  bridgeGroove: number[]
}

const initialState: DrumGrooveState = {
  verseGroove: songVariables.initDrums,
  chorusGroove: songVariables.chorusDrums,
  bridgeGroove: songVariables.bridgeDrums
};

const drumGroove = createSlice({
  name: "drumGroove",
  initialState,
  reducers: {

  },
});

export default drumGroove;