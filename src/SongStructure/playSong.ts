//import midi from 'midi'
import { playBeat, playBass, playChords } from './playParts.js'

export async function countIn(bpm: number, initDrums: number[], 
  stepsRef: Array<Array<{ index: number; checked: boolean }>>) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(stepsRef[0], initDrums, bpm, stepsRef),
  ])
  }
}

export async function playVerse(bpm: number, verseDrumGroove: number[], verseDrums: Array<Array<{ index: number; checked: boolean }>>, verseBassGroove: number[], //verseChordGroove: number[],
    verseBass: {x: number, y: number }[], lamps?: HTMLInputElement[], /* verseChords: string */) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(verseDrums[3], verseDrumGroove, bpm, verseDrums, lamps),
      playBeat(verseDrums[2], verseDrumGroove, bpm, verseDrums),
      playBeat(verseDrums[0], verseDrumGroove, bpm, verseDrums),
      //playBeat(flairV.replace(/\|/g, ''), initDrums, bpm),
      playBass(verseBass, verseBassGroove, bpm),
      //playChords(chordsV.replace(/\|/g, ''), initChords, bpm)
    ])
    }
  }
  
export async function playChorus(bpm: number, chorusDrumGroove: number[], chorusDrums: Array<Array<{ index: number; checked: boolean }>>, chorusBassGroove: number[], //chorusChordGroove: number[],
chorusBass: {x: number, y: number }[], lamps?: HTMLInputElement[], /* chorusChords: string */) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
        playBeat(chorusDrums[3], chorusDrumGroove, bpm, chorusDrums, lamps),
        playBeat(chorusDrums[2], chorusDrumGroove, bpm, chorusDrums),
        playBeat(chorusDrums[0], chorusDrumGroove, bpm, chorusDrums),
      //playBeat(flairC.replace(/\|/g, ''), chorusDrumGroove, bpm),
        playBass(chorusBass, chorusBassGroove, bpm),
      //playChords(chordsC.replace(/\|/g, ''), chorusChords, bpm)
    ])
    }
  }
  
export async function playBridge(bpm: number, bridgeDrumGroove: number[], bridgeDrums: Array<Array<{ index: number; checked: boolean }>>, bridgeBassGroove: number[], //bridgeChordGroove: number[],
bridgeBass: {x: number, y: number }[], lamps?: HTMLInputElement[], /* bridgeChords: string */) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
        playBeat(bridgeDrums[3], bridgeDrumGroove, bpm, bridgeDrums, lamps),
        playBeat(bridgeDrums[2], bridgeDrumGroove, bpm, bridgeDrums),
        playBeat(bridgeDrums[0], bridgeDrumGroove, bpm, bridgeDrums),
      //playBeat(flairB.replace(/\|/g, ''), bridgeDrums, bpm),
        playBass(bridgeBass, bridgeBassGroove, bpm),
      //playChords(chordsB.replace(/\|/g, ''), bridgeChords, bpm)
    ])
    }
  }

export async function playSong(songStructure: any[], bpm: number,
    verseDrums: Array<Array<{ index: number; checked: boolean }>>, verseDrumGroove: number[], 
    verseBass: {x: number, y: number }[], verseBassGroove: number[], 
    /*verseChords: HTMLInputElement[], verseChordGroove: number[],*/
    chorusDrums: Array<Array<{ index: number; checked: boolean }>>, chorusDrumGroove: number[],  
    chorusBass: {x: number, y: number }[], chorusBassGroove: number[],
    /*chorusChords: HTMLInputElement[], chorusChordGroove: number[], */
    bridgeDrums: Array<Array<{ index: number; checked: boolean }>>, bridgeDrumGroove: number[], 
    bridgeBass: {x: number, y: number }[], bridgeBassGroove: number[], 
    /*bridgeChords: HTMLInputElement[], bridgeChordGroove: number[]*/
    verseLamps?: HTMLInputElement[], chorusLamps?: HTMLInputElement[], bridgeLamps?: HTMLInputElement[]) {

    //const output = new midi.Output()
    //output.openPort(3)

    //Start recording
    let tempo = bpm - 60
    //output.sendMessage([144,16,1])
    await countIn(bpm, verseDrumGroove, verseDrums)
    //output.sendMessage([176,50,tempo]);
    let sum = 18
    for (const part of songStructure) {
      //Drop locators
      //output.sendMessage([144,17,1])
      //output.sendMessage([176,sum,1])
      for (let i = 0; i < part.repeat; i++) {
        switch (part.type) {
          case 'Verse':
            await playVerse(bpm, verseDrumGroove, verseDrums, verseBassGroove, verseBass 
                 /*verseChords, verseChordGroove */);
            break;
          case 'Chorus':
            await playChorus(bpm, chorusDrumGroove, chorusDrums, chorusBassGroove, chorusBass 
              /*chorusChords, chorusChordGroove */);
            break;
          case 'Bridge':
            await playBridge(bpm, bridgeDrumGroove, bridgeDrums, bridgeBassGroove, bridgeBass 
              /*bridgeChords, bridgeChordGroove */);
            break;
          default:
            throw new Error(`Invalid part type: ${part.type}`);
        }
      }
      sum += 1
    }
    //Stop recording
    //output.sendMessage([144,16,1])
  }