export function createDrums(arr) {
  let drumArr = [];
  let randQH = Math.random() < 0.5 ? 0.25 : 0.5;
  let randSQ = Math.random() < 0.5 ? 0.125 : 0.25;
  const possibleLengths = [0.125, 0.25, 0.5, 1];
  let beat1 = possibleLengths[Math.floor(Math.random() * possibleLengths.length)];

  for (let i = 0; i < arr.length; i++)
    if (arr[i] === 1.5) {
      drumArr.push(beat1);
      drumArr.push(arr[i] - beat1);
    } else if (arr[i] === 1.25) {
      drumArr.push(beat1);
      drumArr.push(arr[i] - beat1);
    } else if (arr[i] === 1) {
      drumArr.push(randQH);
      drumArr.push(arr[i] - randQH);
    } else if (arr[i] === 0.75) {
      drumArr.push(randQH);
      drumArr.push(arr[i] - randQH);
    } else if (arr[i] === 0.5) {
      drumArr.push(randSQ);
      drumArr.push(arr[i] - randSQ);
    } else if (arr[i] === 0.25) {
      drumArr.push(0.125, 0.125);
    }
  return drumArr;
}

export function kickString(arr1, arr2, bassString) {
  let kick = "";
  let kickSum = 0;
  let bassSum = 0;
  let arr2Index = 0;

  for (let i = 0; i < arr1.length; i++) {
    const note = bassString.charAt(arr2Index);
    if (kickSum === bassSum) {
      bassSum += arr2[arr2Index];
      if (kickSum === 0) {
        kick += "X";
      } else if (note === "-") {
        kick += Math.random() < 0.9 ? "-" : "x";
      } else if (note !== "|" && note !== "-") {
        kick += Math.random() < 0.9 ? "x" : "-";
      }
      if (kickSum < 4) {
        arr2Index++;
      }
    } else {
      kick += "-";
    }
    kickSum += arr1[i];
  }
  if (Number.isInteger(kickSum / 4)) {
    kick += "|";
  }
  return kick;
}

export function snareString(arr) {
  let snare = "";
  let sum = 0;

  for (let i = 0; i < arr.length; i++) {
    if (Number.isInteger(sum + 0.5)) {
      snare += "y";
    } else {
      snare += Math.random() < 0.9 ? "-" : "y";
    }
    sum += arr[i];
    if (Math.abs(sum / 4 - Math.round(sum / 4)) <= 0.005) {
      snare += "|";
    }
  }
  return snare;
}

export function hatString(arr) {
  let hihat = "";
  let sum = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 0.0833 || arr[i] === 0.0834 ||
      arr[i] === 0.1667 || arr[i] === 0.1666) {
      hihat += Math.random() < 0.5 ? "V" : "w";
    } else if (sum % 0.25 === 0) {
      hihat += "v";
    } else {
      hihat += "-";
    }
    sum += arr[i];
    if (Math.abs(sum / 4 - Math.round(sum / 4)) <= 0.005) {
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
      if (sum === 0 || sum === 8) {
        flair += Math.random() < 0.4 ? "R" : "-";
      } else if (sum === 4 || sum === 12) {
        flair += Math.random() < 0.4 ? "r" : "-";
      } else if (sum === 3.5 || sum === 11.5) {
        flair += Math.random() < 0.2 ? "Q" : "-";
      } else if (sum === 7.5 || sum === 15.5) {
        flair += Math.random() < 0.2 ? "q" : "-";
      } else if (sum === 3.825 || sum === 11.825) {
        flair += Math.random() < 0.2 ? "z" : "-";
      } else if (sum >= 15.825 || sum === 7.825) {
        flair += Math.random() < 0.4 ? "Z" : "-";
      } else if (arr[i] === 0.0833 || arr[i] === 0.0834 ||
        arr[i] === 0.1667 || arr[i] === 0.1666) {
        flair += Math.random() < 0.6 ? tom : "-";
      } else {
        flair += "-";
      }
    } else {
      flair += '-';
    }
    sum += arr[i];
    if (Math.abs(sum / 4 - Math.round(sum / 4)) <= 0.005) {
      flair += "|";
    }
  }
  return flair;
}
