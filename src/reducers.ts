import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { songVariables } from "./SongStructure/play";

export interface SongState {
    isPlaying: boolean,
    bpm: number,
    key: string,
    midi: boolean,
    selectedBeat: number [],
    songStructure: {
        type: string;
        repeat: number;
        bass: string[];
        bassGroove: number[];
        bassGrid: number[];
        bassNoteLocations: {
            x: number;
            y: number;
            acc: string;
        }[];
        measureLines: number[];
        drums: {
            index: number;
            checked: boolean;
            accent?: boolean;
        }[][];
        drumGroove: number[];
        stepIds: number[];
        chords: string[];
        chordsGroove: number[];
        chordsLocation: number[];
    }[]  
}

const initialState: SongState = {
    isPlaying: false,
    bpm: songVariables.bpm,
    key: songVariables.key,
    midi: false,
    selectedBeat: [0, 0, 0, 0],
    songStructure: songVariables.songStructure
};

const song = createSlice({
    name: "song",
    initialState,
    reducers: {
      setIsPlaying: (state, action: PayloadAction<{ isPlaying: boolean }>) => {
        console.log(action);
        state.isPlaying = action.payload.isPlaying;
      },
      setMidi: (state, action: PayloadAction<{ midi: boolean }>) => {
        console.log(action);
        state.midi = action.payload.midi;
      },
      setBassState: (state, action: PayloadAction<{ index: number, bassNoteLocations: { x: number, y: number, acc: string }[] }>) => {
        console.log(action);
        state.songStructure[action.payload.index].bassNoteLocations = action.payload.bassNoteLocations;
      },
      setDrumState: (state, action: PayloadAction<{ index: number, drumPart: number, drumStep: number, drums: { index: number, checked: boolean, accent?: boolean } }>) => {
        console.log(action);
        state.songStructure[action.payload.index].drums[action.payload.drumPart][action.payload.drumStep] = action.payload.drums;
      },
      setCurrentBeat: (state, action: PayloadAction<number[]>) => {
        console.log(action);
        state.selectedBeat = action.payload;
      },
      incrementByAmount: (state, action: PayloadAction<string>) => {
        console.log(action);
        state.bpm = parseFloat(action.payload);
      },
    },
  });

export const { setIsPlaying, setMidi, setBassState, setDrumState, setCurrentBeat, incrementByAmount } = song.actions;
export default song;