import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "../SongStructure/play";

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
      setBassState: (state: { songStructure: {
        type: string;
        repeat: number;
        bass: string[];
        bassGroove: number[];
        bassGrid: number[];
        bassNoteLocations: {
            x: number;
            y: number;
        }[];
        kick: string;
        snare: string;
        hiHat: string;
        flair: string;
        drumGroove: number[];
        chords: string;
        chordsGroove: number[];
    }[] }, action: PayloadAction<{ index: number, bassNoteLocations: { x: number, y: number }[] }>) => {
        console.log(action);
        state.songStructure[action.payload.index].bassNoteLocations = action.payload.bassNoteLocations;
      },
    },
  });

export const { setBassState } = song.actions;
export default song;