import { subdivideArray } from "./groove";

export function createDrums(bassGroove: number[][], tripMod: number) {
  const possibleLengths = [0.25, 0.5, 1];
  let drumArr: number[][] = [];
  let subdivision = 1;

  for (let i = 0; i < bassGroove.length; i++) {
    let drumPart: number[] = []
    for (let j = 0; j < bassGroove[i].length; j++) {
    let beat = bassGroove[i][j];
    while (beat > 0) {
      let length = possibleLengths[possibleLengths.length - subdivision];
      if (beat >= length) {
        drumPart.push(length);
        beat -= length;
      } else {
        subdivision++;
      }
    }
  }
  if (Math.random() < tripMod) {
    drumPart = subdivideArray(drumPart)
  }
  drumArr.push(drumPart)
}

  return drumArr;
}


export function drumArray(drumHits: { index: number; checked: boolean; accent?: boolean }[][], drumBeat: number[], bassBeat: number[], bassString: string[]) {
  let drumSum = 0;
  let bassSum = 0;
  let bassBeatIndex = 0;
  let count = drumHits[0].length

  const [kick, snare, lowTom, midTom, highTom, hiHatC, hiHatO, ride, crash] = [0, 1, 2, 3, 4, 5, 6, 7, 8]

  const pushHit = (drum: number, beat: number) => {
    drumHits[drum].push({ index: beat + count, checked: true, accent: false })
  }
  const pushAccent = (drum: number, beat: number) => {
    drumHits[drum].push({ index: beat + count, checked: true, accent: true })
  }

  const pushRest = (drum: number, beat: number) => {
    drumHits[drum].push({ index: beat + count, checked: false, accent: false })
  }

  for (let i = 0; i < drumBeat.length; i++) {
    const note = bassString[bassBeatIndex];
    if (drumSum.toFixed(1) === bassSum.toFixed(1)) {
      bassSum += bassBeat[bassBeatIndex];
      bassBeatIndex++;
      if (drumSum === 0) {
        pushAccent(kick, i)
      } else if (Number.isInteger(drumSum)) {
        Math.random() < 0.95 ? pushHit(kick, i) : pushRest(kick, i);
      }else if (note === "-") {
        Math.random() < 0.9 ? pushRest(kick, i) : pushHit(kick, i);
      } else {
        Math.random() < 0.6 ? pushHit(kick, i) : pushRest(kick, i);
      } 
    } else if (Number.isInteger(drumSum)) {
      Math.random() < 0.9 ? pushHit(kick, i) : pushRest(kick, i);
    } else {
      pushRest(kick, i)
    }
    if (Number.isInteger(drumSum + 0.5)) {
      Math.random() < 0.8 ? pushHit(snare, i) : pushRest(snare, i);
    } else {
      Math.random() < 0.9 ? pushRest(snare, i) : pushHit(snare, i);
    }
    if (drumBeat[i] === 0.08 || drumBeat[i] === 0.09 ||
      drumBeat[i] === 0.16 || drumBeat[i] === 0.17) {
      Math.random() < 0.5 ? (pushHit(hiHatC, i), pushRest(hiHatO, i)) : (pushHit(hiHatO, i), pushRest(hiHatC, i));
    } else if (Math.abs(drumSum % 0.5 - Math.round(drumSum % 0.5)) <= 0.1) {
      pushHit(hiHatC, i)
      pushRest(hiHatO, i)
    } else {
      pushRest(hiHatC, i)
      pushRest(hiHatO, i)
    }
    if (drumSum === 7.75 || drumSum === 23.75) {
      Math.random() < 0.3 ? pushHit(crash, i) : pushRest(crash, i);
    } else if (drumSum >= 31.75 || drumSum === 15.75) {
      Math.random() < 0.6 ? pushAccent(crash, i) : pushRest(crash, i);
    } else {
      pushRest(crash, i)
    }
    pushRest(lowTom, i)
    pushRest(midTom, i)
    pushRest(highTom, i)
    pushRest(ride, i)
    drumSum += drumBeat[i]
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
