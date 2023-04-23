import midi from 'midi';
import { shuffleArray, subdivideArray } from "./groove.js";
import { createDrums, kickString, snareString, hatString, flairString, } from "./drums.js";
import { primaryGroove, bassString1V, bassString2V, bassString3V, bassString4V,
                        bassString1C, bassString2C, bassString3C, bassString4C } from "./bass.js";
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
//let bassCount = sumArray(initBass);
//console.log(bassCount);

const primaryDrums = createDrums(primaryBass);
const primaryDrums2 = createDrums(primaryBass2);
const drumTrips = subdivideArray(primaryDrums);
const initDrums = primaryDrums.concat(drumTrips, primaryDrums2, drumTrips);
//let drumCount = sumArray(initDrums);
//console.log(drumCount);

const primaryMelody = melodyGroove(primaryBass);
const primaryMelody2 = melodyGroove(primaryBass2);
const initMelody = primaryMelody.concat(primaryMelody, primaryMelody2, primaryMelody);
//let melodyCount = sumArray(initMelody);
//console.log(melodyCount);

//verse

const bassLine1V = bassString1V(primaryBass);
const bassLine2V = bassString2V(primaryBass, bassLine1V);
const bassLine3V = bassString3V(primaryBass2, bassLine2V);
const bassLine4V = bassString4V(primaryBass, bassLine1V);
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

const bassLine1C = bassString1C(primaryBass, bassLine1V);
const bassLine2C = bassString2C(primaryBass, bassLine1C);
const bassLine3C = bassString3C(primaryBass2, bassLine1V);
const bassLine4C = bassString4C(primaryBass, bassLine1V);
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

const bassLine1B = bassString1C(primaryBass, bassLine1V);
const bassLine2B = bassString2C(primaryBass, bassLine1B);
const bassLine3B = bassString3C(primaryBass2, bassLine1V);
const bassLine4B = bassString4C(primaryBass, bassLine1V);
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


let keyDownMin = -7;
let keyUpMax = 7;
let keyAdjust = Math.floor(Math.random() * (keyUpMax - keyDownMin + 1)) + keyDownMin;

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

const songtime = Math.round(Math.random() * (240 - 210) + 210);
const bpm = Math.round(Math.random() * (140 - 60) + 60);
const bps = bpm / 60;
const beatstotal = bps * songtime;
const measures = Math.round(beatstotal / 4 / 4) * 4;
const partsLength = measures / 4;

console.log(`Tempo: ` + bpm)
console.log(`Runtime: ` + Math.floor(songtime / 60) + `:` + songtime % 60 + `
`)

function generateSongStructure(partsLength) {
  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  const songStructure = [];
  let remainingParts = partsLength;
  let lastPartType = '';

  while (remainingParts > 0) {
    let randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    }
    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 2);

    songStructure.push({ type: randomPartType, length: randomPartLength });
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  songStructure.forEach(part => {
    console.log(`${part.type}: ${part.length}x
    `);
  });
  return songStructure;
}

let songStructure = generateSongStructure(partsLength)

const beatDuration = 60 / bpm // duration of one beat in seconds
function wait(time) {
  return new Promise(resolve => setTimeout(resolve, time * 1000));
}

let drumHits = {
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

let bassNotes = {
  'o': 29, 'O': 30,   // F, F#
  'p': 31, 'P': 32,   // G, G#
  'a': 33, 'A': 34,  // All capitals are sharp
  'b': 35,
  'c': 36, 'C': 37,
  'd': 38, 'D': 39,
  'e': 40,
  'f': 41, 'F': 42,
  'g': 43, 'G': 44,
};

function adjustBassString(string) {
  let adjustedString = ""
  for (let i = 0; i < string.length; i++) {
    const keys = [
      "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C",
      "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C",
      "C#", "D"
    ];
  
    if (string.charAt(i) === "a") {
      adjustedString += keys[7 + keyAdjust]
    } else if (string.charAt(i) === "A") {
      adjustedString += keys[8 + keyAdjust]
    } else if (string.charAt(i) === "b") {
      adjustedString += keys[9 + keyAdjust]
    } else if (string.charAt(i) === "c") {
      adjustedString += keys[10 + keyAdjust]
    } else if (string.charAt(i) === "C") {
      adjustedString += keys[11 + keyAdjust]
    } else if (string.charAt(i) === "d") {
      adjustedString += keys[12 + keyAdjust]
    } else if (string.charAt(i) === "D") {
      adjustedString += keys[13 + keyAdjust]
    } else if (string.charAt(i) === "e") {
      adjustedString += keys[14 + keyAdjust]
    } else if (string.charAt(i) === "f") {
      adjustedString += keys[15 + keyAdjust]
    } else if (string.charAt(i) === "F") {
      adjustedString += keys[16 + keyAdjust]
    } else if (string.charAt(i) === "g") {
      adjustedString += keys[17 + keyAdjust]
    } else if (string.charAt(i) === "G") {
      adjustedString += keys[18 + keyAdjust]
    } else if (string.charAt(i) === "o") {
      adjustedString += keys[15 + keyAdjust]
    } else if (string.charAt(i) === "O") {
      adjustedString += keys[16 + keyAdjust]
    } else if (string.charAt(i) === "p") {
      adjustedString += keys[17 + keyAdjust]
    } else if (string.charAt(i) === "P") {
      adjustedString += keys[18 + keyAdjust]
    } else if (string.charAt(i) === "-") {
      adjustedString += "-"
    } else if (string.charAt(i) === "|") {
      adjustedString += "|"
    } else if (string.charAt(i) === " ") {
      adjustedString += " "
    }
  }
  return adjustedString;
}

for (let key in bassNotes) {
  bassNotes[key] = bassNotes[key] + keyAdjust;
}

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



let line = "";
let sum = 0;
let barCount = 0;

console.log(`Bass Groove:`)

for (let i = 0; i < initBass.length; i++) {
  sum += initBass[i];
  line += initBass[i] + ",";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += " | ";
  }
  if (sum >= 3.9 && sum <= 4.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

console.log(`
Drum Groove:`)

for (let i = 0; i < initDrums.length; i++) {
  sum += initDrums[i];
  line += initDrums[i] + ",";
  if (Math.abs(sum / 2 - Math.round(sum / 2)) <= 0.005) {
    line += " | ";
  }
  if (sum >= 3.9 && sum <= 4.1) {
    barCount += 1
    console.log(`Bar ` + barCount + `: ` + line);
    line = "";
    sum = 0;
  }
}
barCount = 0

console.log(`
Key: ` + key)

console.log(`Verse:
`)

let spacedBassV = "";

for (let i = 0; i < bassV.length; i++) {
  spacedBassV += bassV[i] + " ";
}
let bassVA = adjustBassString(spacedBassV)

console.log(`Bass:  ` + bassVA + `
`)

console.log(`Misc:  ` + flairV)
console.log(`HiHat: ` + hiHatV)
console.log(`Snare: ` + snareDrumV)
console.log(`Kick:  ` + bassDrumV + `
`)

console.log(`Chorus:
`)

let spacedBassC = "";

for (let i = 0; i < bassC.length; i++) {
  spacedBassC += bassC[i] + " ";
}
let bassCA = adjustBassString(spacedBassC)
console.log(`Bass:  ` + bassCA + `
`)

console.log(`Misc:  ` + flairC)
console.log(`HiHat: ` + hiHatC)
console.log(`Snare: ` + snareDrumC)
console.log(`Kick:  ` + bassDrumC + `
`)

console.log(`Bridge:
`)

let spacedBassB = "";

for (let i = 0; i < bassB.length; i++) {
  spacedBassB += bassB[i] + " ";
}
let bassBA = adjustBassString(spacedBassB)
console.log(`Bass:  ` + bassBA + `
`)

console.log(`Misc:  ` + flairB)
console.log(`HiHat: ` + hiHatB)
console.log(`Snare: ` + snareDrumB)
console.log(`Kick:  ` + bassDrumB + `
`)


async function verse() {
  const output = new midi.Output()
  output.openPort(0)
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(bassDrumV.replace(/\|/g, ''), initDrums),
    playBeat(snareDrumV.replace(/\|/g, ''), initDrums),
    playBeat(hiHatV.replace(/\|/g, ''), initDrums),
    playBeat(flairV.replace(/\|/g, ''), initDrums),
    playBass(bassV.replace(/\|/g, ''), initBass)
  ])
  }
}

async function chorus() {
  const output = new midi.Output()
  output.openPort(0)
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(bassDrumC.replace(/\|/g, ''), initDrums),
    playBeat(snareDrumC.replace(/\|/g, ''), initDrums),
    playBeat(hiHatC.replace(/\|/g, ''), initDrums),
    playBeat(flairC.replace(/\|/g, ''), initDrums),
    playBass(bassC.replace(/\|/g, ''), initBass)
  ])
  }
}

async function bridge() {
  const output = new midi.Output()
  for (let i = 0; i < 1; i++) {
    await Promise.all([
    playBeat(bassDrumB.replace(/\|/g, ''), initDrums),
    playBeat(snareDrumB.replace(/\|/g, ''), initDrums),
    playBeat(hiHatB.replace(/\|/g, ''), initDrums),
    playBeat(flairB.replace(/\|/g, ''), initDrums),
    playBass(bassB.replace(/\|/g, ''), initBass)
  ])
  }
}

async function playSong(songStructure) {
  const output = new midi.Output()
  output.openPort(0)
  output.sendMessage([144,16,1])
  for (const part of songStructure) {
    output.sendMessage([144,17,1])
    for (let i = 0; i < part.length; i++) {
      switch (part.type) {
        case 'Verse':
          await verse();
          break;
        case 'Chorus':
          await chorus();
          break;
        case 'Bridge':
          await bridge();
          break;
        default:
          throw new Error(`Invalid part type: ${part.type}`);
      }
    }
  }
  output.sendMessage([144,16,1])
}

playSong(songStructure);