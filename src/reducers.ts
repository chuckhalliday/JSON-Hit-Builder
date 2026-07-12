import { createSlice, PayloadAction, Dispatch } from "@reduxjs/toolkit";
import { SongStructure, NoteLocation, DrumHit, SongParams } from "./types";
import { createRandomSong } from "./SongStructure/createSong";
import { bassPitch } from "./SongStructure/bassPitch";

export interface SongState {
    isPlaying: boolean,
    bpm: number,
    key: string,
    midi: boolean,
    acoustic: boolean,
    selectedBeat: number[],
    songStructure: SongStructure,
    seed: number | null,
    // Generation recipe behind the current song; null for songs saved before
    // recipes were recorded (the Generate menu then opens blank).
    params: SongParams | null
}

// The song tree starts empty and deterministic. The first song is produced by
// the `newSong` thunk dispatched on mount, so importing this module has no side
// effects and startup is reproducible.
const initialState: SongState = {
    isPlaying: false,
    bpm: 120,
    key: '',
    midi: false,
    acoustic: true,
    selectedBeat: [0, 0, 0, 0],
    songStructure: [],
    seed: null,
    params: null
};

const song = createSlice({
    name: "song",
    initialState,
    reducers: {
      setIsPlaying: (state, action: PayloadAction<{ isPlaying: boolean }>) => {
        state.isPlaying = action.payload.isPlaying;
      },
      setMidi: (state, action: PayloadAction<{ midi: boolean }>) => {
        state.midi = action.payload.midi;
      },
      setAcoustic: (state, action: PayloadAction<{ acoustic: boolean }>) => {
        state.acoustic = action.payload.acoustic;
      },
      setSong: (state, action: PayloadAction<{ songStructure: SongStructure, key: string, bpm: number, seed?: number | null, params?: SongParams | null }>) => {
        state.songStructure = action.payload.songStructure;
        state.key = action.payload.key;
        state.bpm = action.payload.bpm;
        state.seed = action.payload.seed ?? null;
        state.params = action.payload.params ?? null;
      },
      setBassState: (state, action: PayloadAction<{ index: number, bassNoteLocations: NoteLocation[] }>) => {
        // Recompute each note's pitch from its (possibly edited) staff position
        // and accidental, so dragging a note or toggling its accidental keeps
        // the stored osc/midi that playback reads in sync with the staff.
        state.songStructure[action.payload.index].bassNoteLocations =
          action.payload.bassNoteLocations.map(note => ({ ...note, ...bassPitch(note.y, note.acc) }));
      },
      setDrumState: (state, action: PayloadAction<{ index: number, drumPart: number, drumStep: number, drums: DrumHit }>) => {
        state.songStructure[action.payload.index].drums[action.payload.drumPart][action.payload.drumStep] = action.payload.drums;
      },
      setChordState: (state, action: PayloadAction<{ part: number, beat: number, midi: number, osc: number, checked: boolean }>) => {
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
        state.selectedBeat = action.payload;
      },
      reorderParts: (state, action: PayloadAction<{ from: number, to: number }>) => {
        const { from, to } = action.payload;
        if (from === to || from < 0 || to < 0 || from >= state.songStructure.length || to >= state.songStructure.length) {
          return;
        }
        const [moved] = state.songStructure.splice(from, 1);
        state.songStructure.splice(to, 0, moved);
      },
      incrementByAmount: (state, action: PayloadAction<string>) => {
        state.bpm = parseFloat(action.payload);
      },
      // Wholesale-replaces the active song state. Used to swap in a
      // previously-generated song tab (see App.tsx's T1-T10 slots), where the
      // whole SongState - not just the generation recipe - needs restoring.
      loadSong: (_state, action: PayloadAction<SongState>) => action.payload,
    },
  });

export const { setIsPlaying, setMidi, setAcoustic, setSong, setBassState, setDrumState, setChordState, setCurrentBeat, reorderParts, incrementByAmount, loadSong } = song.actions;

// Thunk: generate a fresh random song and load it into the store. Replaces the
// old module-load side effect; dispatched on mount (and reusable for a
// "new song" button). Pass a seed to reproduce a specific song.
export const newSong = (seed?: number) => (dispatch: Dispatch) => {
  const { songStructure, key, bpm, seed: usedSeed, params } = createRandomSong(seed);
  dispatch(setSong({ songStructure, key, bpm, seed: usedSeed, params }));
};

export default song;