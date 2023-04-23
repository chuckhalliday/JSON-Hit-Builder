export function primaryGroove() {
  const initBass = [0.5];
  let measureSum = 0.5;
  let beatSum = 0.5;

  const randomValues = [0.25, 0.5, 0.75, 1, 1.25, 1.5];

  while (measureSum < 4) {
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

export function bassString1V(arr) {
  let bass = "";
  let sum = 0;

  let a_c = Math.random() < 0.5 ? "a" : "c";
  let acc1;
  let acc2;

  if (a_c === "a") {
    acc1 = Math.random() < 0.6 ? "p" : "P";
    acc2 = Math.random() < 0.8 ? "c" : "e";
  } else if (a_c === "c") {
    acc1 = Math.random() < 0.2 ? "A" : "b";
    acc2 = Math.random() < 0.8 ? "e" : "g";
  }

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 0.5) {
        bass += a_c;
      } else if (sum > 0.5 && sum <= 4) {
        bass += Math.random() < 0.4 ? acc1 : acc2;
      } else {
        bass += "-";
      }
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString2V(arr, string1) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (string1.charAt(0) === 'c') {
    possibleBassValues = ["f", "g"];
  } else if (string1.charAt(0) === "a") {
    possibleBassValues = ["d", "e"];
  }
  let bass2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  const dVals = ["o", "e", "p", "c", "a", "b"];
  let dAcc = dVals[Math.floor(Math.random() * dVals.length)];
  const eVals = ["o", "p", "c", "d", "a", "b"];
  let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
  const fVals = ["o", "p", "b", "a", "c", "g"];
  let fAcc = fVals[Math.floor(Math.random() * fVals.length)];
  const gVals = ["o", "p", "b", "a", "f"];
  let gAcc = gVals[Math.floor(Math.random() * gVals.length)];

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

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 1 || (sum > 2 && sum <= 3)) {
      bass += bass2;
    } else if ((sum > 1 && sum <= 2) || (sum > 3 && sum < 4)) {
      bass += Math.random() < 0.3 ? bass2 : acc;
    } else {
      bass += "-";
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString3V(arr, string2) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (string2.includes("f") || string2.includes("g")) {
    possibleBassValues = ["a", "d", "e"];
  } else if (string2.includes("d") || string2.includes("e")) {
    possibleBassValues = ["c", "f", "g"];
  } 

  let bass3 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  const dVals = ["o", "e", "f", "a"];
  let dAcc = dVals[Math.floor(Math.random() * dVals.length)];
  const eVals = ["D", "f", "g", "b"];
  let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
  const fVals = ["a", "c", "g"];
  let fAcc = fVals[Math.floor(Math.random() * fVals.length)];
  const gVals = ["b", "d", "f"];
  let gAcc = gVals[Math.floor(Math.random() * gVals.length)];
  const cVals = ["e", "g", "a", "b"];
  let cAcc = cVals[Math.floor(Math.random() * cVals.length)];
  const aVals = ["c", "e", "f", "g"];
  let aAcc = aVals[Math.floor(Math.random() * aVals.length)];

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

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 1 || (sum > 2 && sum <= 3)) {
      bass += bass3;
    } else if ((sum > 1 && sum <= 2) || (sum > 3 && sum < 4)) {
      bass += Math.random() < 0.3 ? bass3 : acc;
    } else {
      bass += "-";
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString4V(arr, string1) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];
  if (string1.charAt(0) === "c") {
    possibleBassValues = ["b", "g"];
  } else if (string1.charAt(0) === "a") {
    possibleBassValues = ["e", "g", "G"];
  }

  let bass4 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];
  const eVals = ["D", "f", "g", "b"];
  let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
  const gVals = ["e", "d", "a"];
  let gAcc = gVals[Math.floor(Math.random() * gVals.length)];
  const GVals = ["e", "d", "a"]
  let GAcc = GVals[Math.floor(Math.random() * GVals.length)];
  const bVals = ["c", "d", "f"];
  let bAcc = bVals[Math.floor(Math.random() * bVals.length)];

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

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 1) {
        bass += bass4;
      } else if (sum > 1 && sum <= 3.5) {
        bass += Math.random() < 0.6 ? bass4 : acc;
      } else if (sum > 3.5 && sum < 4) {
        bass += bass4
      } else {
        bass += "-";
      }
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString1C(arr, string1) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (string1.charAt(0) === 'c') {
    possibleBassValues = ["f", "g"];
  } else if (string1.charAt(0) === "a") {
    possibleBassValues = ["d", "e"];
  }
  let bass2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  const dVals = ["o", "e", "p", "c", "a", "b"];
  let dAcc = dVals[Math.floor(Math.random() * dVals.length)];
  const eVals = ["o", "p", "c", "d", "a", "b"];
  let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
  const fVals = ["o", "p", "b", "a", "c", "g"];
  let fAcc = fVals[Math.floor(Math.random() * fVals.length)];
  const gVals = ["o", "p", "b", "a", "f"];
  let gAcc = gVals[Math.floor(Math.random() * gVals.length)];

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

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 1 || (sum > 2 && sum <= 3)) {
      bass += bass2;
    } else if ((sum > 1 && sum <= 2) || (sum > 3 && sum < 4)) {
      bass += Math.random() < 0.3 ? bass2 : acc;
    } else {
      bass += "-";
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString2C(arr, string1C) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];

  if (string1C.includes("f") || string1C.includes("g")) {
    possibleBassValues = ["a", "d", "e"];
  } else if (string1C.includes("d") || string1C.includes("e")) {
    possibleBassValues = ["c", "f", "g"];
  } 

  let bass3 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  const dVals = ["o", "e", "f", "a"];
  let dAcc = dVals[Math.floor(Math.random() * dVals.length)];
  const eVals = ["D", "f", "g", "b"];
  let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
  const fVals = ["a", "c", "g"];
  let fAcc = fVals[Math.floor(Math.random() * fVals.length)];
  const gVals = ["b", "d", "f"];
  let gAcc = gVals[Math.floor(Math.random() * gVals.length)];
  const cVals = ["e", "g", "a", "b"];
  let cAcc = cVals[Math.floor(Math.random() * cVals.length)];
  const aVals = ["c", "e", "f", "g"];
  let aAcc = aVals[Math.floor(Math.random() * aVals.length)];

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

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else if (sum <= 1 || (sum > 2 && sum <= 3)) {
      bass += bass3;
    } else if ((sum > 1 && sum <= 2) || (sum > 3 && sum < 4)) {
      bass += Math.random() < 0.3 ? bass3 : acc;
    } else {
      bass += "-";
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString3C(arr, string1) {
  let bass = "";
  let sum = 0;

  let a_c = string1.charAt(0)
  let acc1;
  let acc2;

  if (a_c === "a") {
    acc1 = Math.random() < 0.6 ? "p" : "P";
    acc2 = Math.random() < 0.8 ? "c" : "e";
  } else if (a_c === "c") {
    acc1 = Math.random() < 0.2 ? "A" : "b";
    acc2 = Math.random() < 0.8 ? "e" : "g";
  }

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 0.5) {
        bass += a_c;
      } else if (sum > 0.5 && sum <= 4) {
        bass += Math.random() < 0.4 ? acc1 : acc2;
      } else {
        bass += "-";
      }
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function bassString4C(arr, string1) {
  let bass = "";
  let sum = 0;
  let possibleBassValues = ["d", "e", "f", "g", "b"];
  if (string1.charAt(0) === "c") {
    possibleBassValues = ["b", "g"];
  } else if (string1.charAt(0) === "a") {
    possibleBassValues = ["e", "g", "G"];
  }

  let bass4 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)];

  const eVals = ["D", "f", "g", "b"];
  let eAcc = eVals[Math.floor(Math.random() * eVals.length)];
  const gVals = ["e", "d", "a"];
  let gAcc = gVals[Math.floor(Math.random() * gVals.length)];
  const GVals = ["e", "d", "a"]
  let GAcc = GVals[Math.floor(Math.random() * GVals.length)];
  const bVals = ["c", "d", "f"];
  let bAcc = bVals[Math.floor(Math.random() * bVals.length)];

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

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 0.25) {
      bass += "-";
    } else {
      if (sum >= 0 && sum <= 1) {
        bass += bass4;
      } else if (sum > 1 && sum <= 3.5) {
        bass += Math.random() < 0.6 ? bass4 : acc;
      } else if (sum > 3.5 && sum < 4) {
        bass += bass4
      } else {
        bass += "-";
      }
    }
    sum += arr[i];
  }
  bass += "|";
  return bass;
}

export function adjustBassString(string, keyAdjust) {
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
