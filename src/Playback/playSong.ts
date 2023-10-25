//import midi from 'midi'
import playBeat from './playDrums.js';
import playChords from './playChords.js';
import playBass from './playBass.js';
import { SongState } from '../reducers.js';

export async function countIn(bpm: number, midi: boolean, beat: number, initDrums: number[], 
  stepsRef: Array<Array<{ index: number; checked: boolean }>>) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(midi, beat, stepsRef[2], initDrums, bpm, stepsRef),
  ])
  }
}

export async function playVerse(bpm: number, midi: boolean, drumBeat: number, bassBeat: number, chordBeat: number, verseDrumGroove: number[], verseDrums: Array<Array<{ index: number; checked: boolean, accent?: boolean }>>,
  verseBassGroove: number[], verseBass: {x: number, y: number, acc: string }[], verseChordGroove: number[], verseChords: string[], verseChordTones: { oscTones: number[][], midiTones: number[][]}, lamps: HTMLInputElement[]) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(midi, drumBeat, verseDrums[0], verseDrumGroove, bpm, verseDrums, lamps),
      playBeat(midi, drumBeat, verseDrums[1], verseDrumGroove, bpm, verseDrums),
      playBeat(midi, drumBeat, verseDrums[5], verseDrumGroove, bpm, verseDrums),
      playBeat(midi, drumBeat, verseDrums[6], verseDrumGroove, bpm, verseDrums),
      playBeat(midi, drumBeat, verseDrums[8], verseDrumGroove, bpm, verseDrums),
      playBass(midi, bassBeat, verseBass, verseBassGroove, bpm),
      playChords(midi, chordBeat, verseChords, verseChordTones, verseChordGroove, bpm)
    ])
  }
}
  
export async function playDrums(bpm: number, midi: boolean, beat: number, partDrumGroove: number[], partDrums: Array<Array<{ index: number; checked: boolean; accent?: boolean }>>, lamps: HTMLInputElement[]) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(midi, beat, partDrums[0], partDrumGroove, bpm, partDrums, lamps),
      playBeat(midi, beat, partDrums[1], partDrumGroove, bpm, partDrums),
      playBeat(midi, beat, partDrums[5], partDrumGroove, bpm, partDrums),
      playBeat(midi, beat, partDrums[6], partDrumGroove, bpm, partDrums),
      playBeat(midi, beat, partDrums[8], partDrumGroove, bpm, partDrums),
    ])
  }
}

