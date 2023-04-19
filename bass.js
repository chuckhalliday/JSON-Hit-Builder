export function primaryGroove() {
    const initBass = [0.5];
    let measureSum = 0.5;
    let beatSum = 0.5;

    const randomValues = [0.25, 0.5, 0.75, 1, 1.25, 1.5];

    while (measureSum < 4) {
    const random = randomValues[Math.floor(Math.random() * randomValues.length)];
    if (beatSum + random <= 2) {
        initBass.push(random);
        beatSum += random;
    } else {
        // skip adding the current random value
    }
    if (beatSum === 2) {
        beatSum = 0;
        measureSum += 2;
        }
    }
    return initBass
}

export function bassString1(arr) {
    let bass = '';
    let sum = 0

    let a_c = Math.random() < 0.5 ? 'a' : 'c';
    let acc1;

    if (a_c === 'a') {
        acc1 = Math.random() < 0.6 ? 'p' : 'P';
    } else if (a_c === 'c') {
        acc1 = Math.random() < 0.8 ? 'b' : 'A';
    }


    for (let i = 0; i < arr.length; i++) {
      if (arr[i] <= 0.25) {
        bass += '-'
      } else {
      if (sum >= 0 && sum <= 0.5) {
        bass += a_c
      } else if (sum > 0.5 && sum <= 4) {
        bass += Math.random() < 0.4 ? a_c : acc1;
      } else {
        bass += '-'
      }
    }
      sum += arr[i]
    }
    bass += '|'
    return bass;
}

export function bassString2(arr, string1) {
  let bass = '';
  let sum = 0
  let possibleBassValues;

  if (string1.includes('c')) {
    possibleBassValues = ['f', 'g'];
  } else if (string1.includes('a')) {
    possibleBassValues = ['d', 'e'];
  }
    let bass2 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)]
    const dVals = ['o', 'e', 'f', 'a', '-']
    let dAcc = dVals[Math.floor(Math.random() * dVals.length)]
    const eVals = ['D', 'f', 'g', 'b', '-']
    let eAcc = eVals[Math.floor(Math.random() * eVals.length)]
    const fVals = ['a', 'c', 'g', '-']
    let fAcc = fVals[Math.floor(Math.random() * fVals.length)]
    const gVals = ['b', 'd', 'f', '-']
    let gAcc = gVals[Math.floor(Math.random() * gVals.length)]
    const bVals = ['c', 'd', 'f', '-']
    let bAcc = bVals[Math.floor(Math.random() * bVals.length)]

    let acc2;

    if (bass2 === 'd') {
        acc2 = dAcc;
    } else if (bass2 === 'e') {
        acc2 = eAcc;
    } else if (bass2 === 'f') {
        acc2 = fAcc;
    } else if (bass2 === 'g') {
        acc2 = gAcc;
    } else if (bass2 === 'b') {
        acc2 = bAcc;
    }

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] <= 0.25) {
        bass += '-'
    } else if (sum <= 1 || sum > 2 && sum <= 3 ) {
        bass += Math.random() < 0.8 ? bass2 : '-';
    } else if (sum > 1 && sum <= 2 || sum > 3 && sum < 4) {
        bass += Math.random() < 0.3 ? bass2 : acc2;
    } else {
        bass += '-'
      }
      sum += arr[i]
    }
    bass += '|'
    return bass;
}

export function bassString3(arr) {
    let bass = '';
    let sum = 0
    const possibleBassValues = ['d', 'e', 'f', 'g', 'b'];
    let bass3 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)]

    const dVals = ['o', 'e', 'f', 'a', '-']
    let dAcc = dVals[Math.floor(Math.random() * dVals.length)]
    const eVals = ['D', 'f', 'g', 'b', '-']
    let eAcc = eVals[Math.floor(Math.random() * eVals.length)]
    const fVals = ['a', 'c', 'g', '-']
    let fAcc = fVals[Math.floor(Math.random() * fVals.length)]
    const gVals = ['b', 'd', 'f', '-']
    let gAcc = gVals[Math.floor(Math.random() * gVals.length)]
    const bVals = ['c', 'd', 'f', '-']
    let bAcc = bVals[Math.floor(Math.random() * bVals.length)]

    let acc3;
    if (bass3 === 'd') {
        acc3 = dAcc;
    } else if (bass3 === 'e') {
        acc3 = eAcc;
    } else if (bass3 === 'f') {
        acc3 = fAcc;
    } else if (bass3 === 'g') {
        acc3 = gAcc;
    } else if (bass3 === 'b') {
        acc3 = bAcc;
    }

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] <= 0.25) {
            bass += '-'
        } else if (sum <= 1 || sum > 2 && sum <= 3 ) {
            bass += Math.random() < 0.8 ? bass3 : '-';
        } else if (sum > 1 && sum <= 2 || sum > 3 && sum < 4) {
            bass += Math.random() < 0.3 ? bass3 : acc3;
        } else {
        bass += '-'
        } 
      sum += arr[i]
    }
    bass += '|'
    return bass;
}

export function bassString4(arr) {
    let bass = '';
    let sum = 0
    const possibleBassValues = ['d', 'e', 'f', 'g', 'b'];
    let bass4 = possibleBassValues[Math.floor(Math.random() * possibleBassValues.length)]
    const dVals = ['o', 'e', 'f', 'a', '-']
    let dAcc = dVals[Math.floor(Math.random() * dVals.length)]
    const eVals = ['D', 'f', 'g', 'b', '-']
    let eAcc = eVals[Math.floor(Math.random() * eVals.length)]
    const fVals = ['a', 'c', 'g', '-']
    let fAcc = fVals[Math.floor(Math.random() * fVals.length)]
    const gVals = ['b', 'd', 'f', '-']
    let gAcc = gVals[Math.floor(Math.random() * gVals.length)]
    const bVals = ['c', 'd', 'f', '-']
    let bAcc = bVals[Math.floor(Math.random() * bVals.length)]

    let acc4;
    if (bass4 === 'd') {
        acc4 = dAcc;
    } else if (bass4 === 'e') {
        acc4 = eAcc;
    } else if (bass4 === 'f') {
        acc4 = fAcc;
    } else if (bass4 === 'g') {
        acc4 = gAcc;
    } else if (bass4 === 'b') {
        acc4 = bAcc;
    }

    let b_g = Math.random() < 0.5 ? 'b' : 'g';

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] <= 0.25) {
        bass += '-'
      } else {
      if (sum >= 0 && sum <= 1) {
        bass += bass4
      } else if (sum > 1 && sum <= 3) {
        bass += Math.random() < 0.6 ? bass4 : acc4 ;
      }else if (sum > 3 && sum < 4) {
        bass += Math.random() < 0.9 ? b_g : '-';
      } else {
        bass += '-'
      }
    }
      sum += arr[i]
    }
    bass += '|'
    return bass;
}