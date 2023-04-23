export function setKey() {
    let keyDownMin = -7;
    let keyUpMax = 7;
    let keyAdjust = Math.floor(Math.random() * (keyUpMax - keyDownMin + 1)) + keyDownMin;

    return keyAdjust
}

export function findKey(string, keyAdjust) {
    const keys = [
      "F", "Gb", "G", "Ab", "A", "Bb", "B", "C",
      "C#", "D", "D#", "E", "F", "F#", "G",
    ];
    let key;
    let tonality;
  
    if (string.charAt(0) === "c") {
      key = keys[keyAdjust + 7] || "C";
      tonality = "Major";
    } else if (string.charAt(0) === "a") {
      key = keys[keyAdjust + 4] || "A";
      tonality = "Minor";
    } else if (string.charAt(0) === "d") {
      key = keys[keyAdjust + 9] || "D";
      tonality = "Dorian";
    } else if (string.charAt(0) === "e") {
      key = keys[keyAdjust + 11] || "E";
      tonality = "Phrygian";
    } else if (string.charAt(0) === "f") {
      key = keys[keyAdjust + 1] || "F";
      tonality = "Lydian";
    } else if (string.charAt(0) === "g") {
      key = keys[keyAdjust + 3] || "G";
      tonality = "Mixolydian";
    } else if (string.charAt(0) === "b") {
      key = keys[keyAdjust + 7] || "B";
      tonality = "Locrian";
    }
    return key + " " + tonality;
  }