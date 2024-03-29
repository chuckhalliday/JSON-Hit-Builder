import { chordToneMappings, chordMidiMappings } from "./tone"

export function createChords(bassGroove: number[]) {
  let chordArray = []
  let sum = bassGroove[0]
  for (let i = 1; i < bassGroove.length; i++) {
    let roll = Math.random()
    if (sum >= 2) {
      chordArray.push(sum)
      sum = 0
      sum += bassGroove[i]
    } else if (sum >= 1 && roll < 0.5) {
      chordArray.push(sum)
      sum = 0
      sum += bassGroove[i]
    } else {
      sum += bassGroove[i]
    }
  }
  if (sum > 0) {
    chordArray.push(sum)
  }
  return chordArray
}

export function chordArray(chordsGroove: number[], bassGroove: number[], bassString: string[]) {

const cmajCmaj7 = Math.random() < 0.9 ? "1" : "!";
const dmin7C9 = Math.random() < 0.8 ? "@" : "9";
const emin7Emaj = Math.random() < 0.8 ? "#" : "8";
const f7Fmin = Math.random() < 0.5 ? "$" : "0";
const g7Bdim = Math.random() < 0.7 ? "%" : "7";
const aminCmaj = Math.random() < 0.8 ? "6" : "1";

let chords = ""
let chordSum = 0;
let bassSum = 0;
let arr1Index = 0;

let bass = bassString

for (let i = 0; i < bassGroove.length; i++) {
  const note = bass[i];
    if (bassSum === chordSum) {
      if (Number.isInteger(bassSum / 2)) {
        if (note === "c") {
          chords += cmajCmaj7;
        } else if (note === "d") {
          chords += Math.random() < 0.8 ? "2" : dmin7C9;
        } else if (note === "e") {
          chords += Math.random() < 0.8 ? "3" : emin7Emaj;
        } else if (note === "f") {
          chords += Math.random() < 0.8 ? "4" : f7Fmin;
        } else if (note === "g") {
          chords += Math.random() < 0.8 ? "5" : g7Bdim;
        } else if (note === "a") {
          chords += aminCmaj;
        } else if (note === "b") {
          chords += g7Bdim;
        } else if (note === "o") {
          chords += Math.random() < 0.8 ? "4" : f7Fmin;
        } else if (note === "p") {
          chords += Math.random() < 0.8 ? "5" : g7Bdim;
        } else if (note === "|") {
          chords = chords;
        } else if (note === "-") {
          chords += "-"
        } else {
          chords += "-"
        }      
      } else {
        chords += "-"
      }
      chordSum += chordsGroove[arr1Index]
      chordSum = parseFloat(chordSum.toFixed(2))
      arr1Index ++
    } else {
      chordSum = chordSum
    }
    bassSum += bassGroove[i];
    bassSum = parseFloat(bassSum.toFixed(2))
  }
    return chords;
}

//calculates an array of x-coordinates where chord names should be displayed over bass staff
export function chordLocation(bassLocation: { x: number, y: number, acc: string }[], bassGroove: number[], chordGroove: number[]) {
  let chordX: number[] = []
  let bassSum = 0
  let chordSum = 0
  let chordIndex = 0

  for (let i = 0; i < bassGroove.length; i++){
    if (bassSum === chordSum) {
      chordX.push(bassLocation[i].x)
      chordSum += chordGroove[chordIndex]
      chordIndex++
    }
    bassSum += bassGroove[i]
  }
  return chordX
}

export function transposeChordArray(chordString: string, keyAdjust: number) {
  let transpose: string[] = [];
  let keys: string[] = []
  for (let i = 0; i < chordString.length; i++) {
      const sharpKeys = [-10, -8, -6, -5, -3, -1, 0, 2, 4, 6, 7, 9, 11];
      const flatKeys = [-12, -11, -9, -7, -4, -2, 1, 3, 5, 8, 10, 12]
      if (sharpKeys.includes(keyAdjust)) {
      keys = [
        "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
        "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
        "A", "A#", "B", "C", "C#", "D"
      ];
    } else if (flatKeys.includes(keyAdjust)) {
      keys = [
        "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", 
        "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", 
        "A", "Bb", "B", "C", "Db", "D"
      ];
    }
      switch (chordString.charAt(i)) {
        case "6": transpose.push(keys[12 + keyAdjust] + `m`); 
          break;
        case "7": transpose.push(keys[14 + keyAdjust] + `°`); 
          break;
        case "1": transpose.push(keys[15 + keyAdjust]); 
          break;
        case "!": transpose.push(keys[15 + keyAdjust]  + `maj7`); 
          break;
        case "2": transpose.push(keys[17 + keyAdjust] + `m`); 
          break;
        case "@": transpose.push(keys[17 + keyAdjust] + `m7`); 
          break;
        case "3": transpose.push(keys[19 + keyAdjust] + `m`); 
          break;
        case "#": transpose.push(keys[19 + keyAdjust] + `m7`); 
          break;
        case "4": transpose.push(keys[20 + keyAdjust]); 
          break;
        case "$": transpose.push(keys[20 + keyAdjust]  + `7`); 
          break;
        case "5": transpose.push(keys[22 + keyAdjust]); 
          break;
        case "%": transpose.push(keys[22 + keyAdjust]  + `7`); 
          break;
        case "8": transpose.push(keys[19 + keyAdjust]); 
          break;
        case "0": transpose.push(keys[20 + keyAdjust] + `m`);
          break;
        case "9": transpose.push(keys[15 + keyAdjust] + `9`);
          break;
        case "-": transpose.push("-");
          break;
      }
  }
  return transpose;
}

export function createChordTones(chordString: string[]) {
  const chordTones: { oscTones: number[][], midiTones: number[][] } = { oscTones: [], midiTones: [] }

  for (let i = 0; i < chordString.length; i++) {
    if (chordString[i] === '-') {
      chordTones.oscTones.push([]);
      chordTones.midiTones.push([]);
    } else if (chordToneMappings.hasOwnProperty(chordString[i]) && chordMidiMappings.hasOwnProperty(chordString[i])) {
      const numberOfTones = Math.floor(Math.random() * 3) + 2;
      const availableOscTones = chordToneMappings[chordString[i]];
      const availableMidiTones = chordMidiMappings[chordString[i]];

      const shuffledIndices = Array.from({ length: availableOscTones.length }, (_, index) => index);
      for (let j = shuffledIndices.length - 1; j > 0; j--) {
        const randomIndex = Math.floor(Math.random() * (j + 1));
        [shuffledIndices[j], shuffledIndices[randomIndex]] = [shuffledIndices[randomIndex], shuffledIndices[j]];
      }

      const shuffledOscTones = shuffledIndices.map((index) => availableOscTones[index]);
      const shuffledMidiTones = shuffledIndices.map((index) => availableMidiTones[index]);

      chordTones.oscTones.push(shuffledOscTones.slice(0, numberOfTones))
      chordTones.midiTones.push(shuffledMidiTones.slice(0, numberOfTones))

    } else {
      chordTones.oscTones.push([]);
      chordTones.midiTones.push([]);
    }
  }
  return chordTones
}