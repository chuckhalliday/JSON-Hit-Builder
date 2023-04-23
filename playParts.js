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
    'o': 29, 'O': 30,   // F, F#
    'p': 31, 'P': 32,   // G, G#
    'a': 33, 'A': 34,  // All capitals are sharp
    'b': 35,
    'c': 36, 'C': 37,
    'd': 38, 'D': 39,
    'e': 40,
    'f': 41, 'F': 42,
    'g': 43, 'G': 44,
};

export function adjustBassNotes(keyAdjust) {
    for (let key in bassNotes) {
        bassNotes[key] = bassNotes[key] + keyAdjust;
    }
}

export async function playBeat(pattern, groove, bpm) {
    const beatDuration = 60 / bpm // duration of one beat in seconds
    function wait(time) {
      return new Promise(resolve => setTimeout(resolve, time * 1000));
    }
    const output = new midi.Output();
    output.openPort(0)
    for (let index = 0; index < pattern.length; index++) {
      const drum = drumHits[pattern[index]];
      const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      const duration = groove[index] * beatDuration
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
    function wait(time) {
      return new Promise(resolve => setTimeout(resolve, time * 1000));
    }
    const output = new midi.Output();
    output.openPort(1)
    for (let index = 0; index < pattern.length; index++) {
      const bass = bassNotes[pattern[index]];
      const duration = groove[index] * beatDuration
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