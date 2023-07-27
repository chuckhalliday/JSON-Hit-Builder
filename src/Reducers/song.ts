import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "../SongStructure/play";

console.log(songVariables.songStructure)

interface SongState {
    songStructure: {
        type: string;
        repeat: number;
        bass: string[];
        bassGroove: number[];
        bassGrid: number[];
        bassNoteLocations: {
            x: number;
            y: number;
        }[];
        drums: {
            index: number;
            checked: boolean;
            accent?: boolean;
        }[][];
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
      setBassState: (state, action: PayloadAction<{ index: number, bassNoteLocations: { x: number, y: number }[] }>) => {
        console.log(action);
        state.songStructure[action.payload.index].bassNoteLocations = action.payload.bassNoteLocations;
      },
      setDrumState: (state, action: PayloadAction<{ index: number, drums: { index: number, checked: boolean, accent?: boolean }[][] }>) => {
        console.log(action);
        state.songStructure[action.payload.index].drums = action.payload.drums;
      },
    },
  });

export const { setBassState, setDrumState } = song.actions;
export default song;