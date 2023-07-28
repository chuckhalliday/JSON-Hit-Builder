import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "./SongStructure/play";

export interface SongState {
    bpm: number,
    key: string,
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
        stepIds: number[];
        chords: string;
        chordsGroove: number[];
    }[]  
}

const initialState: SongState = {
    bpm: songVariables.bpm,
    key: songVariables.key,
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
      setDrumState: (state, action: PayloadAction<{ index: number, drumPart: number, drumStep: number, drums: { index: number, checked: boolean, accent?: boolean } }>) => {
        console.log(action);
        state.songStructure[action.payload.index].drums[action.payload.drumPart][action.payload.drumStep] = action.payload.drums;
      },
      incrementByAmount: (state, action: PayloadAction<string>) => {
        console.log(action);
        state.bpm = parseFloat(action.payload);
      },
    },
  });

export const { setBassState, setDrumState, incrementByAmount } = song.actions;
export default song;