export function setKey() {
  let keyDownMin = -8;
  let keyUpMax = 4;
  let keyAdjust = Math.floor(Math.random() * (keyUpMax - keyDownMin + 1)) + keyDownMin;

  return keyAdjust
}

export function findKey(string: string, keyAdjust: number) {
  let keys: string[] = []
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
  let key;
  let tonality;
  
  if (string.charAt(0) === "c") {
    key = keys[keyAdjust + 15] || "C";
    tonality = "Major";
  } else if (string.charAt(0) === "a") {
    key = keys[keyAdjust + 12] || "A";
    tonality = "Minor";
  } else if (string.charAt(0) === "d") {
    key = keys[keyAdjust + 17] || "D";
    tonality = "Dorian";
  } else if (string.charAt(0) === "e") {
    key = keys[keyAdjust + 19] || "E";
    tonality = "Phrygian";
  } else if (string.charAt(0) === "f") {
    key = keys[keyAdjust + 20] || "F";
    tonality = "Lydian";
  } else if (string.charAt(0) === "g") {
    key = keys[keyAdjust + 22] || "G";
    tonality = "Mixolydian";
  } else if (string.charAt(0) === "b") {
    key = keys[keyAdjust + 14] || "B";
    tonality = "Locrian";
  }
  return key + " " + tonality;
}