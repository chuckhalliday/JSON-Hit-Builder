import { shuffleArray, subdivideArray } from "./groove.js";
import { createDrums, kickString, snareString, hatString, flareString, } from "./drums.js";
import { primaryGroove, bassString1, bassString2, bassString3, bassString4, } from "./bass.js";
import { melodyGroove, melodyString } from "./melody.js";

function sumArray(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum;
}

//groove

const primaryBass = primaryGroove();
const primaryBass2 = primaryGroove();
const initBass = primaryBass.concat(primaryBass, primaryBass, primaryBass);
let bassCount = sumArray(initBass);
console.log(bassCount);

const primaryDrums = createDrums(primaryBass);
const primaryDrums2 = createDrums(primaryBass2);
const drumTrips = subdivideArray(primaryDrums);
const initDrums = primaryDrums.concat(drumTrips, primaryDrums2, drumTrips);
let drumCount = sumArray(initDrums);
console.log(drumCount);

const primaryMelody = melodyGroove(primaryBass);
const primaryMelody2 = melodyGroove(primaryBass2);
const initMelody = primaryMelody.concat(primaryMelody, primaryMelody2, primaryMelody);
let melodyCount = sumArray(initMelody);
console.log(melodyCount);

//verse

const bassLine1V = bassString1(primaryBass);
const bassLine2V = bassString2(primaryBass, bassLine1V);
const bassLine3V = bassString3(primaryBass2);
const bassLine4V = bassString4(primaryBass);
const bassV = bassLine1V.concat(bassLine2V + bassLine3V + bassLine4V);

const melodyLine1V = melodyString(primaryMelody, primaryBass, bassLine1V);
const melodyLine2V = melodyString(primaryMelody, primaryBass, bassLine2V);
const melodyLine3V = melodyString(primaryMelody2, primaryBass2, bassLine3V);
const melodyLine4V = melodyString(primaryMelody, primaryBass, bassLine4V);
const melodyV = melodyLine1V.concat(melodyLine2V + melodyLine3V + melodyLine4V);

const bassDrum1V = kickString(primaryDrums, primaryBass, bassLine1V);
const bassDrum2V = kickString(drumTrips, primaryBass, bassLine2V);
const bassDrum3V = kickString(primaryDrums2, primaryBass2, bassLine3V);
const bassDrum4V = kickString(drumTrips, primaryBass, bassLine4V);
const bassDrumV = bassDrum1V.concat(bassDrum2V + bassDrum3V + bassDrum4V);

const snareDrumV = snareString(initDrums);

const hiHatV = hatString(initDrums);

const flareV = flareString(initDrums);

//chorus

const bassLine1C = bassString1(primaryBass);
const bassLine2C = bassString2(primaryBass, bassLine1C);
const bassLine3C = bassString3(primaryBass2);
const bassLine4C = bassString4(primaryBass);
const bassC = bassLine1C.concat(bassLine2C + bassLine3C + bassLine4C);

const melodyLine1C = melodyString(primaryMelody, primaryBass, bassLine1C);
const melodyLine2C = melodyString(primaryMelody, primaryBass, bassLine2C);
const melodyLine3C = melodyString(primaryMelody2, primaryBass2, bassLine3C);
const melodyLine4C = melodyString(primaryMelody, primaryBass, bassLine4C);
const melodyC = melodyLine1C.concat(melodyLine2C + melodyLine3C + melodyLine4C);

const bassDrum1C = kickString(primaryDrums, primaryBass, bassLine1C);
const bassDrum2C = kickString(drumTrips, primaryBass, bassLine2C);
const bassDrum3C = kickString(primaryDrums2, primaryBass2, bassLine3C);
const bassDrum4C = kickString(drumTrips, primaryBass, bassLine4C);
const bassDrumC = bassDrum1C.concat(bassDrum2C + bassDrum3C + bassDrum4C);

const snareDrumC = snareString(initDrums);

const hiHatC = hatString(initDrums);

const flareC = flareString(initDrums);

//bridge

const bassLine1B = bassString1(primaryBass);
const bassLine2B = bassString2(primaryBass, bassLine1B);
const bassLine3B = bassString3(primaryBass2);
const bassLine4B = bassString4(primaryBass);
const bassB = bassLine1B.concat(bassLine2B + bassLine3B + bassLine4B);

const melodyLine1B = melodyString(primaryMelody, primaryBass, bassLine1B);
const melodyLine2B = melodyString(primaryMelody, primaryBass, bassLine2B);
const melodyLine3B = melodyString(primaryMelody2, primaryBass2, bassLine3B);
const melodyLine4B = melodyString(primaryMelody, primaryBass, bassLine4B);
const melodyB = melodyLine1B.concat(melodyLine2B + melodyLine3B + melodyLine4B);

const bassDrum1B = kickString(primaryDrums, primaryBass, bassLine1B);
const bassDrum2B = kickString(drumTrips, primaryBass, bassLine2B);
const bassDrum3B = kickString(primaryDrums2, primaryBass2, bassLine3B);
const bassDrum4B = kickString(drumTrips, primaryBass, bassLine4B);
const bassDrumB = bassDrum1B.concat(bassDrum2B + bassDrum3B + bassDrum4B);

const snareDrumB = snareString(initDrums);

const hiHatB = hatString(initDrums);

const flareB = flareString(initDrums);

const songtime = Math.round(Math.random() * (240 - 210) + 210);
const bpm = Math.round(Math.random() * (140 - 60) + 60);
const bps = bpm / 60;
const beatstotal = bps * songtime;
const measures = Math.round(beatstotal / 4 / 4) * 4;
const partsLength = measures / 4;

let keyDownMin = -7;
let keyUpMax = 7;
let keyAdjust =
  Math.floor(Math.random() * (keyUpMax - keyDownMin + 1)) + keyDownMin;

function findKey(string) {
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

let key = findKey(bassV);

console.log(
  `drumHits = {
  'x' => 36, 'X' => 36,  # kick drum
  'y' => 38, 'Y' => 38,  # snare drum
  'v' => 42, 'V' => 42,  # closed hi-hat
  'w' => 46, 'W' => 46,  # open hi-hat
  'r' => 51, 'R' => 51,  # ride cymbal
  'q' => 39, 'Q' => 39,  # bell
  'z' => 49, 'Z' => 49,  # crash cymbal
  'u' => 47, 'U' => 47,  # high tom
  't' => 45, 'T' => 45,  # mid tom
  's' => 43, 'S' => 43   # low tom
}
  
bassNotes = {
  'o' => 29, 'O' => 30,   # F
  'p' => 31, 'P' => 32,   # G
  'a' => 33, 'A' => 34,  # sharps are capital
  'b' => 35,
  'c' => 36, 'C' => 37,
  'd' => 38, 'D' => 39,
  'e' => 40,
  'f' => 41, 'F' => 42,
  'g' => 43, 'G' => 44
}
  
chordTones = {
  '6' => [45, 48, 52],       # Am
  '7' => [46, 50, 53],      # Bb
  '1' => [48, 52, 55, 60],  # C
  '2' => [50, 53, 57],      # Dm
  '3' => [52, 55, 59],      # Em
  '4' => [53, 57, 60],      # F
  '5' => [55, 59, 62],      # G
    
  '8' => [52, 56, 59],      # E
  '9' => [48, 52, 58, 62],  # C9
  '0' => [53, 56, 60]       # Fm
}
  
melodyNotes = {
  'h' => 57, 'H' => 58,  # A
  'i' => 59,             # B
  'j' => 60, 'J' => 61,  # C
  'k' => 62, 'K' => 63,  # D
  'l' => 64,             # E
  'm' => 65, 'M' => 66,  # F
  'n' => 67, 'N' => 68   # G
}

#Transpose chords (D major)
bassNotes.each do |key, value|
bassNotes[key] = value + ` + keyAdjust + ` end

melodyNotes.each do |key, value|
melodyNotes[key] = value + ` + keyAdjust + ` end

chordTones.each do |key, value|
chordTones[key] = value.map {|note| note + ` + keyAdjust + `} end

midi_ports = ["iac_driver_bus_1", "iac_driver_bus_2", "iac_driver_bus_3", "iac_driver_bus_4"]`
);

console.log(`define :playBeat do |pattern,
groove = [`);

let line = "";
let sum = 0;

for (let i = 0; i < initDrums.length; i++) {
  sum += initDrums[i];
  line += initDrums[i] + ",";

  if (sum >= 3.9 && sum <= 4.1) {
    console.log(line);
    line = "";
    sum = 0;
  }
}

console.log(`]|

    in_thread do
    (pattern.length).times do |index|
      drum = drumHits[pattern[index]]
      release = rand(50..70)
      if drum
        if pattern[index] == pattern[index].upcase
          velocity = 90
          velocity = rand(100..120) if one_in(6)
       else
          velocity = rand(50..70)
        end
        midi_note_on drum, velocity: velocity, port: midi_ports[0]
        sleep groove[index]
        midi_note_off drum, release: release, port: midi_ports[0]
      elsif pattern[index] == '-'
        sleep groove[index]
      end
    end
  end
end
`);

console.log(`define :playBass do |pattern,
  groove = [`);

for (let i = 0; i < initBass.length; i++) {
  sum += initBass[i];
  line += initBass[i] + ",";

  if (sum >= 3.9 && sum <= 4.1) {
    console.log(line);
    line = "";
    sum = 0;
  }
}

console.log(`]|

  in_thread do
    (pattern.length).times do |index|
      bass = bassNotes[pattern[index]]
      if bass
        velocity = rand(60..75)
        release = rand(50..70)
        midi_note_on bass, velocity: velocity, port: midi_ports[1]
        sleep groove[index - 0.25]
        midi_note_off bass, release: release, port: midi_ports[1]
      elsif pattern[index] == '-'
        sleep groove[index]
      end
    end
  end
end
`);

console.log(`define :playMelody do |pattern,
  groove= [`);

for (let i = 0; i < initMelody.length; i++) {
  sum += initMelody[i];
  line += initMelody[i] + ",";

  if (sum >= 3.9 && sum <= 4.1) {
    console.log(line);
    line = "";
    sum = 0;
  }
}

console.log(`]|

  in_thread do
    (pattern.length).times do |index|
      chords = chordTones[pattern[index]]
      melody = melodyNotes[pattern[index]]
      if chords
        velocity = rand(40..50)
        release = rand(50..70)
        chords.each do |tone|
        midi_note_on tone, velocity: velocity, port: midi_ports[2]
        end
        sleep groove[index]
        chords.each do |tone|
        midi_note_off tone, release: release, port: midi_ports[2]
        end
      elsif melody
        velocity = rand(40..50)
        midi_note_on melody, velocity: velocity, port: midi_ports[2]
        sleep groove[index]
        midi_note_off melody, release: release, port: midi_ports[2]
      elsif pattern[index] == '-'
        sleep groove[index]
      end
    end
  end
end
`);

console.log(`v_kick = ("` + bassDrumV + `").gsub(/\\|/, '')`);
console.log(`c_kick = ("` + bassDrumC + `").gsub(/\\|/, '')`);
console.log(`b_kick = ("` + bassDrumB +`").gsub(/\\|/, '')
`);

console.log(`v_snare = ("` + snareDrumV + `").gsub(/\\|/, '')`);
console.log(`c_snare = ("` + snareDrumC + `").gsub(/\\|/, '')`);
console.log(`b_snare = ("` + snareDrumB + `").gsub(/\\|/, '')
`);

console.log(`v_hihat = ("` + hiHatV + `").gsub(/\\|/, '')`);
console.log(`c_hihat = ("` + hiHatC + `").gsub(/\\|/, '')`);
console.log(`b_hihat = ("` + hiHatB + `").gsub(/\\|/, '')
`);

console.log(`v_flare = ("` + flareV + `").gsub(/\\|/, '')`);
console.log(`c_flare = ("` + flareC + `").gsub(/\\|/, '')`);
console.log(`b_flare = ("` + flareB + `").gsub(/\\|/, '')
`);

console.log(`v_bass = ("` + bassV + `").gsub(/\\|/, '')`);
console.log(`c_bass = ("` + bassC + `").gsub(/\\|/, '')`);
console.log(`b_bass = ("` + bassB + `").gsub(/\\|/, '')
`);

console.log(`v_melody = ("` + melodyV + `").gsub(/\\|/, '')`);
console.log(`c_melody = ("` + melodyC + `").gsub(/\\|/, '')`);
console.log(`b_melody = ("` + melodyB + `").gsub(/\\|/, '')
`);

console.log(
  `define :verse do
  1.times do
    in_thread do
      playBeat (ring v_kick).tick
      playBeat (ring v_snare).tick
      playBeat (ring v_hihat).tick
      playBeat (ring v_flare).tick
      playBass (ring v_bass).tick
      #playMelody (ring v_melody).tick
    end
    sleep 16
  end
end

define :chorus do
  1.times do
    in_thread do
      playBeat (ring c_kick).tick
      playBeat (ring c_snare).tick
      playBeat (ring c_hihat).tick
      playBeat (ring c_flare).tick
      playBass (ring c_bass).tick
      #playMelody (ring c_melody).tick
    end
    sleep 16
  end
end

define :bridge do
  1.times do
    in_thread do
      playBeat (ring b_kick).tick
      playBeat (ring b_snare).tick
      playBeat (ring b_hihat).tick
      playBeat (b_flare.tick)
      playBass (ring b_bass).tick
      #playMelody (ring b_melody).tick
    end
    sleep 16
  end
end

#key: ` + key + `

use_bpm ` + bpm + `

2.times do
  verse
end
2.times do
  chorus
end
2.times do
  bridge
end
`
);
