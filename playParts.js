import midi from 'midi';

let drumHits = {
    'x': 36, 'X': 36,  // kick drum
    'y': 38, 'Y': 38,  // snare drum
    'v': 42, 'V': 42,  // closed hi-hat
    'w': 46, 'W': 46,  // open hi-hat
    'r': 51, 'R': 51,  // ride cymbal
    'q': 39, 'Q': 39,  // bell
    'z': 49, 'Z': 49,  // crash cymbal
    'u': 47, 'U': 47,  // high tom
    't': 45, 'T': 45,  // mid tom
    's': 43, 'S': 43   // low tom
};
  
let bassNotes = {
    'o': 41, 'O': 42,   // F, F#
    'p': 43, 'P': 44,   // G, G#
    'a': 45, 'A': 46,  // All capitals are sharp
    'b': 47,
    'c': 48, 'C': 49,
    'd': 50, 'D': 51,
    'e': 52,
    'f': 53, 'F': 54,
    'g': 55, 'G': 56,
};

let chordTones = {
  '6': [45, 48, 52],       // Am
  '7': [46, 50, 53],      // Bb
  '1': [48, 52, 55, 60],  // C
  '2': [50, 53, 57],     // Dm
  '3': [52, 55, 59],      // Em
  '4': [53, 57, 60],      // F
  '5': [55, 59, 62],      // G 
  '8': [52, 56, 59],      // E
  '9': [48, 52, 58, 62],  // C9
  '0': [53, 56, 60]       // Fm
}

export function adjustBassNotes(keyAdjust) {
    for (let key in bassNotes) {
        bassNotes[key] = bassNotes[key] + keyAdjust;
    }
}

export function adjustChordNotes(keyAdjust) {
  for (let [key, value] of Object.entries(chordTones)) {
    chordTones[key] = value.map(note => note + keyAdjust);
  }
}

export async function playBeat(pattern, groove, bpm) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 5/6; // adjust as needed

  function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  const output = new midi.Output();
  output.openPort(0)

  for (let index = 0; index < pattern.length; index++) {
    const drum = drumHits[pattern[index]];
    const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    const isEvenSixteenth = index % 4 === 0 || index % 4 === 2;
    const duration = isEvenSixteenth
      ? groove[index] * beatDuration * swingRatio
      : groove[index] * beatDuration;
    if (drum) {
      let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      if (pattern[index] === pattern[index].toUpperCase()) {
        velocity = 90;
        if (Math.random() < 0.17) {  // 1 in 6 chance
          velocity = Math.floor(Math.random() * (120 - 100 + 1) + 100);
        }
      }
      output.sendMessage([144, drum, velocity])
      await wait(duration)
      output.sendMessage([128, drum, release])
    } else if (pattern[index] === '-') {
      await wait(duration);
    }
  }
}
  
export async function playBass(pattern, groove, bpm) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 5/6; // adjust as needed

  function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  const output = new midi.Output();
  output.openPort(1)

  for (let index = 0; index < pattern.length; index++) {
    const bass = bassNotes[pattern[index]];
    const isEvenEighth = index % 2 === 0;
    const duration = isEvenEighth
      ? groove[index/2] * beatDuration * swingRatio
      : groove[Math.floor(index/2)] * beatDuration;

    if (bass) {
      let velocity = Math.floor(Math.random() * (75 - 60 + 1) + 60);
      let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

      output.sendMessage([144, bass, velocity])
      await wait(duration)
      output.sendMessage([128, bass, release])
    } else if (pattern[index] === '-') {
      await wait(duration);
    }
  }
}

export async function playChords(pattern, groove, bpm) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 5/6; // adjust as needed

  function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  const output = new midi.Output();
  output.openPort(2)

  for (let index = 0; index < pattern.length; index++) {
    const chord = chordTones[pattern[index]];
    const isEvenEighth = index % 2 === 0;
    const duration = isEvenEighth
      ? groove[index/2] * beatDuration * swingRatio
      : groove[Math.floor(index/2)] * beatDuration;
      
    if (chord) {
      for (let i = 0; i < chord.length; i++) {
        let velocity = Math.floor(Math.random() * (75 - 60 + 1) + 60);
        output.sendMessage([144, chord[i], velocity]);
      }
      await wait(duration);
      for (let i = 0; i < chord.length; i++) {
        let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
        output.sendMessage([128, chord[i], release]);
      }
    } else if (pattern[index] === '-') {
      await wait(duration);
    }
  }
} 





