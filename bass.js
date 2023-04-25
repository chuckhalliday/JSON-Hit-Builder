export function primaryGroove() {
  const initBass = [0.5];
  let measureSum = 0.5;
  let beatSum = 0.5;

  const randomValues = [0.25, 0.5, 0.75, 1, 1.25, 1.5];

  while (measureSum < 8) {
    const random =
      randomValues[Math.floor(Math.random() * randomValues.length)];
    if (beatSum + random <= 2) {
      initBass.push(random);
      beatSum += random;
    } else {
    }
    if (beatSum === 2) {
      beatSum = 0;
      measureSum += 2;
    }
  }
  return initBass;
}

const a_c = Math.random() < 0.5 ? "a" : "c";

const dVals = ["o", "e", "p", "c", "a", "b"];
let dAcc = dVals[Math.floor(Math.random() * dVals.length)];
const eVals = ["o", "p", "c", "d", "a", "b"];
let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
const fVals = ["o", "p", "b", "a", "c", "g"];
let fAcc = fVals[Math.floor(Math.random() * fVals.length)];
const gVals = ["o", "p", "b", "a", "f"];
let gAcc = gVals[Math.floor(Math.random() * gVals.length)];
const cVals = ["e", "g", "a", "b"];
let cAcc = cVals[Math.floor(Math.random() * cVals.length)];
const aVals = ["c", "e", "f", "g"];
let aAcc = aVals[Math.floor(Math.random() * aVals.length)];
const GVals = ["e", "d", "a"]
let GAcc = GVals[Math.floor(Math.random() * GVals.length)];
const bVals = ["c", "d", "f"];
let bAcc = bVals[Math.floor(Math.random() * bVals.length)];


export function bassString1V(bassGroove) {
  let bass = "";
  let sum = 0;


  let possibleBassValues;
  if (a_c === "c") {
    possibleBassValues = ["c", "e", "b", "g", "A"];
  } else if (a_c === "a") {
    possibleBassValues = ["a", "c", "e", "g", "G"];
  }

  let acc1 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];
  let acc2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 0.5) {
        bass += a_c;
      } else if (sum > 0.5 && sum <= 8) {
        bass += Math.random() < 0.5 ? a_c : (Math.random() < 0.5 ? acc1 : acc2);
      } else {
        bass += "-";
      }
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString2V(bassGroove, bassLine1V) {
  let bass = "";
  let sum = 0;
  let possibleBassValues;

  if (bassLine1V.charAt(0) === 'c') {
    possibleBassValues = ["f", "g"];
  } else if (bassLine1V.charAt(0) === "a") {
    possibleBassValues = ["d", "e"];
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass += bass2;
    } else if ((sum > 2 && sum <= 4) || (sum > 6 && sum < 8)) {
      bass += Math.random() < 0.3 ? bass2 : acc;
    } else {
      bass += "-";
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString3V(bassGroove, bassLine2V) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine2V.includes("f") || bassLine2V.includes("g")) {
    possibleBassValues = ["a", "d", "e"];
  } else if (bassLine2V.includes("d") || bassLine2V.includes("e")) {
    possibleBassValues = ["c", "f", "g"];
  } 

  let bass3 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  let acc;
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass += bass3;
    } else if ((sum > 2 && sum <= 4) || (sum > 6 && sum < 8)) {
      bass += Math.random() < 0.3 ? bass3 : acc;
    } else {
      bass += "-";
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString4V(bassGroove, bassLine1V) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];
  if (bassLine1V.charAt(0) === "c") {
    possibleBassValues = ["b", "g"];
  } else if (bassLine1V.charAt(0) === "a") {
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 2) {
        bass += bass4;
      } else if (sum > 2 && sum <= 7) {
        bass += Math.random() < 0.6 ? bass4 : acc;
      } else if (sum > 7 && sum < 8) {
        bass += bass4
      } else {
        bass += "-";
      }
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString1C(bassGroove, bassLine1V) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine1V.charAt(0) === 'c') {
    possibleBassValues = ["f", "g"];
  } else if (bassLine1V.charAt(0) === "a") {
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass += bass1;
    } else if ((sum > 2 && sum <= 4) || (sum > 6 && sum < 8)) {
      bass += Math.random() < 0.3 ? bass1 : acc;
    } else {
      bass += "-";
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString2C(bassGroove, bassLine2C) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine2C.includes("f") || bassLine2C.includes("g")) {
    possibleBassValues = ["a", "d", "e"];
  } else if (bassLine2C.includes("d") || bassLine2C.includes("e")) {
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass += bass2;
    } else if ((sum > 2 && sum <= 4) || (sum > 6 && sum < 8)) {
      bass += Math.random() < 0.3 ? bass2 : acc;
    } else {
      bass += "-";
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString3C(bassGroove, bassLine1V) {
  let bass = "";
  let sum = 0;

  let possibleBassValues;
  if (bassLine1V.charAt(0) === "c") {
    possibleBassValues = ["c", "e", "b", "g", "A"];
  } else if (bassLine1V.charAt(0) === "a") {
    possibleBassValues = ["a", "c", "e", "g", "G"];
  }

  let bass3 = bassLine1V.charAt(0)
  let acc1 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];
  let acc2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 1) {
        bass += bass3
      } else if (sum > 1 && sum <= 8) {
        bass += Math.random() < 0.4 ? acc1 : acc2;
      } else {
        bass += "-";
      }
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString4C(bassGroove, bassLine1V) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];
  if (bassLine1V.charAt(0) === "c") {
    possibleBassValues = ["b", "g"];
  } else if (bassLine1V.charAt(0) === "a") {
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 2) {
        bass += bass4;
      } else if (sum > 2 && sum <= 7) {
        bass += Math.random() < 0.6 ? bass4 : acc;
      } else if (sum > 7 && sum < 8) {
        bass += bass4
      } else {
        bass += "-";
      }
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString1B(bassGroove, bassLine1C) {
  let bass = "";
  let sum = 0;
  let bass1;

  if (bassLine1C.charAt(0) === "f") {
    bass1 = "g";
  } else if (bassLine1C.charAt(0) === "g") {
    bass1 = "f";
  } else if (bassLine1C.charAt(0) === "d") {
    bass1 = "e";
  } else if (bassLine1C.charAt(0) === "e") {
    bass1 = "d";
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
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 2 || (sum > 4 && sum <= 6)) {
      bass += bass1;
    } else if ((sum > 2 && sum <= 4) || (sum > 6 && sum < 8)) {
      bass += Math.random() < 0.3 ? bass1 : acc;
    } else {
      bass += "-";
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function adjustBassString(bassString, keyAdjust) {
  let transpose = "";
  for (let i = 0; i < bassString.length; i++) {
    const keys = [
      "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
      "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
      "A", "A#", "B", "C", "C#", "D"
    ];

    switch (bassString.charAt(i)) {
      case "a":
        transpose += keys[12 + keyAdjust];
        break;
      case "A":
        transpose += keys[13 + keyAdjust];
        break;
      case "b":
        transpose += keys[14 + keyAdjust];
        break;
      case "c":
        transpose += keys[15 + keyAdjust];
        break;
      case "C":
        transpose += keys[16 + keyAdjust];
        break;
      case "d":
        transpose += keys[17 + keyAdjust];
        break;
      case "D":
        transpose += keys[18 + keyAdjust];
        break;
      case "e":
        transpose += keys[19 + keyAdjust];
        break;
      case "f":
        transpose += keys[20 + keyAdjust];
        break;
      case "F":
        transpose += keys[21 + keyAdjust];
        break;
      case "g":
        transpose += keys[22 + keyAdjust];
        break;
      case "G":
        transpose += keys[23 + keyAdjust];
        break;
      case "o":
        transpose += keys[20 + keyAdjust];
        break;
      case "O":
        transpose += keys[21 + keyAdjust];
        break;
      case "p":
        transpose += keys[22 + keyAdjust];
        break;
      case "P":
        transpose += keys[23 + keyAdjust];
        break;
      case "-":
        transpose += "-";
        break;
      case "|":
        transpose += "|";
        break;
      case " ":
        transpose += " ";
        break;
    }
  }
  return transpose;
}
