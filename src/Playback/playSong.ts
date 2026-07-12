//import midi from 'midi'
import playBeat from './playDrums.js';
import playChords from './playChords.js';
import playBass from './playBass.js';
import { SongState } from '../reducers.js';
import { DrumHit, NoteLocation, ChordTones } from '../types';

export async function countIn(bpm: number, midi: boolean, beat: number, initDrums: number[],
  stepsRef: DrumHit[][]) {
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

export async function playVerse(bpm: number, midi: boolean, drumBeat: number, bassBeat: number, chordBeat: number, verseDrumGroove: number[], verseDrums: DrumHit[][],
  verseBassGroove: number[], verseBass: NoteLocation[], verseChordGroove: number[], verseChords: string[], verseChordTones: ChordTones, onStep: (lampIndex: number) => void, shouldStop?: () => boolean,
  includeDrums = true, includeBass = true, includeChords = true, acoustic = true, key?: string): Promise<VersePlaybackResult> {
  // Every drum row is scheduled (the synthesized voices cover toms and ride
  // too); only the first carries the lamp-stepping callback.
  const results = await Promise.all([
    ...verseDrums.map((pattern, voice) =>
      playBeat(midi, drumBeat, pattern, verseDrumGroove, bpm, verseDrums, voice === 0 ? onStep : undefined, shouldStop, !includeDrums, acoustic, key)),
    playBass(midi, bassBeat, verseBass, verseBassGroove, bpm, shouldStop, onStep, verseDrumGroove, !includeBass, acoustic),
    playChords(midi, chordBeat, verseChords, verseChordTones, verseChordGroove, bpm, shouldStop, onStep, verseDrumGroove, !includeChords, acoustic)
  ])
  return { drumBeat: results[0], bassBeat: results[verseDrums.length], chordBeat: results[verseDrums.length + 1] }
}

export async function playDrums(bpm: number, midi: boolean, beat: number, partDrumGroove: number[], partDrums: DrumHit[][], onStep: (lampIndex: number) => void, shouldStop?: () => boolean, acoustic = true, key?: string): Promise<number> {
  const ends = await Promise.all(
    partDrums.map((pattern, voice) =>
      playBeat(midi, beat, pattern, partDrumGroove, bpm, partDrums, voice === 0 ? onStep : undefined, shouldStop, undefined, acoustic, key)),
  )
  return ends[0]
}
