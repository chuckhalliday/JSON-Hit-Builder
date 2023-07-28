export function createDrums(bassGroove: number[]) {
  const possibleLengths = [0.25, 0.5, 1];
  let drumArr: number[] = [];
  let subdivision = 1;

  for (let i = 0; i < bassGroove.length; i++) {
    let beat = bassGroove[i];
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


export function drumArray(drumHits: { index: number; checked: boolean; accent?: boolean }[][], drumBeat: number[], bassBeat: number[], bassString: string[]) {
  let drumSum = 0;
  let bassSum = 0;
  let bassBeatIndex = 0;
  let count = drumHits[0].length

  for (let i = 0; i < drumBeat.length; i++) {
    const note = bassString[bassBeatIndex];
    if (drumSum.toFixed(1) === bassSum.toFixed(1)) {
      bassSum += bassBeat[bassBeatIndex];
      bassBeatIndex++;
      if (drumSum === 0) {
        drumHits[0].push({ index: i + count, checked: true, accent: true})
      } else if (Number.isInteger(drumSum)) {
        Math.random() < 0.95 ? drumHits[0].push({ index: i + count, checked: true, accent: false}) : drumHits[0].push({ index: i + count, checked: false, accent: false});
      }else if (note === "-") {
        Math.random() < 0.9 ? drumHits[0].push({ index: i + count, checked: false, accent: false}) : drumHits[0].push({ index: i + count, checked: true, accent: false});
      } else if (note !== "|" && note !== "-") {
        Math.random() < 0.6 ? drumHits[0].push({ index: i + count, checked: true, accent: false}) : drumHits[0].push({ index: i + count, checked: false, accent: false});
      } 
    } else if (Number.isInteger(drumSum)) {
      Math.random() < 0.9 ? drumHits[0].push({ index: i + count, checked: true, accent: false}) : drumHits[0].push({ index: i + count, checked: false, accent: false});
    }else {
      drumHits[0].push({ index: i + count, checked: false, accent: false})
    }
      if (Number.isInteger(drumSum + 0.5)) {
      Math.random() < 0.8 ? drumHits[1].push({ index: i + count, checked: true, accent: false}) : drumHits[1].push({ index: i + count, checked: false, accent: false});
    } else {
      Math.random() < 0.9 ? drumHits[1].push({ index: i + count, checked: false, accent: false}) : drumHits[1].push({ index: i + count, checked: true, accent: false});
    }
    if (drumBeat[i] === 0.08 || drumBeat[i] === 0.09 ||
        drumBeat[i] === 0.16 || drumBeat[i] === 0.17) {
        Math.random() < 0.5 ? (drumHits[2].push({ index: i + count, checked: true, accent: true}), drumHits[3].push({ index: i + count, checked: false, accent: false})) : (drumHits[3].push({ index: i + count, checked: true, accent: false}), drumHits[2].push({ index: i + count, checked: false, accent: false}));
      } else if (Math.abs(drumSum % 0.5 - Math.round(drumSum % 0.5)) <= 0.1) {
        drumHits[2].push({ index: i + count, checked: true, accent: false})
        drumHits[3].push({ index: i + count, checked: false, accent: false})
      } else {
        drumHits[2].push({ index: i + count, checked: false, accent: false})
        drumHits[3].push({ index: i + count, checked: false, accent: false})
      }
      drumSum += drumBeat[i]
  }
  return drumHits
}

/*export function snareString(drumHits: Array<Array<{ index: number; checked: boolean; accent: boolean }>>, drumBeat: number[]) {
  let sum = 0;

  for (let i = 0; i < drumBeat.length; i++) {
    if (Number.isInteger(sum + 0.5)) {
      Math.random() < 0.85 ? drumHits[1].push({ index: i, checked: true, accent: false}) : drumHits[1].push({ index: i, checked: false, accent: false});
    } else {
      Math.random() < 0.85 ? drumHits[1].push({ index: i, checked: false, accent: false}) : drumHits[1].push({ index: i, checked: true, accent: false});
    }
    sum += drumBeat[i];
  }
  return drumHits
}

export function hatString(drumHits: Array<Array<{ index: number; checked: boolean; accent: boolean }>>, drumBeat: number[]) {
  let sum = 0;

  for (let i = 0; i < drumBeat.length; i++) {
    if (drumBeat[i] === 0.08 || drumBeat[i] === 0.09 ||
      drumBeat[i] === 0.16 || drumBeat[i] === 0.17) {
      Math.random() < 0.5 ? drumHits[2].push({ index: i, checked: true, accent: true}) : drumHits[3].push({ index: i, checked: true, accent: false});
    } else if (Math.abs(sum % 0.5 - Math.round(sum % 0.5)) <= 0.1) {
      drumHits[2].push({ index: i, checked: true, accent: false})
    } else {
      drumHits[2].push({ index: i, checked: false, accent: false})
      drumHits[3].push({ index: i, checked: false, accent: false})
    }
    sum += drumBeat[i];
  }
  return drumHits
}

/*export function flairString(drumBeat: number[], snareString: string, hihatString: string) {
  let flair = "";
  let sum = 0;
  let snare = snareString.replace(/\|/g, '');
  let hihat = hihatString.replace(/\|/g, '');

  const possibleTomValues = ["u", "U", "t", "T", "s", "S", "y", "Y"];
  let tom = possibleTomValues[Math.floor(Math.random() * possibleTomValues.length)];

  for (let i = 0; i < drumBeat.length; i++) {
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
      } else if (drumBeat[i] === 0.33 || drumBeat[i] === 0.34 ||
        drumBeat[i] === 0.17 || drumBeat[i] === 0.16) {
        flair += Math.random() < 0.3 ? tom : "-";
      } else {
        flair += "-";
      }
    } else {
      flair += '-';
    }
    sum += drumBeat[i];
    if (Math.abs(sum / 8 - Math.round(sum / 8)) <= 0.005) {
      flair += "|";
    }
  }
  return flair;
} */
