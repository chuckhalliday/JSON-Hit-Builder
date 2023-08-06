export function createChords(bassGroove: number[]) {
  let chordArray = []
  let sum = bassGroove[0]
  for (let i = 1; i < bassGroove.length; i++) {
    let roll = Math.random()
    if (sum >= 2) {
      chordArray.push(sum)
      sum = 0
      sum += bassGroove[i]
    } else if (sum >= 1 && roll < 0.5) {
      chordArray.push(sum)
      sum = 0
      sum += bassGroove[i]
    } else {
      sum += bassGroove[i]
    }
  }
  if (sum > 0) {
    chordArray.push(sum)
  }
  return chordArray
}

export function chordString(chordsGroove: number[], bassGroove: number[], bassString: string[]) {

const cmajCmaj7 = Math.random() < 0.9 ? "1" : "!";
const dmin7C9 = Math.random() < 0.8 ? "@" : "9";
const emin7Emaj = Math.random() < 0.8 ? "#" : "8";
const f7Fmin = Math.random() < 0.5 ? "$" : "0";
const g7Bdim = Math.random() < 0.7 ? "%" : "7";
const aminCmaj = Math.random() < 0.8 ? "6" : "1";

let chords = ""
let chordSum = 0;
let bassSum = 0;
let arr1Index = 0;

let bass = bassString

for (let i = 0; i < bassGroove.length; i++) {
  
  const note = bass[i];
  
    if (bassSum === chordSum) {
      chordSum += chordsGroove[arr1Index]
      arr1Index ++
      if (Number.isInteger(bassSum / 2)) {
        if (note === "c") {
          chords += cmajCmaj7;
        } else if (note === "d") {
          chords += Math.random() < 0.8 ? "2" : dmin7C9;
        } else if (note === "e") {
          chords += Math.random() < 0.8 ? "3" : emin7Emaj;
        } else if (note === "f") {
          chords += Math.random() < 0.8 ? "4" : f7Fmin;
        } else if (note === "g") {
          chords += Math.random() < 0.8 ? "5" : g7Bdim;
        } else if (note === "a") {
          chords += aminCmaj;
        } else if (note === "b") {
          chords += g7Bdim;
        } else if (note === "o") {
          chords += Math.random() < 0.8 ? "4" : f7Fmin;
        } else if (note === "p") {
          chords += Math.random() < 0.8 ? "5" : g7Bdim;
        } else if (note === "|") {
          chords = chords;
        } else if (note === "-") {
          chords += "-"
        } else {
          chords += "-"
        }
      } else {
        chords += "-"
      }
    }
    bassSum += bassGroove[i];
  }
    return chords;
}

export function chordLocation(bassLocation: { x: number, y: number, acc: string }[], bassGroove: number[], chordGroove: number[]) {
  let chordX: number[] = []
  let bassSum = 0
  let chordSum = 0
  let chordIndex = 0

  for (let i = 0; i < bassGroove.length; i++){
    if (bassSum === chordSum) {
      chordX.push(bassLocation[i].x)
      chordSum += chordGroove[chordIndex]
      chordIndex++
    }
    bassSum += bassGroove[i]
  }
  return chordX
}


export function adjustChordString(chordString: string, keyAdjust: number) {
  let transpose: string[] = [];
  let keys: string[] = []
  console.log(chordString)
  for (let i = 0; i < chordString.length; i++) {
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
      switch (chordString.charAt(i)) {
        case "6": transpose.push(keys[12 + keyAdjust] + `m`); 
          break;
        case "7": transpose.push(keys[14 + keyAdjust] + `°`); 
          break;
        case "1": transpose.push(keys[15 + keyAdjust]); 
          break;
        case "!": transpose.push(keys[15 + keyAdjust]  + `maj7`); 
          break;
        case "2": transpose.push(keys[17 + keyAdjust] + `m`); 
          break;
        case "@": transpose.push(keys[17 + keyAdjust] + `m7`); 
          break;
        case "3": transpose.push(keys[19 + keyAdjust] + `m`); 
          break;
        case "#": transpose.push(keys[19 + keyAdjust] + `m7`); 
          break;
        case "4": transpose.push(keys[20 + keyAdjust]); 
          break;
        case "$": transpose.push(keys[20 + keyAdjust]  + `7`); 
          break;
        case "5": transpose.push(keys[22 + keyAdjust]); 
          break;
        case "%": transpose.push(keys[22 + keyAdjust]  + `7`); 
          break;
        case "8": transpose.push(keys[19 + keyAdjust]); 
          break;
        case "0": transpose.push(keys[20 + keyAdjust] + `m`);
          break;
        case "9": transpose.push(keys[15 + keyAdjust] + `9`);
          break;
        case "-": transpose.push("-");
          break;
      }
  }
  return transpose;
}

  export const tone = {
    C: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01],
    Db: [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
    D: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
    Eb: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
    E: [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
    F: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
    Gb: [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
    G: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
    Ab: [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
    A: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
    Bb: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
    B: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
  }
  
  export const chordToneMappings: { [key: string]: number[] } = {
    'Ab': [tone.Ab[4], tone.C[5], tone.Eb[5]],
    'Abmaj7': [tone.Ab[4], tone.C[5], tone.Eb[5], tone.G[5]],
    'Ab7': [tone.Ab[4], tone.C[5], tone.Eb[5], tone.Gb[4]],
    'Ab9': [tone.Ab[4], tone.C[5], tone.Eb[5], tone.Bb[4]],
    'Abm': [tone.Ab[4], tone.B[5], tone.Eb[5]],
    'Abm7': [tone.Ab[4], tone.B[5], tone.Eb[5], tone.Gb[4]],
    'Ab°': [tone.Ab[4], tone.B[5], tone.D[5]],
  
    'A': [tone.A[4], tone.Db[5], tone.E[5]],
    'Amaj7': [tone.A[4], tone.Db[5], tone.E[5], tone.Ab[5]],
    'A7': [tone.A[4], tone.Db[5], tone.E[5], tone.G[4]],
    'A9': [tone.A[4], tone.Db[5], tone.E[5], tone.B[4]],
    'Am': [tone.A[4], tone.C[5], tone.E[5]],
    'Am7': [tone.A[4], tone.C[5], tone.E[5], tone.G[4]],
    'A°': [tone.A[4], tone.C[5], tone.Eb[5]],
  
    'Bb': [tone.Bb[4], tone.D[5], tone.F[5]],
    'Bbmaj7': [tone.Bb[4], tone.D[5], tone.F[5], tone.A[5]],
    'Bb7': [tone.Bb[4], tone.D[5], tone.F[5], tone.Ab[4]],
    'Bb9': [tone.Bb[4], tone.D[5], tone.F[5], tone.C[4]],
    'Bbm': [tone.Bb[4], tone.Db[5], tone.F[5]],
    'Bbm7': [tone.Bb[4], tone.Db[5], tone.F[5], tone.Ab[4]],
    'Bb°': [tone.Bb[4], tone.Db[5], tone.E[5]],
  
    'B': [tone.B[4], tone.Eb[5], tone.Gb[5]],
    'Bmaj7': [tone.B[4], tone.Eb[5], tone.Gb[5], tone.Bb[5]],
    'B7': [tone.B[4], tone.Eb[5], tone.Gb[5], tone.A[4]],
    'B9': [tone.B[4], tone.Eb[5], tone.Gb[5], tone.Db[5]],
    'Bm': [tone.B[4], tone.D[5], tone.Gb[5]],
    'Bm7': [tone.B[4], tone.D[5], tone.Gb[5], tone.A[4]],
    'B°': [tone.B[4], tone.D[5], tone.F[5]],
  
    'C': [tone.C[4], tone.E[4], tone.G[4]],
    'Cmaj7': [tone.C[4], tone.E[4], tone.G[4], tone.B[4]],
    'C7': [tone.C[4], tone.E[4], tone.G[4], tone.Bb[3]],
    'C9': [tone.C[4], tone.E[4], tone.G[4], tone.D[4]],
    'Cm': [tone.C[4], tone.Eb[4], tone.G[4]],
    'Cm7': [tone.C[4], tone.Eb[4], tone.G[4], tone.Bb[3]],
    'C°': [tone.C[4], tone.Eb[4], tone.Gb[4]],
  
    'C#': [tone.Db[4], tone.F[4], tone.Ab[4]],
    'C#maj7': [tone.Db[4], tone.F[4], tone.Ab[4], tone.C[4]],
    'C#7': [tone.Db[4], tone.F[4], tone.Ab[4], tone.B[3]],
    'C#9': [tone.Db[4], tone.F[4], tone.Ab[4], tone.Eb[4]],
    'C#m': [tone.Db[4], tone.E[4], tone.Ab[4]],
    'C#m7': [tone.Db[4], tone.E[4], tone.Ab[4], tone.B[3]],
    'C#°': [tone.Db[4], tone.E[4], tone.G[4]],
  
    'Db': [tone.Db[4], tone.F[4], tone.Ab[4]],
    'Dbmaj7': [tone.Db[4], tone.F[4], tone.Ab[4], tone.C[4]],
    'Db7': [tone.Db[4], tone.F[4], tone.Ab[4], tone.B[3]],
    'Db9': [tone.Db[4], tone.F[4], tone.Ab[4], tone.Eb[4]],
    'Dbm': [tone.Db[4], tone.E[4], tone.Ab[4]],
    'Dbm7': [tone.Db[4], tone.E[4], tone.Ab[4], tone.B[3]],
    'Db°': [tone.Db[4], tone.E[4], tone.G[4]],
  
    'D': [tone.D[4], tone.Gb[4], tone.A[4]],
    'Dmaj7': [tone.D[4], tone.Gb[4], tone.A[4], tone.Db[5]],
    'D7': [tone.D[4], tone.Gb[4], tone.A[4], tone.C[4]],
    'D9': [tone.D[4], tone.Gb[4], tone.A[4], tone.E[4]],
    'Dm': [tone.D[4], tone.F[4], tone.A[4]],
    'Dm7': [tone.D[4], tone.F[4], tone.A[4], tone.C[4]],
    'D°': [tone.D[4], tone.F[4], tone.Ab[4]],
  
    'D#': [tone.Eb[4], tone.G[4], tone.Bb[4]],
    'D#maj7': [tone.Eb[4], tone.G[4], tone.Bb[4], tone.D[5]],
    'D#7': [tone.Eb[4], tone.G[4], tone.Bb[4], tone.Db[4]],
    'D#9': [tone.Eb[4], tone.G[4], tone.Bb[4], tone.F[4]],
    'D#m': [tone.Eb[4], tone.Gb[4], tone.Bb[4]],
    'D#m7': [tone.Eb[4], tone.Gb[4], tone.Bb[4], tone.Db[4]],
    'D#°': [tone.Eb[4], tone.Gb[4], tone.A[4]],
  
    'Eb': [tone.Eb[4], tone.G[4], tone.Bb[4]],
    'Ebmaj7': [tone.Eb[4], tone.G[4], tone.Bb[4], tone.D[5]],
    'Eb7': [tone.Eb[4], tone.G[4], tone.Bb[4], tone.Db[4]],
    'Eb9': [tone.Eb[4], tone.G[4], tone.Bb[4], tone.F[4]],
    'Ebm': [tone.Eb[4], tone.Gb[4], tone.Bb[4]],
    'Ebm7': [tone.Eb[4], tone.Gb[4], tone.Bb[4], tone.Db[4]],
    'Eb°': [tone.Eb[4], tone.Gb[4], tone.A[4]],
  
    'E': [tone.E[4], tone.Ab[4], tone.B[4]],
    'Emaj7': [tone.E[4], tone.Ab[4], tone.B[4], tone.Eb[5]],
    'E7': [tone.E[4], tone.Ab[4], tone.B[4], tone.D[4]],
    'E9': [tone.E[4], tone.Ab[4], tone.B[4], tone.Gb[4]],
    'Em': [tone.E[4], tone.G[4], tone.B[4]],
    'Em7': [tone.E[4], tone.G[4], tone.B[4], tone.D[4]],
    'E°': [tone.E[4], tone.G[4], tone.Bb[4]],
  
    'F': [tone.F[4], tone.A[4], tone.C[5]],
    'Fmaj7': [tone.F[4], tone.A[4], tone.C[5], tone.E[5]],
    'F7': [tone.F[4], tone.A[4], tone.C[5], tone.Eb[4]],
    'F9': [tone.F[4], tone.A[4], tone.C[5], tone.G[4]],
    'Fm': [tone.F[4], tone.Ab[4], tone.C[5]],
    'Fm7': [tone.F[4], tone.Ab[4], tone.C[5], tone.Eb[4]],
    'F°': [tone.F[4], tone.Ab[4], tone.Bb[5]],
  
    'F#': [tone.Gb[4], tone.Bb[4], tone.Db[5]],
    'F#maj7': [tone.Gb[4], tone.Bb[4], tone.Db[5], tone.F[5]],
    'F#7': [tone.Gb[4], tone.Bb[4], tone.Db[5], tone.E[4]],
    'F#9': [tone.Gb[4], tone.Bb[4], tone.Db[5], tone.Ab[4]],
    'F#m': [tone.Gb[4], tone.A[4], tone.Db[5]],
    'F#m7': [tone.Gb[4], tone.A[4], tone.Db[5], tone.E[4]],
    'F#°': [tone.Gb[4], tone.A[4], tone.C[5]],
  
    'Gb': [tone.Gb[4], tone.Bb[4], tone.Db[5]],
    'Gbmaj7': [tone.Gb[4], tone.Bb[4], tone.Db[5], tone.F[5]],
    'Gb7': [tone.Gb[4], tone.Bb[4], tone.Db[5], tone.E[4]],
    'Gb9': [tone.Gb[4], tone.Bb[4], tone.Db[5], tone.Ab[4]],
    'Gbm': [tone.Gb[4], tone.A[4], tone.Db[5]],
    'Gbm7': [tone.Gb[4], tone.A[4], tone.Db[5], tone.E[4]],
    'Gb°': [tone.Gb[4], tone.A[4], tone.C[5]],
  
    'G': [tone.G[4], tone.B[5], tone.D[5]],
    'Gmaj7': [tone.G[4], tone.B[5], tone.D[5], tone.Gb[5]],
    'G7': [tone.G[4], tone.B[5], tone.D[5], tone.F[4]],
    'G9': [tone.G[4], tone.B[5], tone.D[5], tone.A[4]],
    'Gm': [tone.G[4], tone.Bb[5], tone.D[5]],
    'Gm7': [tone.G[4], tone.Bb[5], tone.D[5], tone.F[4]],
    'G°': [tone.G[4], tone.Bb[5], tone.Db[5]],
  
    'G#': [tone.Ab[4], tone.C[5], tone.Eb[5]],
    'G#maj7': [tone.Ab[4], tone.C[5], tone.Eb[5], tone.G[5]],
    'G#7': [tone.Ab[4], tone.C[5], tone.Eb[5], tone.Gb[4]],
    'G#9': [tone.Ab[4], tone.C[5], tone.Eb[5], tone.Bb[4]],
    'G#m': [tone.Ab[4], tone.B[5], tone.Eb[5]],
    'G#m7': [tone.Ab[4], tone.B[5], tone.Eb[5], tone.Gb[4]],
    'G#°': [tone.Ab[4], tone.B[5], tone.D[5]],
  
    '-': []
  };
  