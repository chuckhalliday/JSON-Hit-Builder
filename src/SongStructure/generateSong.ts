import { createDrums, drumArray } from "./drums.js";
import { bassArray1V, bassArray2V, bassArray3V, bassArray4V,
transposeBassArray, bassArray1B, bassArray1C, bassArray2C, bassArray3C, bassArray4C, rollAccidentals} from "./bass.js";
import { createChords, chordArray, transposeChordArray } from "./chords.js";
import { setKey, findKey } from './key.js';
import { generateSongStructure } from './songStructure.js';
import { DrumHit } from "../types";
import { rng } from "./rng";

export default function generateSong(bassGrooves: number[][], arrangement: number[][], tripMod: number, pickedKey?: number, tonality?: string, pickedBpm?: number, pickedLength?: number){

  // Re-roll bass accidentals from the (seeded) RNG before building any lines.
  rollAccidentals();

  const bassGrooveBySection = arrangement.map(section =>
    section.reduce((bass, index) => bass.concat(bassGrooves[index]), [] as number[])
  );
  const [verseBass, chorusBass, bridgeBass] = bassGrooveBySection;

  const drumGrooves = createDrums(bassGrooves, tripMod)
  const drumGrooveBySection = arrangement.map(section =>
    section.reduce((drums, index) => drums.concat(drumGrooves[index]), [] as number[])
  );
  const [verseDrums, chorusDrums, bridgeDrums] = drumGrooveBySection;

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

  const drumHitsVerse: DrumHit[][] = Array.from({ length: 9 }, () => [])

  const bassDrum1V: DrumHit[][] = drumArray(drumHitsVerse, drumGrooves[arrangement[0][0]], bassGrooves[arrangement[0][0]], bassLine1V);
  const bassDrum2V: DrumHit[][] = drumArray(bassDrum1V, drumGrooves[arrangement[0][1]], bassGrooves[arrangement[0][1]], bassLine2V);
  const bassDrum3V: DrumHit[][] = drumArray(bassDrum2V, drumGrooves[arrangement[0][2]], bassGrooves[arrangement[0][2]], bassLine3V);
  const drumVerse: DrumHit[][] = drumArray(bassDrum3V, drumGrooves[arrangement[0][3]], bassGrooves[arrangement[0][3]], bassLine4V);

  //chorus

  const bassLine1C: string[] = bassArray1C(bassGrooves[arrangement[1][0]], bassLine1V);
  const bassLine2C: string[] = bassArray2C(bassGrooves[arrangement[1][1]], bassLine1C);
  const bassLine3C: string[] = bassArray3C(bassGrooves[arrangement[1][2]], bassLine1V);
  const bassLine4C: string[] = bassArray4C(bassGrooves[arrangement[1][3]], bassLine1V);
  const bassC: string[] = bassLine1C.concat(bassLine2C, bassLine3C, bassLine4C);

  const chordsC: string = chordArray(chorusChords, chorusBass, bassC)

  const drumHitsChorus: DrumHit[][] = Array.from({ length: 9 }, () => [])

  const bassDrum1C: DrumHit[][] = drumArray(drumHitsChorus, drumGrooves[arrangement[1][0]], bassGrooves[arrangement[1][0]], bassLine1C);
  const bassDrum2C: DrumHit[][] = drumArray(bassDrum1C, drumGrooves[arrangement[1][1]], bassGrooves[arrangement[1][1]], bassLine2C);
  const bassDrum3C: DrumHit[][] = drumArray(bassDrum2C, drumGrooves[arrangement[1][2]], bassGrooves[arrangement[1][2]], bassLine3C);
  const drumChorus: DrumHit[][] = drumArray(bassDrum3C, drumGrooves[arrangement[1][3]], bassGrooves[arrangement[1][3]], bassLine4C);

  //bridge

  const bassLine1B: string[] = bassArray1B(bassGrooves[arrangement[2][0]], bassLine1C);
  const bassLine2B: string[] = bassArray2C(bassGrooves[arrangement[2][1]], bassLine1B);
  const bassLine3B: string[] = bassArray3C(bassGrooves[arrangement[2][2]], bassLine1V);
  const bassLine4B: string[] = bassArray4C(bassGrooves[arrangement[2][3]], bassLine1V);
  const bassB: string[] = bassLine1B.concat(bassLine2B, bassLine3B, bassLine4B);

  const chordsB: string = chordArray(bridgeChords, bridgeBass, bassB)

  const drumHitsBridge: DrumHit[][] = Array.from({ length: 9 }, () => [])

  const bassDrum1B: DrumHit[][] = drumArray(drumHitsBridge, drumGrooves[arrangement[2][0]], bassGrooves[arrangement[2][0]], bassLine1B);
  const bassDrum2B: DrumHit[][] = drumArray(bassDrum1B, drumGrooves[arrangement[2][1]], bassGrooves[arrangement[2][1]], bassLine2B);
  const bassDrum3B: DrumHit[][] = drumArray(bassDrum2B, drumGrooves[arrangement[2][2]], bassGrooves[arrangement[2][2]], bassLine3B);
  const drumBridge: DrumHit[][] = drumArray(bassDrum3B, drumGrooves[arrangement[2][3]], bassGrooves[arrangement[2][3]], bassLine4B);

  let keyAdjust: number
  if (pickedKey != undefined) {
    keyAdjust = pickedKey
  } else {
    keyAdjust = setKey()
  }
  let key: string = findKey(bassV, keyAdjust)

  let bassVA = transposeBassArray(bassV, keyAdjust)
  let bassCA = transposeBassArray(bassC, keyAdjust)
  let chordsBA = transposeChordArray(chordsB, keyAdjust)

  let chordsVA = transposeChordArray(chordsV, keyAdjust)
  let chordsCA = transposeChordArray(chordsC, keyAdjust)
  let bassBA = transposeBassArray(bassB, keyAdjust)

  // Like pickedKey above: an omitted value falls back to the same random
  // range the on-load song uses, so unset menu fields keep load behavior.
  const songtime: number = pickedLength ?? Math.round(rng() * (240 - 210) + 210);
  const bpm: number = pickedBpm ?? Math.round(rng() * (140 - 100) + 100);
  const bps: number = bpm / 60;
  const beatstotal: number = bps * songtime;
  const measures: number = Math.round(beatstotal / 4 / 4) * 4;
  const partsLength: number = measures / 8;
  
  const songStructure = generateSongStructure(partsLength, bassVA, verseBass, bassCA, chorusBass, bassBA, bridgeBass, 
    chordsVA, verseChords, chordsCA, chorusChords, chordsBA, bridgeChords,
    drumVerse, verseDrums, drumChorus, chorusDrums, drumBridge, bridgeDrums) 

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
  // The recipe that produced this song, so the Generate menu can pre-load
  // it. Grooves/arrangement are copied because the store freezes its state:
  // the menu mutates its working arrays in place and must never share them.
  params: {
    grooves: bassGrooves.map(groove => [...groove]),
    arrangement: arrangement.map(section => [...section]),
    triplet: tripMod,
    bpm: bpm,
    songLength: songtime,
  },
  }
  return songVariables
}