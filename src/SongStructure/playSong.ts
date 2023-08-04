//import midi from 'midi'
import { playBeat, playBass, playChords } from './playParts.js'
import { SongState } from '../reducers.js';

export async function countIn(bpm: number, initDrums: number[], 
  stepsRef: Array<Array<{ index: number; checked: boolean }>>) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(stepsRef[2], initDrums, bpm, stepsRef),
  ])
  }
}

export async function playVerse(bpm: number, verseDrumGroove: number[], verseDrums: Array<Array<{ index: number; checked: boolean }>>,
  verseBassGroove: number[], verseBass: {x: number, y: number, acc: string }[], /*verseChordGroove: number[], verseChords: string*/) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(verseDrums[0], verseDrumGroove, bpm, verseDrums),
      playBeat(verseDrums[1], verseDrumGroove, bpm, verseDrums),
      playBeat(verseDrums[5], verseDrumGroove, bpm, verseDrums),
      playBeat(verseDrums[6], verseDrumGroove, bpm, verseDrums),
      playBeat(verseDrums[8], verseDrumGroove, bpm, verseDrums),
      playBass(verseBass, verseBassGroove, bpm),
      //playChords(verseChords, verseChordGroove, bpm)
    ])
  }
}
  
export async function playDrums(bpm: number, partDrumGroove: number[], partDrums: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[]) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(partDrums[0], partDrumGroove, bpm, partDrums, lamps),
      playBeat(partDrums[1], partDrumGroove, bpm, partDrums),
      playBeat(partDrums[5], partDrumGroove, bpm, partDrums),
      playBeat(partDrums[6], partDrumGroove, bpm, partDrums),
      playBeat(partDrums[8], partDrumGroove, bpm, partDrums),
    ])
  }
}

export async function playSong(song: SongState) {
  let tempo = song.bpm - 60;
  //const output = new midi.Output()
  //output.openPort(3)

  //Start recording

  //output.sendMessage([144, 16, 1])
  //await countIn(song.bpm, song.songStructure[0].drumGroove, song.songStructure[0].drums)
  //output.sendMessage([176, 50, tempo]);

  for (let i = 0; i < song.songStructure.length; i++) {
    let sum = 18;
    //Drop locators
    //output.sendMessage([144, 17, 1])
    //output.sendMessage([176, sum, 1])

    await playVerse(
      song.bpm,
      song.songStructure[i].drumGroove,
      song.songStructure[i].drums,
      song.songStructure[i].bassGroove,
      song.songStructure[i].bassNoteLocations /*, verseChords, verseChordGroove */
    );
    sum += 1;
  }

  // Stop recording
  //output.sendMessage([144, 16, 1])
}