//import midi from 'midi'
import { playBeat, playBass, playChords } from './playParts.js'

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
  
export async function playDrums(bpm: number, bridgeDrumGroove: number[], bridgeDrums: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[]) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
      playBeat(bridgeDrums[0], bridgeDrumGroove, bpm, bridgeDrums, lamps),
      playBeat(bridgeDrums[1], bridgeDrumGroove, bpm, bridgeDrums),
      playBeat(bridgeDrums[5], bridgeDrumGroove, bpm, bridgeDrums),
      playBeat(bridgeDrums[6], bridgeDrumGroove, bpm, bridgeDrums),
      playBeat(bridgeDrums[8], bridgeDrumGroove, bpm, bridgeDrums),
    ])
  }
}

export async function playSong(song: {
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
          acc: string;
      }[];
      drums: {
          index: number;
          checked: boolean;
          accent?: boolean;
      }[][];
      drumGroove: number[];
      chords: string;
      chordsGroove: number[];
  }[]  
}) {

    //const output = new midi.Output()
    //output.openPort(3)

    //Start recording
    let tempo = song.bpm - 60
    //output.sendMessage([144,16,1])
    //await countIn(song.bpm, song.songStructure[0].drumGroove, song.songStructure[0].drums)
    //output.sendMessage([176,50,tempo]);
      for (let i = 0; i < song.songStructure.length; i++) {
        let sum = 18
        //Drop locators
        //output.sendMessage([144,17,1])
        //output.sendMessage([176,sum,1])
        await playVerse(song.bpm, song.songStructure[i].drumGroove, song.songStructure[i].drums, song.songStructure[i].bassGroove, song.songStructure[i].bassNoteLocations 
                 /*verseChords, verseChordGroove */);
        sum += 1
        }
    //Stop recording
    //output.sendMessage([144,16,1])
  }