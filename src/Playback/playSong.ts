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

export interface VersePlaybackResult {
  drumBeat: number;
  bassBeat: number;
  chordBeat: number;
}

export async function playVerse(bpm: number, midi: boolean, drumBeat: number, bassBeat: number, chordBeat: number, verseDrumGroove: number[], verseDrums: Array<Array<{ index: number; checked: boolean, accent?: boolean }>>,
  verseBassGroove: number[], verseBass: {x: number, y: number, acc: string }[], verseChordGroove: number[], verseChords: string[], verseChordTones: { oscTones: number[][], midiTones: number[][]}, lamps: HTMLInputElement[], shouldStop?: () => boolean): Promise<VersePlaybackResult> {
  const [drumEnd, , , , , bassEnd, chordEnd] = await Promise.all([
    playBeat(midi, drumBeat, verseDrums[0], verseDrumGroove, bpm, verseDrums, lamps, shouldStop),
    playBeat(midi, drumBeat, verseDrums[1], verseDrumGroove, bpm, verseDrums, undefined, shouldStop),
    playBeat(midi, drumBeat, verseDrums[5], verseDrumGroove, bpm, verseDrums, undefined, shouldStop),
    playBeat(midi, drumBeat, verseDrums[6], verseDrumGroove, bpm, verseDrums, undefined, shouldStop),
    playBeat(midi, drumBeat, verseDrums[8], verseDrumGroove, bpm, verseDrums, undefined, shouldStop),
    playBass(midi, bassBeat, verseBass, verseBassGroove, bpm, shouldStop, lamps, verseDrumGroove),
    playChords(midi, chordBeat, verseChords, verseChordTones, verseChordGroove, bpm, shouldStop, lamps, verseDrumGroove)
  ])
  return { drumBeat: drumEnd, bassBeat: bassEnd, chordBeat: chordEnd }
}

export async function playDrums(bpm: number, midi: boolean, beat: number, partDrumGroove: number[], partDrums: Array<Array<{ index: number; checked: boolean; accent?: boolean }>>, lamps: HTMLInputElement[], shouldStop?: () => boolean): Promise<number> {
  const [drumEnd] = await Promise.all([
    playBeat(midi, beat, partDrums[0], partDrumGroove, bpm, partDrums, lamps, shouldStop),
    playBeat(midi, beat, partDrums[1], partDrumGroove, bpm, partDrums, undefined, shouldStop),
    playBeat(midi, beat, partDrums[5], partDrumGroove, bpm, partDrums, undefined, shouldStop),
    playBeat(midi, beat, partDrums[6], partDrumGroove, bpm, partDrums, undefined, shouldStop),
    playBeat(midi, beat, partDrums[8], partDrumGroove, bpm, partDrums, undefined, shouldStop),
  ])
  return drumEnd
}

