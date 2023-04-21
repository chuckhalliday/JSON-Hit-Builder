import midi from 'midi';
import { shuffleArray, subdivideArray } from "./groove.js";
import { createDrums, kickString, snareString, hatString, flairString, } from "./drums.js";
import { primaryGroove, bassString1, bassString2, bassString3, bassString4, } from "./bass.js";
import { melodyGroove, melodyString } from "./melody.js";

function sumArray(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum;
}

//groove

const primaryBass = primaryGroove();
const primaryBass2 = primaryGroove();
const initBass = primaryBass.concat(primaryBass, primaryBass, primaryBass);
let bassCount = sumArray(initBass);
console.log(bassCount);

const primaryDrums = createDrums(primaryBass);
const primaryDrums2 = createDrums(primaryBass2);
const drumTrips = subdivideArray(primaryDrums);
const initDrums = primaryDrums.concat(drumTrips, primaryDrums2, drumTrips);
let drumCount = sumArray(initDrums);
console.log(drumCount);

const primaryMelody = melodyGroove(primaryBass);
const primaryMelody2 = melodyGroove(primaryBass2);
const initMelody = primaryMelody.concat(primaryMelody, primaryMelody2, primaryMelody);
let melodyCount = sumArray(initMelody);
console.log(melodyCount);

//verse

const bassLine1V = bassString1(primaryBass);
const bassLine2V = bassString2(primaryBass, bassLine1V);
const bassLine3V = bassString3(primaryBass2);
const bassLine4V = bassString4(primaryBass);
const bassV = bassLine1V.concat(bassLine2V + bassLine3V + bassLine4V);

const melodyLine1V = melodyString(primaryMelody, primaryBass, bassLine1V);
const melodyLine2V = melodyString(primaryMelody, primaryBass, bassLine2V);
const melodyLine3V = melodyString(primaryMelody2, primaryBass2, bassLine3V);
const melodyLine4V = melodyString(primaryMelody, primaryBass, bassLine4V);
const melodyV = melodyLine1V.concat(melodyLine2V + melodyLine3V + melodyLine4V);

const bassDrum1V = kickString(primaryDrums, primaryBass, bassLine1V);
const bassDrum2V = kickString(drumTrips, primaryBass, bassLine2V);
const bassDrum3V = kickString(primaryDrums2, primaryBass2, bassLine3V);
const bassDrum4V = kickString(drumTrips, primaryBass, bassLine4V);
const bassDrumV = bassDrum1V.concat(bassDrum2V + bassDrum3V + bassDrum4V);

const snareDrumV = snareString(initDrums);

const hiHatV = hatString(initDrums);

const flairV = flairString(initDrums, snareDrumV, hiHatV);

//chorus

const bassLine1C = bassString1(primaryBass);
const bassLine2C = bassString2(primaryBass, bassLine1C);
const bassLine3C = bassString3(primaryBass2);
const bassLine4C = bassString4(primaryBass);
const bassC = bassLine1C.concat(bassLine2C + bassLine3C + bassLine4C);

const melodyLine1C = melodyString(primaryMelody, primaryBass, bassLine1C);
const melodyLine2C = melodyString(primaryMelody, primaryBass, bassLine2C);
const melodyLine3C = melodyString(primaryMelody2, primaryBass2, bassLine3C);
const melodyLine4C = melodyString(primaryMelody, primaryBass, bassLine4C);
const melodyC = melodyLine1C.concat(melodyLine2C + melodyLine3C + melodyLine4C);

const bassDrum1C = kickString(primaryDrums, primaryBass, bassLine1C);
const bassDrum2C = kickString(drumTrips, primaryBass, bassLine2C);
const bassDrum3C = kickString(primaryDrums2, primaryBass2, bassLine3C);
const bassDrum4C = kickString(drumTrips, primaryBass, bassLine4C);
const bassDrumC = bassDrum1C.concat(bassDrum2C + bassDrum3C + bassDrum4C);

const snareDrumC = snareString(initDrums);

const hiHatC = hatString(initDrums);

const flairC = flairString(initDrums, snareDrumC, hiHatC);

//bridge

const bassLine1B = bassString1(primaryBass);
const bassLine2B = bassString2(primaryBass, bassLine1B);
const bassLine3B = bassString3(primaryBass2);
const bassLine4B = bassString4(primaryBass);
const bassB = bassLine1B.concat(bassLine2B + bassLine3B + bassLine4B);

const melodyLine1B = melodyString(primaryMelody, primaryBass, bassLine1B);
const melodyLine2B = melodyString(primaryMelody, primaryBass, bassLine2B);
const melodyLine3B = melodyString(primaryMelody2, primaryBass2, bassLine3B);
const melodyLine4B = melodyString(primaryMelody, primaryBass, bassLine4B);
const melodyB = melodyLine1B.concat(melodyLine2B + melodyLine3B + melodyLine4B);

const bassDrum1B = kickString(primaryDrums, primaryBass, bassLine1B);
const bassDrum2B = kickString(drumTrips, primaryBass, bassLine2B);
const bassDrum3B = kickString(primaryDrums2, primaryBass2, bassLine3B);
const bassDrum4B = kickString(drumTrips, primaryBass, bassLine4B);
const bassDrumB = bassDrum1B.concat(bassDrum2B + bassDrum3B + bassDrum4B);

const snareDrumB = snareString(initDrums);

const hiHatB = hatString(initDrums);

const flairB = flairString(initDrums, snareDrumB, hiHatB);

const songtime = Math.round(Math.random() * (240 - 210) + 210);
const bpm = Math.round(Math.random() * (140 - 60) + 60);
const bps = bpm / 60;
const beatstotal = bps * songtime;
const measures = Math.round(beatstotal / 4 / 4) * 4;
const partsLength = measures / 4;

let keyDownMin = -7;
let keyUpMax = 7;
let keyAdjust =
  Math.floor(Math.random() * (keyUpMax - keyDownMin + 1)) + keyDownMin;

function findKey(string) {
  const keys = [
    "F", "Gb", "G", "Ab", "A", "Bb", "B", "C",
    "C#", "D", "D#", "E", "F", "F#", "G",
  ];
  let key;
  let tonality;

  if (string.charAt(0) === "c") {
    key = keys[keyAdjust + 7] || "C";
    tonality = "Major";
  } else if (string.charAt(0) === "a") {
    key = keys[keyAdjust + 4] || "A";
    tonality = "Minor";
  } else if (string.charAt(0) === "d") {
    key = keys[keyAdjust + 9] || "D";
    tonality = "Dorian";
  } else if (string.charAt(0) === "e") {
    key = keys[keyAdjust + 11] || "E";
    tonality = "Phrygian";
  } else if (string.charAt(0) === "f") {
    key = keys[keyAdjust + 1] || "F";
    tonality = "Lydian";
  } else if (string.charAt(0) === "g") {
    key = keys[keyAdjust + 3] || "G";
    tonality = "Mixolydian";
  } else if (string.charAt(0) === "b") {
    key = keys[keyAdjust + 7] || "B";
    tonality = "Locrian";
  }
  return key + " " + tonality;
}

let key = findKey(bassV);

const beatDuration = 60 / bpm // duration of one beat in seconds
function wait(time) {
  return new Promise(resolve => setTimeout(resolve, time * 1000));
}

const drumHits = {
  'x': 36, 'X': 36,  // kick drum
  'y': 38, 'Y': 38,  // snare drum
  'v': 42, 'V': 42,  // closed hi-hat
  'w': 46, 'W': 46,  // open hi-hat
  'r': 51, 'R': 51,  // ride cymbal
  'q': 39, 'Q': 39,  // bell
  'z': 49, 'Z': 49,  // crash cymbal
  'u': 47, 'U': 47,  // high tom
  't': 45, 'T': 45,  // mid tom
  's': 43, 'S': 43   // low tom
};

const bassNotes = {
  'o': 29, 'O': 30,   // F
  'p': 31, 'P': 32,   // G
  'a': 33, 'A': 34,  // sharps are capital
  'b': 35,
  'c': 36, 'C': 37,
  'd': 38, 'D': 39,
  'e': 40,
  'f': 41, 'F': 42,
  'g': 43, 'G': 44
};

async function playBeat(pattern, groove) {
  const output = new midi.Output();
  output.openPort(0)
  for (let index = 0; index < pattern.length; index++) {
    const drum = drumHits[pattern[index]];
    const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    const duration = groove[index] * beatDuration
    if (drum) {
      let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      if (pattern[index] === pattern[index].toUpperCase()) {
        velocity = 90;
        if (Math.random() < 0.17) {  // 1 in 6 chance
          velocity = Math.floor(Math.random() * (120 - 100 + 1) + 100);
        }
      }
      output.sendMessage([144, drum, velocity])
      await wait(duration)
      output.sendMessage([128, drum, release])
    } else if (pattern[index] === '-') {
      await wait(duration);
    }
  }
}

async function playBass(pattern, groove) {
  const output = new midi.Output();
  output.openPort(1)
  for (let index = 0; index < pattern.length; index++) {
    const bass = bassNotes[pattern[index]];
    const duration = groove[index] * beatDuration
    if (bass) {
      let velocity = Math.floor(Math.random() * (75 - 60 + 1) + 60);
      let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

      output.sendMessage([144, bass, velocity])
      await wait(duration)
      output.sendMessage([128, bass, release])
    } else if (pattern[index] === '-') {
      await wait(duration);
    }
  }
}

console.log(`Key: ` + key)
console.log(`Tempo: ` + bpm)

console.log(bassV)

console.log(flairV)
console.log(hiHatV)
console.log(snareDrumV)
console.log(bassDrumV)


async function verse() {
  for (let i = 0; i < 2; i++) {
    const kickPromise = playBeat(bassDrumV, initDrums);
    const snarePromise = playBeat(snareDrumV, initDrums)
    const hihatPromise = playBeat(hiHatV, initDrums)
    const flairPromise = playBeat(flairV, initDrums)
    const bassPromise = playBass(bassV, initBass)
    await Promise.all([kickPromise, snarePromise, hihatPromise, flairPromise, bassPromise])
  }
}

verse();
