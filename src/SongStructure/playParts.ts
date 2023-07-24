//import midi from 'midi';

// Create an audio context
const audioContext = new AudioContext();

// Load a sound file asynchronously
function loadSoundFile(url: string, callback: (buffer: AudioBuffer) => void) {
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = () => {
    audioContext.decodeAudioData(request.response, (buffer: AudioBuffer) => {
      callback(buffer);
    });
  };

  request.send();
}

// Play a sound file
function playSound(buffer: AudioBuffer) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
}

function playNote(freq: number, duration: number) {


 
}
 

// Usage

const drumHits: Record<string, any> = {
    'x': './kick.wav', 'X': './kick.wav',  // kick drum 36
    'y': './snare.wav', 'Y': './snare.wav',  // snare drum 40 
    'v': './hat-closed.wav', 'V': './hat-closed.wav',  // closed hi-hat 42
    'w': 46, 'W': 46,  // open hi-hat
    'r': 51, 'R': 51,  // ride cymbal
    'q': 39, 'Q': 39,  // bell
    'z': 49, 'Z': 49,  // crash cymbal
    'u': 47, 'U': 47,  // high tom
    't': 45, 'T': 45,  // mid tom
    's': 43, 'S': 43   // low tom
};
  
const bassNotes: Record<string, number> = {
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

let chordTones: Record<string, number[]> = {
  '6': [45, 48, 52],       // Am
  '7': [47, 50, 53],      // Bdim
  '1': [48, 52, 55, 60],  // C
  '2': [50, 53, 57],     // Dm
  '3': [52, 55, 59],      // Em
  '4': [53, 57, 60],      // F
  '5': [55, 59, 62],      // G 
  '8': [52, 56, 59],      // E
  '9': [48, 52, 58, 62],  // C9
  '0': [53, 56, 60],       // Fm
  '!': [48, 52, 55, 59],   //Cmaj7
  '@': [50, 53, 57, 60],   // Dm7
  '#': [52, 55, 59, 62],   // Em7
  '$': [50, 53, 57, 60],   //F7
  '%': [52, 55, 59, 62],   //G7
}

export function adjustBassNotes(keyAdjust: number) {
    for (let key in bassNotes) {
        bassNotes[key] = bassNotes[key] + keyAdjust;
    }
}

export function adjustChordNotes(keyAdjust: number) {
  for (let [key, value] of Object.entries(chordTones)) {
    chordTones[key] = value.map(note => note + keyAdjust);
  }
}

export async function playBeat(pattern: Array<{ index: number; checked: boolean }>, groove: number[], bpm: number, stepsRef: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[]) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 3/3; // adjust as needed

  function wait(time: number) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  //const output = new midi.Output();
  //output.openPort(0)

  for (let index = 0; index < groove.length; index++) {
    //const drum = drumHits[pattern[index]];
    //const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    const isEvenSixteenth = index % 4 === 0 || index % 4 === 2;
    const duration = isEvenSixteenth
      ? groove[index] * beatDuration * swingRatio
      : groove[index] * beatDuration;
      if (lamps) {
        lamps[index].checked = true;
      }
      if (pattern ===  stepsRef[3] && pattern[index].checked) {
        loadSoundFile("../kick.wav", (buffer: AudioBuffer) => {
          playSound(buffer);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern ===  stepsRef[2]&& pattern[index].checked) {
        loadSoundFile("../snare.wav", (buffer: AudioBuffer) => {
          playSound(buffer);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern ===  stepsRef[0] && pattern[index].checked) {
        loadSoundFile("../hat-closed.wav", (buffer: AudioBuffer) => {
          playSound(buffer);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else {
        await wait(duration);
      }
    /*if (drum) {
      let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      if (pattern[index] === pattern[index].toUpperCase()) {
        velocity = 90;
        if (Math.random() < 0.17) {  // 1 in 6 chance
          velocity = Math.floor(Math.random() * (120 - 100 + 1) + 100);
        }
      }
      //output.sendMessage([144, drum, velocity])
      loadSoundFile(drum, (buffer: AudioBuffer) => {
        playSound(buffer);
      });
      await wait(duration)
      //output.sendMessage([128, drum, release])
    } else if (pattern[index] === '-') {
      await wait(duration);
    } */
  } 
}
  
export async function playBass(pattern: {x: number, y: number}[], groove: number[], bpm: number) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const audioContext = new AudioContext();

  function wait(time: number) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  //const output = new midi.Output();
  //output.openPort(1)

  for (let index = 0; index < pattern.length; index++) {
    let bass = pattern[index].y;
    if (bass === 97.5){
      bass = 110
    } else if (bass === 90){
      bass = 123.47
    } else if (bass === 82.5){
      bass = 130.81
    } else if (bass === 75){
      bass = 146.83
    } else if (bass === 67.5){
      bass = 164.81
    } else if (bass === 60){
      bass = 174.61
    } else if (bass === 52.5){
      bass = 196
    }
    const duration = groove[index] * beatDuration

    if (bass > 0) {
      //let velocity = Math.floor(Math.random() * (75 - 60 + 1) + 60);
      //let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

      //output.sendMessage([144, bass, velocity])
      //await wait(duration)
      //output.sendMessage([128, bass, release])
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();

      const fundamentalFreq = bass;

      const harmonics = [1.5, 2, 3]; // Additional harmonics
      const harmonicGains = [0.2, 0.1, 0.05]; // Gain values for harmonics

      osc.type = "sine"; // Use a sine waveform
      osc.frequency.value = fundamentalFreq;

      osc.connect(gainNode);
      gainNode.connect(filterNode);
      filterNode.connect(audioContext.destination);

      // Add additional harmonics
      for (let i = 0; i < harmonics.length; i++) {
        const harmonicOsc = audioContext.createOscillator();
        harmonicOsc.type = "sine";
        harmonicOsc.frequency.value = fundamentalFreq * harmonics[i];
        const harmonicGainNode = audioContext.createGain();
        harmonicGainNode.gain.value = harmonicGains[i];
        harmonicOsc.connect(harmonicGainNode);
        harmonicGainNode.connect(filterNode);
        harmonicOsc.start(audioContext.currentTime);
        harmonicOsc.stop(audioContext.currentTime + duration);
      }

      const attackTime = 0.01; // Adjust the attack time as needed
      const releaseTime = 0.2; // Adjust the release time as needed

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - releaseTime);

      filterNode.type = "lowpass"; // Apply a low-pass filter
      filterNode.frequency.value = 500; // Adjust the cutoff frequency as needed

      osc.start(audioContext.currentTime);
      await wait(duration);
      osc.stop(audioContext.currentTime + releaseTime);

      osc.disconnect();
      gainNode.disconnect();
      filterNode.disconnect();
    } else if (bass <= 0) {
      console.log(duration)
      await wait(duration);
    }
  }
}

export async function playChords(pattern: string, groove: number[], bpm: number) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 3/3; // adjust as needed

  function wait(time: number) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  //const output = new midi.Output();
  //output.openPort(2)

  for (let index = 0; index < pattern.length; index++) {
    const chord = chordTones[pattern[index]];

    const duration = groove[index] * beatDuration

    if (chord) {
      for (let i = 0; i < chord.length; i++) {
        let velocity = Math.floor(Math.random() * (75 - 60 + 1) + 60);
        //output.sendMessage([144, chord[i], velocity]);
      }
      await wait(duration);
      for (let i = 0; i < chord.length; i++) {
        let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
        //output.sendMessage([128, chord[i], release]);
      }
    } else if (pattern[index] === '-') {
      await wait(duration);
    }
  }
} 





