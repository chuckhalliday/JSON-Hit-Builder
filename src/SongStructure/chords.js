export function createChords(arr) {
  let chordArray = []
  let sum = arr[0]
  for (let i = 1; i < arr.length; i++) {
    let roll = Math.random()
    if (sum >= 2) {
      chordArray.push(sum)
      sum = 0
      sum += arr[i]
    } else if (sum >= 1 && roll < 0.5) {
      chordArray.push(sum)
      sum = 0
      sum += arr[i]
    } else {
      sum += arr[i]
    }
  }
  if (sum > 0) {
    chordArray.push(sum)
  }
  return chordArray
}

export function chordString(chordsGroove, bassGroove, bassString) {

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

let bass = bassString.replace(/\|/g, '');

for (let i = 0; i < bassGroove.length; i++) {
  
  const note = bass.charAt(i);
  
    if (bassSum === chordSum) {
      chordSum += chordsGroove[arr1Index]
      arr1Index ++
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
    }
    bassSum += bassGroove[i];
    if (Number.isInteger(bassSum / 8)) {
      chords += "|";
    }
  }
    return chords;
}


export function adjustChordString(chordString, keyAdjust) {
    let transpose = "";
    let keys = []
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
        case "6":
          transpose += keys[12 + keyAdjust] + `m`;
          break;
        case "7":
          transpose += keys[14 + keyAdjust] + `dim`;
          break;
        case "1":
          transpose += keys[15 + keyAdjust];
          break;
        case "!":
          transpose += keys[15 + keyAdjust]  + `maj7`;
          break;
        case "2":
          transpose += keys[17 + keyAdjust] + `m`;
          break;
        case "@":
          transpose += keys[17 + keyAdjust] + `m7`;
          break;
        case "3":
          transpose += keys[19 + keyAdjust] + `m`;
          break;
        case "#":
          transpose += keys[19 + keyAdjust] + `m7`;
          break;
        case "4":
          transpose += keys[20 + keyAdjust];
          break;
        case "$":
          transpose += keys[20 + keyAdjust]  + `7`;
          break;
        case "5":
          transpose += keys[22 + keyAdjust];
          break;
        case "%":
          transpose += keys[22 + keyAdjust]  + `7`;
          break;
        case "8":
          transpose += keys[19 + keyAdjust];
          break;
        case "0":
          transpose += keys[20 + keyAdjust] + `m`;
          break;
        case "9":
          transpose += keys[15 + keyAdjust] + `9`;
          break;
        case "-":
          transpose += "  ";
          break;
        case "|":
          transpose += "|";
          break;
        case " ":
          transpose += "  ";
          break;
      }
    }
    return transpose;
  }
  