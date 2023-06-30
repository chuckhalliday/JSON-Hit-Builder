//import midi from 'midi'
import { playBeat, playBass, playChords } from './playParts.js'

export async function countIn(bpm: number, initDrums: number[], 
  hiHatV: string) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(hiHatV.replace(/\|/g, ''), initDrums, bpm),
  ])
  }
}

export async function playVerse(bpm: number, initDrums: number[], initBass: number[], initChords: number[],
    bassDrumV: string, snareDrumV: string, hiHatV: string, flairV: string, bassV: string, chordsV: string) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(bassDrumV.replace(/\|/g, ''), initDrums, bpm),
      playBeat(snareDrumV.replace(/\|/g, ''), initDrums, bpm),
      playBeat(hiHatV.replace(/\|/g, ''), initDrums, bpm),
      playBeat(flairV.replace(/\|/g, ''), initDrums, bpm),
      playBass(bassV.replace(/\|/g, ''), initBass, bpm),
      playChords(chordsV.replace(/\|/g, ''), initChords, bpm)
    ])
    }
  }
  
export async function playChorus(bpm: number, chorusDrums: number[], chorusBass: number[], chorusChords: number[],
    bassDrumC: string, snareDrumC: string, hiHatC: string, flairC: string, bassC: string, chordsC: string) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(bassDrumC.replace(/\|/g, ''), chorusDrums, bpm),
      playBeat(snareDrumC.replace(/\|/g, ''), chorusDrums, bpm),
      playBeat(hiHatC.replace(/\|/g, ''), chorusDrums, bpm),
      playBeat(flairC.replace(/\|/g, ''), chorusDrums, bpm),
      playBass(bassC.replace(/\|/g, ''), chorusBass, bpm),
      playChords(chordsC.replace(/\|/g, ''), chorusChords, bpm)
    ])
    }
  }
  
export async function playBridge(bpm: number, bridgeDrums: number[], bridgeBass: number[], bridgeChords: number[],
    bassDrumB: string, snareDrumB: string, hiHatB: string, flairB: string, bassB: string, chordsB: string) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(bassDrumB.replace(/\|/g, ''), bridgeDrums, bpm),
      playBeat(snareDrumB.replace(/\|/g, ''), bridgeDrums, bpm),
      playBeat(hiHatB.replace(/\|/g, ''), bridgeDrums, bpm),
      playBeat(flairB.replace(/\|/g, ''), bridgeDrums, bpm),
      playBass(bassB.replace(/\|/g, ''), bridgeBass, bpm),
      playChords(chordsB.replace(/\|/g, ''), bridgeChords, bpm)
    ])
    }
  }

export async function playSong(songStructure: any[], bpm: number, initDrums: number[], initBass: number[], initChords: number[],
    chorusDrums: number[], chorusBass: number[], chorusChords: number[], bridgeDrums: number[], bridgeBass: number[], bridgeChords: number[],
    bassDrumV: string, snareDrumV: string, hiHatV: string, flairV: string, bassV: string, chordsV: string, 
    bassDrumC: string, snareDrumC: string, hiHatC: string, flairC: string, bassC: string, chordsC: string, 
    bassDrumB: string, snareDrumB: string, hiHatB: string, flairB: string, bassB: string, chordsB: string) {
    //const output = new midi.Output()
    //output.openPort(3)
    //Start recording
    let tempo = bpm - 60
    //output.sendMessage([144,16,1])
    await countIn(bpm, initDrums, hiHatV)
    //output.sendMessage([176,50,tempo]);
    let sum = 18
    for (const part of songStructure) {
      //Drop locators
      //output.sendMessage([144,17,1])
      //output.sendMessage([176,sum,1])
      for (let i = 0; i < part.length; i++) {
        switch (part.type) {
          case 'Verse':
            await playVerse(bpm, initDrums, initBass, initChords, 
                bassDrumV, snareDrumV, hiHatV, flairV, bassV, chordsV);
            break;
          case 'Chorus':
            await playChorus(bpm, chorusDrums, chorusBass, chorusChords, 
                bassDrumC, snareDrumC, hiHatC, flairC, bassC, chordsC);
            break;
          case 'Bridge':
            await playBridge(bpm, bridgeDrums, bridgeBass, bridgeChords,
                bassDrumB, snareDrumB, hiHatB, flairB, bassB, chordsB);
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