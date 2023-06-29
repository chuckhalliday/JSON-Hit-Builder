export function createDrums(arr) {
  const possibleLengths = [0.25, 0.5, 1];
  let drumArr = [];
  let subdivision = 1;

  for (let i = 0; i < arr.length; i++) {
    let beat = arr[i];
    while (beat > 0) {
      let length = possibleLengths[possibleLengths.length - subdivision];
      if (beat >= length) {
        drumArr.push(length);
        beat -= length;
      } else {
        subdivision++;
      }
    }
  }

  return drumArr;
}

export function kickString(drumBeat, bassBeat, bassString) {
  let kick = "";
  let kickSum = 0;
  let bassSum = 0;
  let bassBeatIndex = 0;

  for (let i = 0; i < drumBeat.length; i++) {
    const note = bassString.charAt(bassBeatIndex);
    if (kickSum.toFixed(1) === bassSum.toFixed(1)) {
      bassSum += bassBeat[bassBeatIndex];
      if (kickSum === 0) {
        kick += "X";
      } else if (note === "-") {
        kick += Math.random() < 0.85 ? "-" : "x";
      } else if (note !== "|" && note !== "-") {
        kick += Math.random() < 0.85 ? "x" : "-";
      }
      if (kickSum < 4) {
        bassBeatIndex++;
      }
    } else {
      kick += "-";
    }
    kickSum += drumBeat[i];
  }
  if (Number.isInteger(kickSum / 8)) {
    kick += "|";
  }
  return kick;
}

export function snareString(arr) {
  let snare = "";
  let sum = 0;

  for (let i = 0; i < arr.length; i++) {
    if (Number.isInteger(sum + 0.5)) {
      snare += Math.random() < 0.85 ? "y" : "-";
    } else {
      snare += Math.random() < 0.85 ? "-" : "y";
    }
    sum += arr[i];
    if (Math.abs(sum / 8 - Math.round(sum / 8)) <= 0.005) {
      snare += "|";
    }
  }
  return snare;
}

export function hatString(arr) {
  let hihat = "";
  let sum = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 0.08 || arr[i] === 0.09 ||
      arr[i] === 0.16 || arr[i] === 0.17) {
      hihat += Math.random() < 0.5 ? "V" : "w";
    } else if (Math.abs(sum % 0.5 - Math.round(sum % 0.5)) <= 0.1) {
      hihat += "v";
    } else {
      hihat += "-";
    }
    sum += arr[i];
    if (Math.abs(sum / 8 - Math.round(sum / 8)) <= 0.005) {
      hihat += "|";
    }
  }
  return hihat;
}

export function flairString(arr, snareString, hihatString) {
  let flair = "";
  let sum = 0;
  let snare = snareString.replace(/\|/g, '');
  let hihat = hihatString.replace(/\|/g, '');

  const possibleTomValues = ["u", "U", "t", "T", "s", "S", "y", "Y"];
  let tom = possibleTomValues[Math.floor(Math.random() * possibleTomValues.length)];

  for (let i = 0; i < arr.length; i++) {
    if (snare.charAt(i) === '-' || hihat.charAt(i) === '-') {
      if (sum === 0 || sum === 16) {
        flair += Math.random() < 0.4 ? "R" : "-";
      } else if (sum === 8 || sum === 24) {
        flair += Math.random() < 0.4 ? "r" : "-";
      } else if (sum === 7.5 || sum === 23.5) {
        flair += Math.random() < 0.3 ? "Q" : "-";
      } else if (sum === 15 || sum === 31) {
        flair += Math.random() < 0.3 ? "q" : "-";
      } else if (sum === 7.75 || sum === 23.75) {
        flair += Math.random() < 0.3 ? "z" : "-";
      } else if (sum >= 31.75 || sum === 15.75) {
        flair += Math.random() < 0.6 ? "Z" : "-";
      } else if (arr[i] === 0.33 || arr[i] === 0.34 ||
        arr[i] === 0.17 || arr[i] === 0.16) {
        flair += Math.random() < 0.3 ? tom : "-";
      } else {
        flair += "-";
      }
    } else {
      flair += '-';
    }
    sum += arr[i];
    if (Math.abs(sum / 8 - Math.round(sum / 8)) <= 0.005) {
      flair += "|";
    }
  }
  return flair;
}
