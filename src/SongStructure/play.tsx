import { sumArray, shuffleArray, subdivideArray } from "./groove.js";
import { createDrums, kickString, snareString, hatString, flairString, } from "./drums.js";
import { primaryGroove, bassString1V, bassString2V, bassString3V, bassString4V,
adjustBassString, bassString1B, bassString1C, bassString2C, bassString3C, bassString4C} from "./bass.js";
import { createChords, chordString, adjustChordString } from "./chords.js";
import { melodyGroove, melodyString } from "./melody.js";
import { setKey, findKey } from './key.js';
import { adjustBassNotes, adjustChordNotes } from './playParts.js';
import { generateSongStructure } from './songStructure.js';
import { playSong } from './playSong.js'

export const primaryBass: number[] = primaryGroove();
const primaryBass2: number[] = primaryGroove();
const bassPart1: number[] = Math.random() < 0.5 ? primaryBass : primaryBass2;
const bassPart2: number[] = Math.random() < 0.5 ? primaryBass : primaryBass2;
const bassPart3: number[] = Math.random() < 0.5 ? primaryBass : primaryBass2;
const bassPart4: number[] = Math.random() < 0.5 ? primaryBass : primaryBass2;
const initBass: number[] = bassPart1.concat(bassPart2, bassPart3, bassPart4);
const chorusBass: number[] = bassPart2.concat(bassPart1, bassPart4, bassPart3)
const bridgeBass: number[] = bassPart4.concat(bassPart3, bassPart2, bassPart1)
//let bassCount = sumArray(initBass);
//console.log(bassCount);
const primaryDrums: number[] = createDrums(primaryBass);
const primaryDrums2: number[] = createDrums(primaryBass2);
const drumTrips1: number[] = subdivideArray(primaryDrums);
const drumTrips2: number[] = subdivideArray(primaryDrums2);
const drumPart1: number[] = bassPart1 === primaryBass ? (Math.random() < 0.5 ? primaryDrums : drumTrips1) : (Math.random() < 0.5 ? primaryDrums2 : drumTrips2);
const drumPart2: number[] = bassPart2 === primaryBass ? (Math.random() < 0.5 ? primaryDrums : drumTrips1) : (Math.random() < 0.5 ? primaryDrums2 : drumTrips2);
const drumPart3: number[] = bassPart3 === primaryBass ? (Math.random() < 0.5 ? primaryDrums : drumTrips1) : (Math.random() < 0.5 ? primaryDrums2 : drumTrips2);
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

const bassLine1V: string = bassString1V(bassPart1);
const bassLine2V: string = bassString2V(bassPart2, bassLine1V);
const bassLine3V: string = bassString3V(bassPart3, bassLine2V);
const bassLine4V: string = bassString4V(bassPart4, bassLine1V);
const bassV: string = bassLine1V.concat(bassLine2V + bassLine3V + bassLine4V);

const chordsV: string = chordString(initChords, initBass, bassV)

const melodyLine1V: string = melodyString(primaryMelody, bassPart1, bassLine1V);
const melodyLine2V: string = melodyString(primaryMelody, bassPart2, bassLine2V);
const melodyLine3V: string = melodyString(primaryMelody2, bassPart3, bassLine3V);
const melodyLine4V: string = melodyString(primaryMelody, bassPart4, bassLine4V);
const melodyV: string = melodyLine1V.concat(melodyLine2V + melodyLine3V + melodyLine4V);

const bassDrum1V: string = kickString(drumPart1, bassPart1, bassLine1V);
const bassDrum2V: string = kickString(drumPart2, bassPart2, bassLine2V);
const bassDrum3V: string = kickString(drumPart3, bassPart3, bassLine3V);
const bassDrum4V: string = kickString(drumPart4, bassPart4, bassLine4V);
const bassDrumV: string = bassDrum1V.concat(bassDrum2V + bassDrum3V + bassDrum4V);

const snareDrumV: string = snareString(initDrums);
const hiHatV: string = hatString(initDrums);
const flairV: string = flairString(initDrums, snareDrumV, hiHatV);

//chorus

const bassLine1C: string = bassString1C(bassPart2, bassLine1V);
const bassLine2C: string = bassString2C(bassPart1, bassLine1C);
const bassLine3C: string = bassString3C(bassPart4, bassLine1V);
const bassLine4C: string = bassString4C(bassPart3, bassLine1V);
const bassC: string = bassLine1C.concat(bassLine2C + bassLine3C + bassLine4C);

const chordsC: string = chordString(chorusChords, chorusBass, bassC)

const melodyLine1C: string = melodyString(primaryMelody, primaryBass, bassLine1C);
const melodyLine2C: string = melodyString(primaryMelody, primaryBass, bassLine2C);
const melodyLine3C: string = melodyString(primaryMelody2, primaryBass2, bassLine3C);
const melodyLine4C: string = melodyString(primaryMelody, primaryBass, bassLine4C);
const melodyC: string = melodyLine1C.concat(melodyLine2C + melodyLine3C + melodyLine4C);

const bassDrum1C: string = kickString(drumPart2, bassPart2, bassLine1C);
const bassDrum2C: string = kickString(drumPart1, bassPart1, bassLine2C);
const bassDrum3C: string = kickString(drumPart4, bassPart4, bassLine3C);
const bassDrum4C: string = kickString(drumPart3, bassPart3, bassLine4C);
const bassDrumC: string = bassDrum1C.concat(bassDrum2C + bassDrum3C + bassDrum4C);

const snareDrumC: string = snareString(chorusDrums);
const hiHatC: string = hatString(chorusDrums);
const flairC: string = flairString(chorusDrums, snareDrumC, hiHatC);

//bridge

const bassLine1B: string = bassString1B(bassPart4, bassLine1C);
const bassLine2B: string = bassString2C(bassPart3, bassLine1B);
const bassLine3B: string = bassString3C(bassPart2, bassLine1V);
const bassLine4B: string = bassString4C(bassPart1, bassLine1V);
const bassB: string = bassLine1B.concat(bassLine2B + bassLine3B + bassLine4B);

const chordsB: string = chordString(bridgeChords, bridgeBass, bassB)

const melodyLine1B: string = melodyString(primaryMelody, primaryBass, bassLine1B);
const melodyLine2B: string = melodyString(primaryMelody, primaryBass, bassLine2B);
const melodyLine3B: string = melodyString(primaryMelody2, primaryBass2, bassLine3B);
const melodyLine4B: string = melodyString(primaryMelody, primaryBass, bassLine4B);
const melodyB: string = melodyLine1B.concat(melodyLine2B + melodyLine3B + melodyLine4B);

const bassDrum1B: string = kickString(drumPart4, bassPart4, bassLine1B);
const bassDrum2B: string = kickString(drumPart3, bassPart3, bassLine2B);
const bassDrum3B: string = kickString(drumPart2, bassPart2, bassLine3B);
const bassDrum4B: string = kickString(drumPart1, bassPart1, bassLine4B);
const bassDrumB: string = bassDrum1B.concat(bassDrum2B + bassDrum3B + bassDrum4B);

const snareDrumB: string = snareString(initDrums);
const hiHatB: string = hatString(initDrums);
const flairB: string = flairString(initDrums, snareDrumB, hiHatB);

let keyAdjust: number = setKey()
console.log(keyAdjust)
let key: string = findKey(bassV, keyAdjust)
adjustBassNotes(keyAdjust)
adjustChordNotes(keyAdjust)

//Transpose bass strings and format for reading

let spacedBassV = "";
for (let i = 0; i < bassV.length; i++) {
  spacedBassV += bassV[i] + " ";
}
let bassVA = adjustBassString(spacedBassV, keyAdjust)
let spacedChordsV = "";
for (let i = 0; i < chordsV.length; i++) {
  spacedChordsV += chordsV[i] + "  ";
}
let chordsVA = adjustChordString(spacedChordsV, keyAdjust)

let spacedBassC = "";
for (let i = 0; i < bassC.length; i++) {
  spacedBassC += bassC[i] + " ";
}
let bassCA = adjustBassString(spacedBassC, keyAdjust)
let spacedChordsC = "";
for (let i = 0; i < chordsC.length; i++) {
  spacedChordsC += chordsC[i] + "  ";
}
let chordsCA = adjustChordString(spacedChordsC, keyAdjust)

let spacedBassB = "";
for (let i = 0; i < bassB.length; i++) {
  spacedBassB += bassB[i] + " ";
}
let bassBA = adjustBassString(spacedBassB, keyAdjust)
let spacedChordsB = "";
for (let i = 0; i < chordsB.length; i++) {
  spacedChordsB += chordsB[i] + "  ";
}
let chordsBA = adjustChordString(spacedChordsB, keyAdjust)

const songtime: number = Math.round(Math.random() * (240 - 210) + 210);
const bpm: number = Math.round(Math.random() * (140 - 100) + 100);
const bps: number = bpm / 60;
const beatstotal: number = bps * songtime;
const measures: number = Math.round(beatstotal / 4 / 4) * 4;
const partsLength: number = measures / 8;
const songStructure = generateSongStructure(partsLength, bassVA, bassCA, bassBA, 
  flairV, hiHatV, snareDrumV, bassDrumV,
  flairC, hiHatC, snareDrumC, bassDrumC,
  flairB, hiHatB, snareDrumB, bassDrumB,
  chordsVA, chordsCA, chordsBA) 

  // Bass groove cleaned up for easy reading in console
let line = "";
let sum = 0;
let barCount = 0;

console.log(`Chord Groove:`)

for (let i = 0; i < initChords.length; i++) {
  sum += initChords[i];
  line += initChords[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  } else if (sum >= 7.4) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  } else if (sum >= 6.9) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
if (sum > 0) {
  barCount += 1
  console.log(`Bar (` + barCount + `): ` + line);
  line = "";
  sum = 0;
}
barCount = 0

for (let i = 0; i < chorusChords.length; i++) {
  sum += chorusChords[i];
  line += chorusChords[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  } else if (sum >= 7.4) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  } else if (sum >= 6.9) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
if (sum > 0) {
  barCount += 1
  console.log(`Bar (` + barCount + `): ` + line);
  line = "";
  sum = 0;
}
barCount = 0

for (let i = 0; i < bridgeChords.length; i++) {
  sum += bridgeChords[i];
  line += bridgeChords[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  } else if (sum >= 7.4) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  } else if (sum >= 6.9) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
if (sum > 0) {
  barCount += 1
  console.log(`Bar (` + barCount + `): ` + line);
  line = "";
  sum = 0;
}
barCount = 0

console.log(`
Bass Groove:`)

for (let i = 0; i < initBass.length; i++) {
  sum += initBass[i];
  line += initBass[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

for (let i = 0; i < chorusBass.length; i++) {
  sum += chorusBass[i];
  line += chorusBass[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

for (let i = 0; i < initBass.length; i++) {
  sum += bridgeBass[i];
  line += bridgeBass[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

// Drum groove cleaned up for easy reading in console

console.log(`
Drum Groove:`)

for (let i = 0; i < initDrums.length; i++) {
  sum += initDrums[i];
  line += initDrums[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

for (let i = 0; i < chorusDrums.length; i++) {
  sum += chorusDrums[i];
  line += chorusDrums[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

for (let i = 0; i < bridgeDrums.length; i++) {
  sum += bridgeDrums[i];
  line += bridgeDrums[i] + ", ";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += "| ";
  }
  if (sum >= 7.9 && sum <= 8.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0



console.log(`
Tempo: ` + bpm)
console.log(`Runtime: ` + Math.floor(songtime / 60) + `:` + songtime % 60 + `
`)
console.log(`
Key: ` + key + `
`)

// Song parts
songStructure.forEach(part => {
    console.log(`${part.type}: ${part.length}x
    Chords: ${part.chords}

    Bass:   ${part.bass}
    
    Misc:   ${part.flair}
    HiHat:  ${part.hiHat}
    Snare:  ${part.snare}
    Kick:   ${part.kick}
    `);
  });

playSong(songStructure, bpm, initDrums, initBass, initChords, 
  chorusDrums, chorusBass, chorusChords, bridgeDrums, bridgeBass, bridgeChords, 
  bassDrumV, snareDrumV, hiHatV, flairV, bassV, chordsV, 
  bassDrumC, snareDrumC, hiHatC, flairC, bassC, chordsC, 
  bassDrumB, snareDrumB, hiHatB, flairB, bassB, chordsB);

export const songVariables = {
    songStructure: songStructure,
    bpm: bpm,
    key: key,
    drumPart1: drumPart1,
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
    bassDrumV: bassDrumV, 
    snareDrumV: snareDrumV, 
    hiHatV: hiHatV, 
    flairV: flairV, 
    bassV: bassV, 
    chordsV: chordsV, 
    bassDrumC: bassDrumC, 
    snareDrumC: snareDrumC, 
    hiHatC: hiHatC, 
    flairC: flairC, 
    bassC: bassC, 
    chordsC: chordsC, 
    bassDrumB: bassDrumB, 
    snareDrumB: snareDrumB, 
    hiHatB: hiHatB, 
    flairB: flairB, 
    bassB: bassB, 
    chordsB: chordsB
  }
  