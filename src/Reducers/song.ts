import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "../SongStructure/play";

interface SongState {
    songStructure: {
        type: string;
        repeat: number;
        bass: string[];
        bassGroove: number[];
        kick: string;
        snare: string;
        hiHat: string;
        flair: string;
        drumGroove: number[];
        chords: string;
        chordsGroove: number[];
    }[]
}

const initialState: SongState = {
  songStructure: songVariables.songStructure
};

const song = createSlice({
  name: "song",
  initialState,
  reducers: {

  },
});

export default song;