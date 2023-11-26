//calculates an array of x-coordinates where the measure lines should be drawn on bass staff canvas
export function bassMeasures(bassGroove: number[], drumGroove: number[]) {
  let bassArray: number[]=[-10, 115]
  let gridX: number = 115
  let bassSum: number = bassGroove[0]
  let drumSum: number = 0
  let bassIndex: number = 1
  let measureLines: number[] = []
  for (let i = 0; i < drumGroove.length; i++) {
    drumSum+= drumGroove[i]
    if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
      gridX += 78
      measureLines.push(gridX - 42)
    } else if (Math.abs(Math.round(drumSum) - drumSum) <= 0.005) {
      gridX += 48
    } else {
      gridX += 38
    }
    if (bassSum - drumSum <= 0.05) {
      bassArray.push(gridX)
    if (bassSum >= 7.95 && drumSum >= 7.95) {
      bassSum = 0
      drumSum = 0
    }
    bassSum += bassGroove[bassIndex]
    bassIndex++
    }
  }
  return [bassArray, measureLines]
}

const dVals = ["o", "a", "c", "f"];
let dAcc = dVals[Math.floor(Math.random() * dVals.length)];
const eVals = ["p", "d", "g", "b"];
let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
const fVals = ["o", "a", "c", "e"];
let fAcc = fVals[Math.floor(Math.random() * fVals.length)];
const gVals = ["o", "p", "b", "d", "f"];
let gAcc = gVals[Math.floor(Math.random() * gVals.length)];
const cVals = ["e", "g", "p", "b"];
let cAcc = cVals[Math.floor(Math.random() * cVals.length)];
const aVals = ["c", "e", "g", "p"];
let aAcc = aVals[Math.floor(Math.random() * aVals.length)];
const GVals = ["e", "d", "a"]
let GAcc = GVals[Math.floor(Math.random() * GVals.length)];
const bVals = ["e", "g", "p", "b"];
let bAcc = bVals[Math.floor(Math.random() * bVals.length)];


export function bassArray1V(bassGroove: number[], tonality?: string) {
  let a_c: string
  if (tonality === 'Major') {
    a_c = "c"
  } else if (tonality === 'Minor') {
    a_c = "a"
  } else {
    a_c = Math.random() < 0.5 ? "a" : "c";
  }
  let bass: string[] = [a_c];

  let possibleBassValues: string[];
  if (a_c === "c") {
    possibleBassValues = ["c", "e", "b", "g", "A"];
  } else if (a_c === "a") {
    possibleBassValues = ["a", "c", "e", "g", "G"];
  } else {
    possibleBassValues = ["c", "e", "g"]
  }

  let acc1 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];
  let acc2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  for (let i = 1; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else {
      bass.push(Math.random() < 0.5 ? a_c : (Math.random() < 0.5 ? acc1 : acc2));
    }
  }
  return bass;
}

export function bassArray2V(bassGroove: number[], bassLine1V: string[]) {
  let bass: string[] = [];
  let sum = 0;
  let possibleBassValues;

  if (bassLine1V[0] === 'c') {
    possibleBassValues = ["f", "g"];
  } else if (bassLine1V[0] === "a") {
    possibleBassValues = ["d", "e"];
  } else {
    possibleBassValues = ["a", "c"]
  }


  let bass2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  let acc;

  if (bass2 === "d") {
    acc = dAcc;
  } else if (bass2 === "e") {
    acc = eAcc;
  } else if (bass2 === "f") {
    acc = fAcc;
  } else if (bass2 === "g") {
    acc = gAcc;
  } else {
    acc = "c"
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass.push(bass2);
    } else {
      bass.push(Math.random() < 0.3 ? bass2 : acc);
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray3V(bassGroove: number[], bassLine2V: string[]) {
  let bass: string[] = [];
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine2V[0] === "f" || bassLine2V[0] === "g") {
    possibleBassValues = ["a", "d", "e"];
  } else if (bassLine2V[0] === "d" || bassLine2V[0] === "e") {
    possibleBassValues = ["c", "f", "g"];
  } 

  let bass3 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  let acc: string;
  if (bass3 === "d") {
    acc = dAcc;
  } else if (bass3 === "e") {
    acc = eAcc;
  } else if (bass3 === "f") {
    acc = fAcc;
  } else if (bass3 === "g") {
    acc = gAcc;
  } else if (bass3 === "c") {
    acc = cAcc;
  } else if (bass3 === "a") {
    acc = aAcc;
  } else {
    acc = "c"
  }


  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass.push(bass3);
    } else {
      bass.push(Math.random() < 0.3 ? bass3 : acc);
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray4V(bassGroove: number[], bassLine1V:string[]) {
  let bass: string[] = [];
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];
  if (bassLine1V[0] === "c") {
    possibleBassValues = ["b", "g"];
  } else if (bassLine1V[0] === "a") {
    possibleBassValues = ["e", "g"];
  }

  let bass4 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];


  let acc;
    if (bass4 === "e") {
    acc = eAcc;
  } else if (bass4 === "g") {
    acc = gAcc;
  } else if (bass4 === "b") {
    acc = bAcc;
  } else {
    acc = "c"
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else {
      if (sum >= 0 && sum <= 2 || sum >= 7) {
        bass.push(bass4);
      } else {
        bass.push(Math.random() < 0.6 ? bass4 : acc);
      }
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray1C(bassGroove: number[], bassLine1V: string[]) {
  let bass: string[] = [];
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine1V[0] === 'c') {
    possibleBassValues = ["f", "g"];
  } else if (bassLine1V[0] === "a") {
    possibleBassValues = ["d", "e"];
  }
  let bass1 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  let acc;

  if (bass1 === "d") {
    acc = dAcc;
  } else if (bass1 === "e") {
    acc = eAcc;
  } else if (bass1 === "f") {
    acc = fAcc;
  } else if (bass1 === "g") {
    acc = gAcc;
  } else {
    acc = "c"
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass.push(bass1);
    } else {
      bass.push(Math.random() < 0.3 ? bass1 : acc);
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray2C(bassGroove: number[], bassLine1C: string[]) {
  let bass: string[] = [];
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine1C[0] === "f" || bassLine1C[0] === "g") {
    possibleBassValues = ["a", "d", "e"];
  } else if (bassLine1C[0] === "d" || bassLine1C[0] === "e") {
    possibleBassValues = ["c", "f", "g"];
  } 

  let bass2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  let acc;
  if (bass2 === "d") {
    acc = dAcc;
  } else if (bass2 === "e") {
    acc = eAcc;
  } else if (bass2 === "f") {
    acc = fAcc;
  } else if (bass2 === "g") {
    acc = gAcc;
  } else if (bass2 === "c") {
    acc = cAcc;
  } else if (bass2 === "a") {
    acc = aAcc;
  } else {
    acc = "c"
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum <= 2 || (sum >= 4 && sum < 6)) {
      bass.push(bass2);
    } else {
      bass.push(Math.random() < 0.3 ? bass2 : acc);
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray3C(bassGroove: number[], bassLine1V: string[]) {
  let bass: string[] = [];
  let sum = 0;

  let possibleBassValues;
  if (bassLine1V[0] === "c") {
    possibleBassValues = ["c", "e", "b", "g", "A"];
  } else if (bassLine1V[0] === "a") {
    possibleBassValues = ["a", "c", "e", "g", "G"];
  } else {
    possibleBassValues = ["c", "e", "g"]
  }

  let bass3 = bassLine1V[0]
  let acc1 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];
  let acc2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum <= 2 || (sum >= 4 && sum < 6)) {
        bass.push(bass3)
    } else {
        bass.push(Math.random() < 0.4 ? acc1 : acc2);
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray4C(bassGroove: number[], bassLine1V: string[]) {
  let bass: string[] = [];
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];
  if (bassLine1V[0] === "c") {
    possibleBassValues = ["b", "g"];
  } else if (bassLine1V[0] === "a") {
    possibleBassValues = ["e", "g"];
  }

  let bass4 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];


  let acc;
    if (bass4 === "e") {
    acc = eAcc;
  } else if (bass4 === "g") {
    acc = gAcc;
  } else if (bass4 === "G") {
    acc = GAcc;
  } else if (bass4 === "b") {
    acc = bAcc;
  } else {
    acc = "c"
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum >= 0 && sum <= 2 || sum >= 7) {
        bass.push(bass4);
      } else {
        bass.push(Math.random() < 0.6 ? bass4 : acc);
      }
    sum += bassGroove[i];
  }
  return bass;
}

export function bassArray1B(bassGroove: number[], bassLine1C: string[]) {
  let bass: string[] = [];
  let sum = 0;
  let bass1;

  if (bassLine1C[0] === "f") {
    bass1 = "g";
  } else if (bassLine1C[0] === "g") {
    bass1 = "f";
  } else if (bassLine1C[0] === "d") {
    bass1 = "e";
  } else if (bassLine1C[0] === "e") {
    bass1 = "d";
  } else {
    bass1 = "a"
  }

  let acc;

  if (bass1 === "d") {
    acc = dAcc;
  } else if (bass1 === "e") {
    acc = eAcc;
  } else if (bass1 === "f") {
    acc = fAcc;
  } else if (bass1 === "g") {
    acc = gAcc;
  } else {
    acc = "c"
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass.push("-");
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass.push(bass1);
    } else {
      bass.push(Math.random() < 0.3 ? bass1 : acc);
    }
    sum += bassGroove[i];
  }
  return bass;
}

export function transposeBassArray(bassString: string[], keyAdjust: number) {
  let transpose: string[] = [];
  let keys: string[] = []
  for (let i = 0; i < bassString.length; i++) {
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

    switch (bassString[i]) {
      case "a": transpose.push(keys[12 + keyAdjust]);
        break;
      case "A": transpose.push(keys[13 + keyAdjust]);
        break;
      case "b": transpose.push(keys[14 + keyAdjust]);
        break;
      case "c": transpose.push(keys[15 + keyAdjust]);
        break;
      case "C": transpose.push(keys[16 + keyAdjust]);
        break;
      case "d": transpose.push(keys[17 + keyAdjust]);
        break;
      case "D": transpose.push(keys[18 + keyAdjust]);
        break;
      case "e": transpose.push(keys[19 + keyAdjust]);
        break;
      case "f": transpose.push(keys[20 + keyAdjust]);
        break;
      case "F": transpose.push(keys[21 + keyAdjust]);
        break;
      case "g": transpose.push(keys[22 + keyAdjust]);
        break;
      case "G": transpose.push(keys[23 + keyAdjust]);
        break;
      case "o": transpose.push(keys[20 + keyAdjust]);
        break;
      case "O": transpose.push(keys[21 + keyAdjust]);
        break;
      case "p": transpose.push(keys[22 + keyAdjust]);
        break;
      case "P": transpose.push(keys[23 + keyAdjust]);
        break;
      case "-": transpose.push("-");
        break;
      case "|": transpose.push("|");
        break;
      case " ": transpose.push(" ");
        break;
    }
  }
  return transpose;
}

export function drawBass(bass: string[], bassGrid: number[]) {
  let bassNoteLocations: { x: number, y: number, acc: string }[] = [];
  
  for (let i = 1; i < bassGrid.length; i++) {
    let noteLocation: {x: number, y: number, acc: string } = { x: 0, y: 0, acc: 'none' } // Create a new object for each iteration
  
      noteLocation.x = bassGrid[i];
      if (bass[i - 1] === 'G' || bass[i] === 'G#' || bass[i] === 'Gb') {
        noteLocation.y = 52.5;
      } else if (bass[i - 1] === 'F' || bass[i] === 'F#') {
        noteLocation.y = 60;
      } else if (bass[i - 1] === 'E' || bass[i] === 'Eb') {
        noteLocation.y = 67.5;
      } else if (bass[i - 1] === 'D' || bass[i] === 'D#' || bass[i] === 'Db') {
        noteLocation.y = 75;
      } else if (bass[i - 1] === 'C' || bass[i] === 'C#') {
        noteLocation.y = 82.5;
      } else if (bass[i - 1] === 'B' || bass[i] === 'Bb') {
        noteLocation.y = 90;
      } else if (bass[i - 1] === 'A' || bass[i] === 'A#' || bass[i] === 'Ab') {
        noteLocation.y = 97.5;
      } else {
        noteLocation.y = -20
      }
      if (bass[i - 1] === 'A#' || bass[i - 1] === 'C#' || bass[i - 1] === 'D#' || bass[i - 1] === 'F#' || bass[i - 1] === 'G#') {
        noteLocation.acc = 'sharp';
      } else if (bass[i - 1] === 'Ab' || bass[i - 1] === 'Bb' || bass[i - 1] === 'Db' || bass[i - 1] === 'Eb' || bass[i - 1] === 'Gb') {
        noteLocation.acc = 'flat';
      } else {
        noteLocation.acc = 'none'
      }
  
      bassNoteLocations.push(noteLocation);
    }
  
    return bassNoteLocations;
  }
