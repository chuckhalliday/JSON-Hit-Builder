export function melodyGroove(arr) {
  let melodyArr = []
  let randQH = Math.random() < 0.5 ? 0.25 : 0.5;
  let randSQ = Math.random() < 0.5 ? 0.125 : 0.25;
  const possibleLengths = [0.25, 0.5, 0.75, 1];
  let beat1 = possibleLengths[Math.floor(Math.random() * possibleLengths.length)]

  for (let i = 0; i < arr.length; i++)
    if (arr[i] === 1.5) {
      melodyArr.push(beat1)
      melodyArr.push((arr[i] - beat1))
    } else if (arr[i] === 1.25) {
      melodyArr.push(beat1)
      melodyArr.push((arr[i] - beat1))
    } else if (arr[i] === 1) {
      melodyArr.push(randQH)
      melodyArr.push((arr[i] - randQH))
    } else if (arr[i] === 0.75) {
      melodyArr.push(randQH)
      melodyArr.push((arr[i] - randQH))
    } else if (arr[i] === 0.5) {
      melodyArr.push(randSQ)
      melodyArr.push((arr[i] - randSQ))
    } else if (arr[i] === 0.25) {
      melodyArr.push(0.25)
    } 
  return melodyArr
}

export function melodyString(arr1, arr2, bassString) {

  const cMelody = ['j', 'l', 'n', '-', '-'];
  const dMelody = ['k', 'm', 'h', 'j', '-', '-'];
  const eMelody = ['l', 'n', 'i', '-', '-'];
  const fMelody = ['m', 'h', 'j', '-', '-'];
  const gMelody = ['n', 'i', 'k', 'm', '-', '-'];
  const aMelody = ['h', 'j', 'l', '-', '-'];
  const bMelody = ['n', 'k', 'm', '-', '-'];

  const dminC9 = Math.random() < 0.9 ? '2' : '9';
  const eminEmaj = Math.random() < 0.9 ? '3' : '8';
  const fmajFmin = Math.random() < 0.9 ? '4' : '0';
  const gmajG7 = Math.random() < 0.7 ? '5' : '7';
  const aminCmaj = Math.random() < 0.8 ? '6' : '1';

  let melody = '';
  let melodySum = 0;
  let bassSum = 0;
  let arr2Index = 0;

  for (let i = 0; i < arr1.length; i++) {
    let cRand = cMelody[Math.floor(Math.random() * cMelody.length)];
    let dRand = dMelody[Math.floor(Math.random() * dMelody.length)];
    let eRand = eMelody[Math.floor(Math.random() * eMelody.length)];
    let fRand = fMelody[Math.floor(Math.random() * fMelody.length)];
    let gRand = gMelody[Math.floor(Math.random() * gMelody.length)];
    let aRand = aMelody[Math.floor(Math.random() * aMelody.length)];
    let bRand = bMelody[Math.floor(Math.random() * bMelody.length)];

    const note = bassString.charAt(arr2Index);

    if (melodySum === bassSum) {
      bassSum += arr2[arr2Index]
      if (note === 'c') {
        melody += '1'
      } else if (note === 'd') {
        melody += dminC9
      } else if (note === 'e') {
        melody += eminEmaj
      } else if (note === 'f') {
        melody += fmajFmin
      } else if (note === 'g') {
        melody += gmajG7
      } else if (note === 'a') {
        melody += aminCmaj
      } else if (note === 'b') {
        melody += gmajG7
      } else if (note === 'o') {
        melody += fmajFmin
      } else if (note === 'p') {
        melody += gmajG7
      } else if (note === '|') {
        melody = melody
      } else {
        melody += '-'
      }
      arr2Index++
    } else if (melodySum !== bassSum) {
      if (arr1[i] >= 0.25 && arr1[i] < 1 && Number.isInteger(melodySum / 0.25)) {
        if (note === 'c' || note === '-') {
          melody += cRand
        } else if (note === 'd') {
            melody += dRand
        } else if (note === 'e') {
            melody += eRand
        } else if (note === 'f') {
            melody += fRand
        } else if (note === 'g') {
            melody += gRand
        } else if (note === 'a') {
            melody += aRand
        } else if (note === 'b') {
            melody += bRand
        } else if (note === 'o') {
          melody += fRand
        } else if (note === 'p') {
          melody += gRand
        } else if (note === '|') {
            melody = melody
        } else {
            melody += '-'
        }
    } else if (arr1[i] >= 1 && Number.isInteger(melodySum / 0.25)) {
        if (note === 'c') {
          melody += Math.random() < 0.8 ? '1' : '-';
        } else if (note === 'd') {
          melody += Math.random() < 0.4 ? dminC9 : '-';
        } else if (note === 'e') {
          melody += Math.random() < 0.4 ? eminEmaj : '-';
        } else if (note === 'f') {
          melody += Math.random() < 0.8 ? fmajFmin : '-';
        } else if (note === 'g') {
          melody += Math.random() < 0.8 ? gmajG7 : '-';
        } else if (note === 'a') {
          melody += Math.random() < 0.6 ? '6' : '-';
        } else if (note === 'b') {
          melody += Math.random() < 0.8 ? gmajG7 : '-';
        } else if (note === 'o') {
          melody += Math.random() < 0.8 ? fmajFmin : '-';
        } else if (note === 'p') {
          melody += Math.random() < 0.8 ? gmajG7 : '-';
        } else if (note === '-') {
          melody += Math.random() < 0.4 ? gRand : '-';
        } else if (note === '|') {
          melody += melody
        } else {
          melody += '-'
        }
      }
    }
    melodySum += arr1[i]
      if (Number.isInteger(melodySum / 4)) {
        melody += '|';
      }
  }
  return melody;
}