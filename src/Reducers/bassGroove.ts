import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "../SongStructure/play";

interface BassGrooveState {
  verseGroove: number[];
  chorusGroove: number[];
  bridgeGroove: number[]
}

const initialState: BassGrooveState = {
  verseGroove: songVariables.initBass,
  chorusGroove: songVariables.chorusBass,
  bridgeGroove: songVariables.bridgeBass
};

const bassGroove = createSlice({
  name: "bassGroove",
  initialState,
  reducers: {

  },
});

export default bassGroove;