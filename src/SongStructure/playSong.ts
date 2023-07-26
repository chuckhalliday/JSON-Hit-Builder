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

export async function playVerse(bpm: number, verseDrumGroove: number[], verseDrums: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[],
  verseBassGroove?: number[], verseBass?: {x: number, y: number }[], /*verseChordGroove: number[], verseChords: string*/) {
      for (let i = 0; i < 1; i++) {
        if (verseBass && verseBassGroove) {
          await Promise.all([
            playBeat(verseDrums[3], verseDrumGroove, bpm, verseDrums, lamps),
            playBeat(verseDrums[2], verseDrumGroove, bpm, verseDrums),
            playBeat(verseDrums[1], verseDrumGroove, bpm, verseDrums),
            playBeat(verseDrums[0], verseDrumGroove, bpm, verseDrums),
            playBass(verseBass, verseBassGroove, bpm),
            //playChords(verseChords, verseChordGroove, bpm)
          ])
        } else {
          await Promise.all([
            playBeat(verseDrums[3], verseDrumGroove, bpm, verseDrums, lamps),
            playBeat(verseDrums[2], verseDrumGroove, bpm, verseDrums),
            playBeat(verseDrums[1], verseDrumGroove, bpm, verseDrums),
            playBeat(verseDrums[0], verseDrumGroove, bpm, verseDrums),
          ])
        }
      }
  }
  
export async function playChorus(bpm: number, chorusDrumGroove: number[], chorusDrums: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[],
chorusBassGroove?: number[], chorusBass?: {x: number, y: number }[], /* chorusChordGroove: number[], chorusChords: string */) {
  for (let i = 0; i < 1; i++) {
    if (chorusBass && chorusBassGroove) {
      await Promise.all([
        playBeat(chorusDrums[3], chorusDrumGroove, bpm, chorusDrums, lamps),
        playBeat(chorusDrums[2], chorusDrumGroove, bpm, chorusDrums),
        playBeat(chorusDrums[1], chorusDrumGroove, bpm, chorusDrums),
        playBeat(chorusDrums[0], chorusDrumGroove, bpm, chorusDrums),
        playBass(chorusBass, chorusBassGroove, bpm),
        //playChords(chorusChords, chorusChordGroove, bpm)
      ])
    } else {
      await Promise.all([
        playBeat(chorusDrums[3], chorusDrumGroove, bpm, chorusDrums, lamps),
        playBeat(chorusDrums[2], chorusDrumGroove, bpm, chorusDrums),
        playBeat(chorusDrums[1], chorusDrumGroove, bpm, chorusDrums),
        playBeat(chorusDrums[0], chorusDrumGroove, bpm, chorusDrums),
      ])
    }
  }
  }
  
export async function playBridge(bpm: number, bridgeDrumGroove: number[], bridgeDrums: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[],
bridgeBassGroove?: number[], bridgeBass?: {x: number, y: number }[], /* bridgeChordGroove: number[], bridgeChords: string */) {
    for (let i = 0; i < 1; i++) {
      if (bridgeBass && bridgeBassGroove) {
        await Promise.all([
          playBeat(bridgeDrums[3], bridgeDrumGroove, bpm, bridgeDrums, lamps),
          playBeat(bridgeDrums[2], bridgeDrumGroove, bpm, bridgeDrums),
          playBeat(bridgeDrums[1], bridgeDrumGroove, bpm, bridgeDrums),
          playBeat(bridgeDrums[0], bridgeDrumGroove, bpm, bridgeDrums),
          playBass(bridgeBass, bridgeBassGroove, bpm),
          //playChords(bridgeChords, bridgeChordGroove, bpm)
        ])
      } else {
        await Promise.all([
          playBeat(bridgeDrums[3], bridgeDrumGroove, bpm, bridgeDrums, lamps),
          playBeat(bridgeDrums[2], bridgeDrumGroove, bpm, bridgeDrums),
          playBeat(bridgeDrums[1], bridgeDrumGroove, bpm, bridgeDrums),
          playBeat(bridgeDrums[0], bridgeDrumGroove, bpm, bridgeDrums),
        ])
      }
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
    verseLamps: HTMLInputElement[], chorusLamps: HTMLInputElement[], bridgeLamps: HTMLInputElement[]) {

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
            await playVerse(bpm, verseDrumGroove, verseDrums, verseLamps, verseBassGroove, verseBass 
                 /*verseChords, verseChordGroove */);
            break;
          case 'Chorus':
            await playChorus(bpm, chorusDrumGroove, chorusDrums, chorusLamps, chorusBassGroove, chorusBass 
              /*chorusChords, chorusChordGroove */);
            break;
          case 'Bridge':
            await playBridge(bpm, bridgeDrumGroove, bridgeDrums, bridgeLamps, bridgeBassGroove, bridgeBass 
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