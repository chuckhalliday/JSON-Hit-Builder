import midi from 'midi'
import { playBeat, playBass } from './playParts.js'

export async function countIn(bpm, initDrums, 
  hiHatV) {
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(hiHatV.replace(/\|/g, ''), initDrums, bpm),
  ])
  }
}

export async function playVerse(bpm, initDrums, initBass, 
    bassDrumV, snareDrumV, hiHatV, flairV, bassV) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(bassDrumV.replace(/\|/g, ''), initDrums, bpm),
      playBeat(snareDrumV.replace(/\|/g, ''), initDrums, bpm),
      playBeat(hiHatV.replace(/\|/g, ''), initDrums, bpm),
      playBeat(flairV.replace(/\|/g, ''), initDrums, bpm),
      playBass(bassV.replace(/\|/g, ''), initBass, bpm)
    ])
    }
  }
  
export async function playChorus(bpm, initDrums, initBass, 
    bassDrumC, snareDrumC, hiHatC, flairC, bassC) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(bassDrumC.replace(/\|/g, ''), initDrums, bpm),
      playBeat(snareDrumC.replace(/\|/g, ''), initDrums, bpm),
      playBeat(hiHatC.replace(/\|/g, ''), initDrums, bpm),
      playBeat(flairC.replace(/\|/g, ''), initDrums, bpm),
      playBass(bassC.replace(/\|/g, ''), initBass, bpm)
    ])
    }
  }
  
export async function playBridge(bpm, initDrums, initBass, 
    bassDrumB, snareDrumB, hiHatB, flairB, bassB) {
    for (let i = 0; i < 1; i++) {
      await Promise.all([
      playBeat(bassDrumB.replace(/\|/g, ''), initDrums, bpm),
      playBeat(snareDrumB.replace(/\|/g, ''), initDrums, bpm),
      playBeat(hiHatB.replace(/\|/g, ''), initDrums, bpm),
      playBeat(flairB.replace(/\|/g, ''), initDrums, bpm),
      playBass(bassB.replace(/\|/g, ''), initBass, bpm)
    ])
    }
  }

export async function playSong(songStructure, bpm, initDrums, initBass, 
    chorusDrums, chorusBass, bridgeDrums, bridgeBass, 
    bassDrumV, snareDrumV, hiHatV, flairV, bassV, 
    bassDrumC, snareDrumC, hiHatC, flairC, bassC, 
    bassDrumB, snareDrumB, hiHatB, flairB, bassB) {
    const output = new midi.Output()
    output.openPort(3)
    //Start recording
    let tempo = bpm - 60
    output.sendMessage([176,50,tempo]);
    output.sendMessage([144,16,1])
    await countIn(bpm, initDrums, hiHatV)
    let sum = 18
    for (const part of songStructure) {
      //Drop locators
      output.sendMessage([144,17,1])
      output.sendMessage([176,sum,1])
      for (let i = 0; i < part.length; i++) {
        switch (part.type) {
          case 'Verse':
            await playVerse(bpm, initDrums, initBass, 
                bassDrumV, snareDrumV, hiHatV, flairV, bassV);
            break;
          case 'Chorus':
            await playChorus(bpm, chorusDrums, chorusBass, 
                bassDrumC, snareDrumC, hiHatC, flairC, bassC);
            break;
          case 'Bridge':
            await playBridge(bpm, bridgeDrums, bridgeBass, 
                bassDrumB, snareDrumB, hiHatB, flairB, bassB);
            break;
          default:
            throw new Error(`Invalid part type: ${part.type}`);
        }
      }
      sum += 1
    }
    //Stop recording
    output.sendMessage([144,16,1])
  }