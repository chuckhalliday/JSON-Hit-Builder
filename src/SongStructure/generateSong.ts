import { createDrums, drumArray } from "./drums.js";
import { bassArray1V, bassArray2V, bassArray3V, bassArray4V,
adjustBassArray, bassArray1B, bassArray1C, bassArray2C, bassArray3C, bassArray4C} from "./bass.js";
import { createChords, chordArray, adjustChordArray } from "./chords.js";
import { setKey, findKey } from './key.js';
import { generateSongStructure } from './songStructure.js';

export default function generateSong(bassGrooves: number[][], arrangement: number[][], tripMod: number, pickedKey?: number, tonality?: string){
  console.log(pickedKey)
  console.log(tonality)
  const verseBass: number[] = bassGrooves[arrangement[0][0]].concat(bassGrooves[arrangement[0][1]], bassGrooves[arrangement[0][2]], bassGrooves[arrangement[0][3]]);
  const chorusBass: number[] = bassGrooves[arrangement[1][0]].concat(bassGrooves[arrangement[1][1]], bassGrooves[arrangement[1][2]], bassGrooves[arrangement[1][3]]);
  const bridgeBass: number[] = bassGrooves[arrangement[2][0]].concat(bassGrooves[arrangement[2][1]], bassGrooves[arrangement[2][2]], bassGrooves[arrangement[2][3]]);

  const drumGrooves = createDrums(bassGrooves, tripMod)
  const verseDrums: number[] =  drumGrooves[arrangement[0][0]].concat(drumGrooves[arrangement[0][1]], drumGrooves[arrangement[0][2]], drumGrooves[arrangement[0][3]]);
  const chorusDrums: number[] = drumGrooves[arrangement[1][0]].concat(drumGrooves[arrangement[1][1]], drumGrooves[arrangement[1][2]], drumGrooves[arrangement[1][3]]);
  const bridgeDrums: number[] = drumGrooves[arrangement[2][0]].concat(drumGrooves[arrangement[2][1]], drumGrooves[arrangement[2][2]], drumGrooves[arrangement[2][3]]);

  const verseChords: number[] = createChords(verseBass)
  const chorusChords: number[] = createChords(chorusBass)
  const bridgeChords: number[] = createChords(bridgeBass)

  //verse

  const bassLine1V: string[] = bassArray1V(bassGrooves[arrangement[0][0]], tonality);
  const bassLine2V: string[] = bassArray2V(bassGrooves[arrangement[0][1]], bassLine1V);
  const bassLine3V: string[] = bassArray3V(bassGrooves[arrangement[0][2]], bassLine2V);
  const bassLine4V: string[] = bassArray4V(bassGrooves[arrangement[0][3]], bassLine1V);
  const bassV: string[] = bassLine1V.concat(bassLine2V, bassLine3V, bassLine4V);

  const chordsV: string = chordArray(verseChords, verseBass, bassV)

  const drumHitsVerse: { index: number; checked: boolean; accent?: boolean }[][] = Array.from({ length: 9 }, () => [])

  const bassDrum1V: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(drumHitsVerse, drumGrooves[arrangement[0][0]], bassGrooves[arrangement[0][0]], bassLine1V);
  const bassDrum2V: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum1V, drumGrooves[arrangement[0][1]], bassGrooves[arrangement[0][1]], bassLine2V);
  const bassDrum3V: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum2V, drumGrooves[arrangement[0][2]], bassGrooves[arrangement[0][2]], bassLine3V);
  const drumVerse: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum3V, drumGrooves[arrangement[0][3]], bassGrooves[arrangement[0][3]], bassLine4V);


  //chorus

  const bassLine1C: string[] = bassArray1C(bassGrooves[arrangement[1][0]], bassLine1V);
  const bassLine2C: string[] = bassArray2C(bassGrooves[arrangement[1][1]], bassLine1C);
  const bassLine3C: string[] = bassArray3C(bassGrooves[arrangement[1][2]], bassLine1V);
  const bassLine4C: string[] = bassArray4C(bassGrooves[arrangement[1][3]], bassLine1V);
  const bassC: string[] = bassLine1C.concat(bassLine2C, bassLine3C, bassLine4C);

  const chordsC: string = chordArray(chorusChords, chorusBass, bassC)

  const drumHitsChorus: { index: number; checked: boolean; accent?: boolean }[][] = Array.from({ length: 9 }, () => [])

  const bassDrum1C: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(drumHitsChorus, drumGrooves[arrangement[1][0]], bassGrooves[arrangement[1][0]], bassLine1C);
  const bassDrum2C: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum1C, drumGrooves[arrangement[1][1]], bassGrooves[arrangement[1][1]], bassLine2C);
  const bassDrum3C: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum2C, drumGrooves[arrangement[1][2]], bassGrooves[arrangement[1][2]], bassLine3C);
  const drumChorus: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum3C, drumGrooves[arrangement[1][3]], bassGrooves[arrangement[1][3]], bassLine4C);


  //bridge

  const bassLine1B: string[] = bassArray1B(bassGrooves[arrangement[2][0]], bassLine1C);
  const bassLine2B: string[] = bassArray2C(bassGrooves[arrangement[2][1]], bassLine1B);
  const bassLine3B: string[] = bassArray3C(bassGrooves[arrangement[2][2]], bassLine1V);
  const bassLine4B: string[] = bassArray4C(bassGrooves[arrangement[2][3]], bassLine1V);
  const bassB: string[] = bassLine1B.concat(bassLine2B, bassLine3B, bassLine4B);

  const chordsB: string = chordArray(bridgeChords, bridgeBass, bassB)

  const drumHitsBridge: { index: number; checked: boolean; accent?: boolean }[][] = Array.from({ length: 9 }, () => [])

  const bassDrum1B: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(drumHitsBridge, drumGrooves[arrangement[2][0]], bassGrooves[arrangement[2][0]], bassLine1B);
  const bassDrum2B: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum1B, drumGrooves[arrangement[2][1]], bassGrooves[arrangement[2][1]], bassLine2B);
  const bassDrum3B: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum2B, drumGrooves[arrangement[2][2]], bassGrooves[arrangement[2][2]], bassLine3B);
  const drumBridge: { index: number; checked: boolean; accent?: boolean }[][] = drumArray(bassDrum3B, drumGrooves[arrangement[2][3]], bassGrooves[arrangement[2][3]], bassLine4B);

  let keyAdjust: number

  if (pickedKey != undefined) {
    keyAdjust = pickedKey
  } else {
    keyAdjust = setKey()
  }
  let key: string = findKey(bassV, keyAdjust)


  let bassVA = adjustBassArray(bassV, keyAdjust)
  let chordsVA = adjustChordArray(chordsV, keyAdjust)

  let bassCA = adjustBassArray(bassC, keyAdjust)
  let chordsCA = adjustChordArray(chordsC, keyAdjust)

  let bassBA = adjustBassArray(bassB, keyAdjust)
  let chordsBA = adjustChordArray(chordsB, keyAdjust)

  const songtime: number = Math.round(Math.random() * (240 - 210) + 210);
  const bpm: number = Math.round(Math.random() * (140 - 100) + 100);
  const bps: number = bpm / 60;
  const beatstotal: number = bps * songtime;
  const measures: number = Math.round(beatstotal / 4 / 4) * 4;
  const partsLength: number = measures / 8;
  const songStructure = generateSongStructure(partsLength, bassVA, verseBass, bassCA, chorusBass, bassBA, bridgeBass,
  drumVerse, verseDrums,
  drumChorus, chorusDrums,
  drumBridge, bridgeDrums,
  chordsVA, verseChords, chordsCA, chorusChords, chordsBA, bridgeChords) 

  let totalSteps: number = 0
  for (let i = 0; i < songStructure.length; i++) {
  totalSteps += songStructure[i].drumGroove.length
  }
  const allStepIds = [...Array(totalSteps).keys()]

  for (let i = 0; i < songStructure.length; i++) {
  let stepIds = allStepIds.splice(0, songStructure[i].drumGroove.length)
  songStructure[i].stepIds = stepIds
  }

  const songVariables = {
  songStructure: songStructure,
  bpm: bpm,
  key: key,
  bassDrum1V: bassDrum1V,
  verseDrums: verseDrums, 
  verseBass: verseBass, 
  verseChords: verseChords, 
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
  return songVariables
}