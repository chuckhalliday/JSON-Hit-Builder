export function setKey() {
  let keyDownMin = -8;
  let keyUpMax = 4;
  let keyAdjust = Math.floor(Math.random() * (keyUpMax - keyDownMin + 1)) + keyDownMin;

  return keyAdjust
}

export function findKey(string, keyAdjust) {
  const keys = [
    "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
    "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", 
    "A", "A#", "B", "C", "C#", "D"
  ];
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