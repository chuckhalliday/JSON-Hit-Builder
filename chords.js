export function createChords(arr) {
  let chordArray = []
  let sum = arr[0]
  for (let i = 1; i < arr.length; i++) {
    let roll = Math.random()
    sum += arr[i]
    if (sum >= 3) {
      chordArray.push(sum)
      sum = 0
    } else if (sum > 1 && roll < 0.5) {
      chordArray.push(sum)
      sum = 0
    }
  }
  if (sum > 0) {
    chordArray.push(sum)
  }
  console.log(chordArray)
  return chordArray
}

export function chordString(chordsGroove, bassGroove, bassString) {
  
const dminC9 = Math.random() < 0.9 ? "2" : "9";
const eminEmaj = Math.random() < 0.9 ? "3" : "8";
const fmajFmin = Math.random() < 0.9 ? "4" : "0";
const gmajG7 = Math.random() < 0.7 ? "5" : "7";
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
          chords += "1";
        } else if (note === "d") {
          chords += dminC9;
        } else if (note === "e") {
          chords += eminEmaj;
        } else if (note === "f") {
          chords += fmajFmin;
        } else if (note === "g") {
          chords += gmajG7;
        } else if (note === "a") {
          chords += aminCmaj;
        } else if (note === "b") {
          chords += gmajG7;
        } else if (note === "o") {
          chords += fmajFmin;
        } else if (note === "p") {
          chords += gmajG7;
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
      if (Number.isInteger(bassSum / 8)) {
        chords += "|";
      }
    }
    bassSum += bassGroove[i];
  }
    console.log(chords)
    return chords;
}


export function adjustChordString(chordString, keyAdjust) {
    let transpose = "";
    for (let i = 0; i < chordString.length; i++) {
      const keys = [
        "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
        "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
        "A", "A#", "B", "C", "C#", "D"
      ];
  
      switch (chordString.charAt(i)) {
        case "6":
          transpose += keys[12 + keyAdjust] + `m`;
          break;
        case "7":
          transpose += keys[22 + keyAdjust] + `7`;
          break;
        case "1":
          transpose += keys[15 + keyAdjust];
          break;
        case "2":
          transpose += keys[17 + keyAdjust] + `m`;
          break;
        case "3":
          transpose += keys[19 + keyAdjust] + `m`;
          break;
        case "4":
          transpose += keys[20 + keyAdjust];
          break;
        case "5":
          transpose += keys[22 + keyAdjust];
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
  