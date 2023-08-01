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
function playSound(buffer: AudioBuffer, volume: number = 1.0) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create a gain node and set the volume (0.0 to 1.0)
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  // Connect the nodes: source -> gain -> destination (speakers)
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play the sound
  source.start();
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
      if (pattern === stepsRef[0] && pattern[index].checked) {
        loadSoundFile("../kick.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, 0.7);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern === stepsRef[1]&& pattern[index].checked) {
        loadSoundFile("../snare.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, 0.4);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern === stepsRef[5] && pattern[index].checked) {
        loadSoundFile("../hihatC.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, 0.4);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern === stepsRef[6] && pattern[index].checked) {
        loadSoundFile("../hihatO.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, 0.5);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern === stepsRef[8] && pattern[index].checked) {
        loadSoundFile("../crash.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, 0.5);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      }else {
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

export async function playBass(pattern: {x: number, y: number, acc: string}[], groove: number[], bpm: number) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const audioContext = new AudioContext();

  function wait(time: number) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
  }
  //const output = new midi.Output();
  //output.openPort(1)

  for (let index = 0; index < pattern.length; index++) {
    let bass = pattern[index].y;
    switch (bass) {
      case 97.5: if (pattern[index].acc === 'sharp') {
        bass = tone.Bb[1];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Ab[1];
      } else {
        bass = tone.A[1];
      }
      break;
      case 90: if (pattern[index].acc === 'flat'){
        bass = tone.Bb[1];
      } else {
        bass = tone.B[1];
      }
        break;
      case 82.5: if (pattern[index].acc === 'sharp') {
        bass = tone.Db[2];
      } else { 
        bass = tone.C[2];
      }
        break;
      case 75: if (pattern[index].acc === 'sharp') {
        bass = tone.Eb[2];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Db[2];
      } else {
        bass = tone.D[2];
      }
        break; 
      case 67.5: if (pattern[index].acc === 'flat'){
        bass = tone.Eb[2];
      } else {
        bass = tone.E[2];
      }
        break;
      case 60: if (pattern[index].acc === 'sharp') {
        bass = tone.Gb[2];
      } else { 
        bass = tone.F[2];
      }
        break;
      case 52.5: if (pattern[index].acc === 'sharp') {
        bass = tone.Ab[2];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Gb[2];
      } else {
        bass = tone.G[2];
      }
        break;
      default:
        break;
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

      osc.type = "sawtooth"; // Use a sine waveform
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
      const releaseTime = 0.05; // Adjust the release time as needed

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - releaseTime);

      filterNode.type = "lowpass"; // Apply a low-pass filter
      filterNode.frequency.value = 800; // Adjust the cutoff frequency as needed

      const distortion = audioContext.createWaveShaper();
      const distortionAmount = 30; // Adjust distortion amount as needed
      const curve = new Float32Array(65536);
      for (let i = 0; i < 65536; i++) {
        const x = (i - 32768) / 32768;
        curve[i] = Math.tanh(x * distortionAmount);
      }
      distortion.curve = curve;
      gainNode.connect(distortion);
      distortion.connect(filterNode);

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





