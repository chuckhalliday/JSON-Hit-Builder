//import midi from 'midi';
import { tone, chordToneMappings } from "./chords";

let midi: WebMidi.MIDIAccess; // global MIDIAccess object

function listInputsAndOutputs(midiAccess: WebMidi.MIDIAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;
  console.log(midiAccess)
  for (const entry of midiAccess.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`,
    );
  }

  for (const entry of midiAccess.outputs) {
    const output = entry[1];
    console.log(output)
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
}

function onMIDIFailure(msg: string) {
  console.error(`Failed to get MIDI access - ${msg}`);
}

navigator.requestMIDIAccess().then(listInputsAndOutputs, onMIDIFailure)

navigator.requestMIDIAccess()
.then(function(access) {
  // Get the outputs
  var outputs = access.outputs.values();
  
  // Find the desired output device (IAC driver 1)
  var outputDevice: WebMidi.MIDIOutput | null = null;
  for (var output of outputs) {
    if (output.name === 'IAC Driver Bus 1') {
      outputDevice = output;
      break;
    }
  }
  
  // Check if the output device was found
  if (!outputDevice) {
    console.log("Output device 'IAC Driver 1' not found.");
    return;
  }
  
  // Create MIDI message
  var channel = 0; // MIDI channels are 0-based, so 35 represents channel 36
  var note = 36; // MIDI note number (C4)
  var velocity = 100; // Velocity (0-127)
  
  var message = [0x90 + channel, note, velocity]; // Note On message
  
  // Send the MIDI message
  outputDevice.send(message);
  
  // You can also use a timeout to send a Note Off message after some time
})
.catch(function(error) {
  console.log("MIDI access request failed:", error);
});

const audioContext = new AudioContext();

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


function playSound(buffer: AudioBuffer, volume: number = 1.0 /*set the volume 0.0 - 1.0*/) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  // Connect the nodes: source -> gain -> destination (speakers)
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play the sound
  source.start();
}


//midi
const drumHits: Record<string, any> = {
    'x': 36, 'X': 36,  // kick drum
    'y': 40, 'Y': 40,  // snare drum
    'v': 42, 'V': 42,  // closed hi-hat
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

function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time * 1000));
}

export async function playBeat(pattern: Array<{ index: number; checked: boolean }>, groove: number[], bpm: number, stepsRef: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[]) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 3/3; // adjust as needed

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

  //const output = new midi.Output();
  //output.openPort(1)

  for (let index = 0; index < pattern.length; index++) {
    let bass = pattern[index].y;
    switch (bass) {
      //E
      case 120: pattern[index].acc === 'flat' ? bass = tone.Eb[1] : bass = tone.E[1]; break
      case 67.5: pattern[index].acc === 'flat' ? bass = tone.Eb[2] : bass = tone.E[2]; break
      //F
      case 112.5: pattern[index].acc === 'sharp' ? bass = tone.Gb[1] : bass = tone.F[1]; break
      case 60: pattern[index].acc === 'sharp' ? bass = tone.Gb[2] : bass = tone.F[2]; break
      //G
      case 105: if (pattern[index].acc === 'sharp') {
        bass = tone.Ab[1];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Gb[1];
      } else {
        bass = tone.G[1];
      } break;
      case 52.5: if (pattern[index].acc === 'sharp') {
        bass = tone.Ab[2];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Gb[2];
      } else {
        bass = tone.G[2];
      } break;
      //A
      case 97.5: if (pattern[index].acc === 'sharp') {
        bass = tone.Bb[1];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Ab[1];
      } else {
        bass = tone.A[1];
      } break;
      case 45: if (pattern[index].acc === 'sharp') {
        bass = tone.Bb[2];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Ab[2];
      } else {
        bass = tone.A[2];
      } break
      //B
      case 90: pattern[index].acc === 'flat' ? bass = tone.Bb[1] : bass = tone.B[1]; break
      case 37.5: pattern[index].acc === 'flat' ? bass = tone.Bb[2] : bass = tone.B[2]; break
      //C
      case 82.5: pattern[index].acc === 'sharp' ? bass = tone.Db[2] : bass = tone.C[2]; break
      case 30: pattern[index].acc === 'sharp' ? bass = tone.Db[3] : bass = tone.C[3]; break
      //D
      case 75: if (pattern[index].acc === 'sharp') {
        bass = tone.Eb[2];
      } else if (pattern[index].acc === 'flat'){
        bass = tone.Db[2];
      } else {
        bass = tone.D[2];
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

export async function playChords(pattern: string[], groove: number[], bpm: number) {
  const beatDuration = 60 / bpm; // duration of one beat in seconds
  const audioContext = new AudioContext();

  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();
  filterNode.type = 'lowpass'; // Adjust the filter type as needed
  filterNode.frequency.value = 1000; // Adjust the frequency as needed

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '-') {
      await wait(groove[i] * beatDuration);
      continue;
    }

    let chordTones: number[] = [];
    if (chordToneMappings.hasOwnProperty(pattern[i])) {
      const availableChordTones = chordToneMappings[pattern[i]];
      const numberOfTonesToSelect = Math.floor(Math.random() * 3) + 2; // Random number between 2 and 4
    
      // Shuffle the availableChordTones array to ensure randomness
      const shuffledChordTones = availableChordTones.sort(() => Math.random() - 0.5);
    
      // Select the first numberOfTonesToSelect tones from the shuffled array
      chordTones = shuffledChordTones.slice(0, numberOfTonesToSelect);
    } else {
      console.log('No matching chord tone map @ chord ' + (i + 1))
    }

    const duration = groove[i] * beatDuration;

    const oscillators = chordTones.map(tone => {
      const osc = audioContext.createOscillator();
      osc.frequency.value = tone;
      osc.type = 'sawtooth';
      return osc;
    });

    const now = audioContext.currentTime;

    oscillators.forEach(osc => {
      const envelope = audioContext.createGain();
      osc.connect(envelope);
      envelope.connect(gainNode);
      gainNode.connect(filterNode);
      filterNode.connect(audioContext.destination);

      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.6, now + 0.02); // Attack
      envelope.gain.linearRampToValueAtTime(0.4, now + 0.04); // Decay
    });

    oscillators.forEach(osc => {
      osc.start(now);
    })

    await wait(duration);

    oscillators.forEach(osc => {
      const releaseTime = audioContext.currentTime + 0.1; // Adjust the release time as needed
      osc.stop(releaseTime);
    });
  }

  // Disconnect nodes and close the context
  gainNode.disconnect();
  filterNode.disconnect();
  audioContext.close();
}




