import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { randomGroove, randomArrangement } from "./SongStructure/groove";
import generateSong from "./SongStructure/generateSong";

const randomBassGrooves: number[][] = [randomGroove(), randomGroove(), randomGroove(), randomGroove()]
const songVariables = generateSong(randomBassGrooves, randomArrangement(), (Math.random()/4))

export interface SongState {
    isPlaying: boolean,
    bpm: number,
    key: string,
    midi: boolean,
    selectedBeat: number[],
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
      drums: { index: number; checked: boolean; accent?: boolean }[][]
      drumGroove: number[];
      stepIds: number[];
      chords: string[];
      chordTones: {
        oscTones: number[][],
        midiTones: number[][]
      }
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
      setSong: (state, action: PayloadAction<{ songStructure: any, key: string, bpm: number }>) => {
        console.log(action);
        state.songStructure = action.payload.songStructure;
        state.key = action.payload.key;
        state.bpm = action.payload.bpm
      },
      setBassState: (state, action: PayloadAction<{ index: number, bassNoteLocations: { x: number, y: number, acc: string }[] }>) => {
        console.log(action);
        state.songStructure[action.payload.index].bassNoteLocations = action.payload.bassNoteLocations;
      },
      setDrumState: (state, action: PayloadAction<{ index: number, drumPart: number, drumStep: number, drums: { index: number, checked: boolean, accent?: boolean } }>) => {
        console.log(action);
        state.songStructure[action.payload.index].drums[action.payload.drumPart][action.payload.drumStep] = action.payload.drums;
      },
      setChordState: (state, action: PayloadAction<{ part: number, beat: number, midi: number, osc: number, checked: boolean }>) => {
        console.log(action);
        if (action.payload.checked) {
          state.songStructure[action.payload.part].chordTones.midiTones[action.payload.beat].push(action.payload.midi) 
          state.songStructure[action.payload.part].chordTones.oscTones[action.payload.beat].push(action.payload.osc)
        } else {
          const midiIndex = state.songStructure[action.payload.part].chordTones.midiTones[action.payload.beat].indexOf(action.payload.midi);
          if (midiIndex !== -1) {
            state.songStructure[action.payload.part].chordTones.midiTones[action.payload.beat].splice(midiIndex, 1);
          }
          const oscIndex = state.songStructure[action.payload.part].chordTones.oscTones[action.payload.beat].indexOf(action.payload.osc);
          if (oscIndex !== -1) {
            state.songStructure[action.payload.part].chordTones.oscTones[action.payload.beat].splice(oscIndex, 1);
          }
        }
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

export const { setIsPlaying, setMidi, setSong, setBassState, setDrumState, setChordState, setCurrentBeat, incrementByAmount } = song.actions;
export default song;