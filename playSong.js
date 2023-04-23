import midi from 'midi'
import { playBeat, playBass } from './playParts.js'


export async function playVerse(initDrums, initBass, bassDrumV, snareDrumV, hiHatV, flairV, bassV, bpm) {
    const output = new midi.Output()
    output.openPort(0)
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
  
export async function playChorus(initDrums, initBass, bassDrumC, snareDrumC, hiHatC, flairC, bassC, bpm) {
    const output = new midi.Output()
    output.openPort(0)
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
  
export async function playBridge(initDrums, initBass, bassDrumB, snareDrumB, hiHatB, flairB, bassB, bpm) {
    const output = new midi.Output()
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

export async function playSong(songStructure, bpm, initDrums, initBass, bassDrumV, snareDrumV, hiHatV, flairV, bassV, bassDrumC, snareDrumC, hiHatC, flairC, bassC, bassDrumB, snareDrumB, hiHatB, flairB, bassB) {
    const output = new midi.Output()
    output.openPort(0)
    output.sendMessage([144,16,1])
    for (const part of songStructure) {
      output.sendMessage([144,17,1])
      for (let i = 0; i < part.length; i++) {
        switch (part.type) {
          case 'Verse':
            await playVerse(initDrums, initBass, bassDrumV, snareDrumV, hiHatV, flairV, bassV, bpm);
            break;
          case 'Chorus':
            await playChorus(initDrums, initBass, bassDrumC, snareDrumC, hiHatC, flairC, bassC, bpm);
            break;
          case 'Bridge':
            await playBridge(initDrums, initBass, bassDrumB, snareDrumB, hiHatB, flairB, bassB, bpm);
            break;
          default:
            throw new Error(`Invalid part type: ${part.type}`);
        }
      }
    }
    output.sendMessage([144,16,1])
  }