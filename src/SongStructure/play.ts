import { sumArray, shuffleArray, subdivideArray } from "./groove.js";
import { createDrums, drumArray, /*snareString, hatString, /*flairString, */ } from "./drums.js";
import { primaryGroove, bassString1V, bassString2V, bassString3V, bassString4V,
adjustBassString, bassString1B, bassString1C, bassString2C, bassString3C, bassString4C} from "./bass.js";
import { createChords, chordString, adjustChordString } from "./chords.js";
import { melodyGroove, melodyString } from "./melody.js";
import { setKey, findKey } from './key.js';
import { generateSongStructure } from './songStructure.js';

const primaryBass: number[] = primaryGroove();
const primaryBass2: number[] = primaryGroove();
const bassPart1: number[] = primaryBass
const bassPart2: number[] = Math.random() < 0.4 ? primaryBass : primaryBass2;
const bassPart3: number[] = Math.random() < 0.8 ? primaryBass : primaryBass2;
const bassPart4: number[] = Math.random() < 0.3 ? primaryBass : primaryBass2;
const initBass: number[] = bassPart1.concat(bassPart2, bassPart3, bassPart4);
const chorusBass: number[] = bassPart2.concat(bassPart1, bassPart4, bassPart3)
const bridgeBass: number[] = bassPart4.concat(bassPart3, bassPart2, bassPart1)
//let bassCount = sumArray(initBass);
//console.log(bassCount);
const drumHits: Array<Array<{ index: number; checked: boolean; accent: boolean }>> = [[]]
const primaryDrums: number[] = createDrums(primaryBass);
const primaryDrums2: number[] = createDrums(primaryBass2);
const drumTrips1: number[] = subdivideArray(primaryDrums);
const drumTrips2: number[] = subdivideArray(primaryDrums2);
const drumPart1: number[] = Math.random() < 0.8 ? primaryDrums : drumTrips1
const drumPart2: number[] = bassPart2 === primaryBass ? (Math.random() < 0.5 ? primaryDrums : drumTrips1) : (Math.random() < 0.5 ? primaryDrums2 : drumTrips2);
const drumPart3: number[] = bassPart3 === primaryBass ? (Math.random() < 0.8 ? primaryDrums : drumTrips1) : (Math.random() < 0.8 ? primaryDrums2 : drumTrips2);
const drumPart4: number[] = bassPart4 === primaryBass ? (Math.random() < 0.5 ? primaryDrums : drumTrips1) : (Math.random() < 0.5 ? primaryDrums2 : drumTrips2);
const initDrums: number[] = drumPart1.concat(drumPart2, drumPart3, drumPart4);
const chorusDrums: number[] = drumPart2.concat(drumPart1, drumPart4, drumPart3)
const bridgeDrums: number[] = drumPart4.concat(drumPart3, drumPart2, drumPart1)
//let drumCount = sumArray(initDrums);
//console.log(drumCount);
const primaryMelody: number[] = melodyGroove(primaryBass);
const primaryMelody2: number[] = melodyGroove(primaryBass2);
const initMelody: number[] = primaryMelody.concat(primaryMelody, primaryMelody2, primaryMelody);
//let melodyCount = sumArray(initMelody);
//console.log(melodyCount);

const initChords: number[] = createChords(initBass)
const chorusChords: number[] = createChords(chorusBass)
const bridgeChords: number[] = createChords(bridgeBass)

//verse

const bassLine1V: string[] = bassString1V(bassPart1);
const bassLine2V: string[] = bassString2V(bassPart2, bassLine1V);
const bassLine3V: string[] = bassString3V(bassPart3, bassLine2V);
const bassLine4V: string[] = bassString4V(bassPart4, bassLine1V);
const bassV: string[] = bassLine1V.concat(bassLine2V, bassLine3V, bassLine4V);

const chordsV: string = chordString(initChords, initBass, bassV)

const melodyLine1V: string = melodyString(primaryMelody, bassPart1, bassLine1V);
const melodyLine2V: string = melodyString(primaryMelody, bassPart2, bassLine2V);
const melodyLine3V: string = melodyString(primaryMelody2, bassPart3, bassLine3V);
const melodyLine4V: string = melodyString(primaryMelody, bassPart4, bassLine4V);
const melodyV: string = melodyLine1V.concat(melodyLine2V + melodyLine3V + melodyLine4V);

const drumHitsVerse: { index: number; checked: boolean; accent?: boolean }[][] = Array.from({ length: 9 }, () => [])

const bassDrum1V: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(drumHitsVerse, drumPart1, bassPart1, bassLine1V);
const bassDrum2V: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum1V, drumPart2, bassPart2, bassLine2V);
const bassDrum3V: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum2V, drumPart3, bassPart3, bassLine3V);
const drumVerse: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum3V, drumPart4, bassPart4, bassLine4V);


//chorus

const bassLine1C: string[] = bassString1C(bassPart2, bassLine1V);
const bassLine2C: string[] = bassString2C(bassPart1, bassLine1C);
const bassLine3C: string[] = bassString3C(bassPart4, bassLine1V);
const bassLine4C: string[] = bassString4C(bassPart3, bassLine1V);
const bassC: string[] = bassLine1C.concat(bassLine2C, bassLine3C, bassLine4C);

const chordsC: string = chordString(chorusChords, chorusBass, bassC)

const melodyLine1C: string = melodyString(primaryMelody, primaryBass, bassLine1C);
const melodyLine2C: string = melodyString(primaryMelody, primaryBass, bassLine2C);
const melodyLine3C: string = melodyString(primaryMelody2, primaryBass2, bassLine3C);
const melodyLine4C: string = melodyString(primaryMelody, primaryBass, bassLine4C);
const melodyC: string = melodyLine1C.concat(melodyLine2C + melodyLine3C + melodyLine4C);

const drumHitsChorus: { index: number; checked: boolean; accent?: boolean }[][] = Array.from({ length: 9 }, () => [])

const bassDrum1C: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(drumHitsChorus, drumPart2, bassPart2, bassLine1C);
const bassDrum2C: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum1C, drumPart1, bassPart1, bassLine2C);
const bassDrum3C: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum2C, drumPart4, bassPart4, bassLine3C);
const drumChorus: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum3C, drumPart3, bassPart3, bassLine4C);


//bridge

const bassLine1B: string[] = bassString1B(bassPart4, bassLine1C);
const bassLine2B: string[] = bassString2C(bassPart3, bassLine1B);
const bassLine3B: string[] = bassString3C(bassPart2, bassLine1V);
const bassLine4B: string[] = bassString4C(bassPart1, bassLine1V);
const bassB: string[] = bassLine1B.concat(bassLine2B, bassLine3B, bassLine4B);

const chordsB: string = chordString(bridgeChords, bridgeBass, bassB)

const melodyLine1B: string = melodyString(primaryMelody, primaryBass, bassLine1B);
const melodyLine2B: string = melodyString(primaryMelody, primaryBass, bassLine2B);
const melodyLine3B: string = melodyString(primaryMelody2, primaryBass2, bassLine3B);
const melodyLine4B: string = melodyString(primaryMelody, primaryBass, bassLine4B);
const melodyB: string = melodyLine1B.concat(melodyLine2B + melodyLine3B + melodyLine4B);

const drumHitsBridge: { index: number; checked: boolean; accent?: boolean }[][] = Array.from({ length: 9 }, () => [])

const bassDrum1B: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(drumHitsBridge, drumPart4, bassPart4, bassLine1B);
const bassDrum2B: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum1B, drumPart3, bassPart3, bassLine2B);
const bassDrum3B: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum2B, drumPart2, bassPart2, bassLine3B);
const drumBridge: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum3B, drumPart1, bassPart1, bassLine4B);


let keyAdjust: number = setKey()
let key: string = findKey(bassV, keyAdjust)


let bassVA = adjustBassString(bassV, keyAdjust)
let chordsVA = adjustChordString(chordsV, keyAdjust)

let bassCA = adjustBassString(bassC, keyAdjust)
let chordsCA = adjustChordString(chordsC, keyAdjust)

let bassBA = adjustBassString(bassB, keyAdjust)
let chordsBA = adjustChordString(chordsB, keyAdjust)

const songtime: number = Math.round(Math.random() * (240 - 210) + 210);
const bpm: number = Math.round(Math.random() * (140 - 100) + 100);
const bps: number = bpm / 60;
const beatstotal: number = bps * songtime;
const measures: number = Math.round(beatstotal / 4 / 4) * 4;
const partsLength: number = measures / 8;
const songStructure = generateSongStructure(partsLength, bassVA, initBass, bassCA, chorusBass, bassBA, bridgeBass,
  drumVerse, initDrums,
  drumChorus, chorusDrums,
  drumBridge, bridgeDrums,
  chordsVA, initChords, chordsCA, chorusChords, chordsBA, bridgeChords) 

let totalSteps: number = 0
for (let i = 0; i < songStructure.length; i++) {
  totalSteps += songStructure[i].drumGroove.length
}
const allStepIds = [...Array(totalSteps).keys()]

for (let i = 0; i < songStructure.length; i++) {
  let stepIds = allStepIds.splice(0, songStructure[i].drumGroove.length)
  songStructure[i].stepIds = stepIds
}

export const songVariables = {
    songStructure: songStructure,
    bpm: bpm,
    key: key,
    bassDrum1V: bassDrum1V,
    initDrums: initDrums, 
    initBass: initBass, 
    initChords: initChords, 
    chorusDrums: chorusDrums, 
    chorusBass: chorusBass, 
    chorusChords: chorusChords, 
    bridgeDrums: bridgeDrums, 
    bridgeBass: bridgeBass, 
    bridgeChords: bridgeChords, 
    drumVerse: drumVerse, 
    bassV: bassV, 
    chordsV: chordsV, 
    drumChorus: drumChorus, 
    bassC: bassC, 
    drumBridge: drumBridge,  
    bassB: bassB, 
    chordsB: chordsB
  }
  