export function primaryGroove() {
  const initBass = [0.5];
  let measureSum = 0.5;
  let beatSum = 0.5;

  const randomValues = [0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.25, 0.75, 1.25];

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
      if (sum <= 2 || sum >= 4 && sum <= 6) {
        bass += a_c;
      } else {
        bass += Math.random() < 0.5 ? a_c : (Math.random() < 0.5 ? acc1 : acc2);
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
    } else {
      bass += Math.random() < 0.3 ? bass2 : acc;
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

  if (bassLine2V.charAt(0) === "f" || bassLine2V.charAt(0) === "g") {
    possibleBassValues = ["a", "d", "e"];
  } else if (bassLine2V.charAt(0) === "d" || bassLine2V.charAt(0) === "e") {
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
    } else {
      bass += Math.random() < 0.3 ? bass3 : acc;
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
  } else if (bass4 === "b") {
    acc = bAcc;
  }

  for (let i = 0; i < bassGroove.length; i++) {
    if (bassGroove[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 2 || sum >= 7) {
        bass += bass4;
      } else {
        bass += Math.random() < 0.6 ? bass4 : acc;
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
    } else {
      bass += Math.random() < 0.3 ? bass1 : acc;
    }
    sum += bassGroove[i];
  }
  bass += "|";
  return bass;
}

export function bassString2C(bassGroove, bassLine1C) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (bassLine1C.charAt(0) === "f" || bassLine1C.charAt(0) === "g") {
    possibleBassValues = ["a", "d", "e"];
  } else if (bassLine1C.charAt(0) === "d" || bassLine1C.charAt(0) === "e") {
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
    } else if (sum <= 2 || (sum >= 4 && sum < 6)) {
      bass += bass2;
    } else {
      bass += Math.random() < 0.3 ? bass2 : acc;
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
    } else if (sum <= 2 || (sum >= 4 && sum < 6)) {
        bass += bass3
    } else {
        bass += Math.random() < 0.4 ? acc1 : acc2;
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
    } else if (sum >= 0 && sum <= 2 || sum >= 7) {
        bass += bass4;
      } else {
        bass += Math.random() < 0.6 ? bass4 : acc;
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
    } else {
      bass += Math.random() < 0.3 ? bass1 : acc;
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
