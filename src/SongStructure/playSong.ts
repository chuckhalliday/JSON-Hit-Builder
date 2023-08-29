//import midi from 'midi'
import { playBeat, playBass, playChords } from './playParts.js'
import { SongState } from '../reducers.js';

export async function countIn(bpm: number, midi: boolean, initDrums: number[], 
  stepsRef: Array<Array<{ index: number; checked: boolean }>>) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(midi, stepsRef[2], initDrums, bpm, stepsRef),
  ])
  }
}

export async function playVerse(bpm: number, midi: boolean, verseDrumGroove: number[], verseDrums: Array<Array<{ index: number; checked: boolean, accent?: boolean }>>,
  verseBassGroove: number[], verseBass: {x: number, y: number, acc: string }[], verseChordGroove: number[], verseChords: string[], lamps: HTMLInputElement[]) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(midi, verseDrums[0], verseDrumGroove, bpm, verseDrums, lamps),
      playBeat(midi, verseDrums[1], verseDrumGroove, bpm, verseDrums),
      playBeat(midi, verseDrums[5], verseDrumGroove, bpm, verseDrums),
      playBeat(midi, verseDrums[6], verseDrumGroove, bpm, verseDrums),
      playBeat(midi, verseDrums[8], verseDrumGroove, bpm, verseDrums),
      playBass(midi, verseBass, verseBassGroove, bpm),
      playChords(midi, verseChords, verseChordGroove, bpm)
    ])
  }
}
  
export async function playDrums(bpm: number, midi: boolean, partDrumGroove: number[], partDrums: Array<Array<{ index: number; checked: boolean; accent?: boolean }>>, lamps: HTMLInputElement[]) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(midi, partDrums[0], partDrumGroove, bpm, partDrums, lamps),
      playBeat(midi, partDrums[1], partDrumGroove, bpm, partDrums),
      playBeat(midi, partDrums[5], partDrumGroove, bpm, partDrums),
      playBeat(midi, partDrums[6], partDrumGroove, bpm, partDrums),
      playBeat(midi, partDrums[8], partDrumGroove, bpm, partDrums),
    ])
  }
}

