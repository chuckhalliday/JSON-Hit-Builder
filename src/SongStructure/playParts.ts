import { tone, midiTone, chordToneMappings, chordMidiMappings } from "./tone";

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

function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time * 1000));
}

async function triggerMidi(bus: string, note: number, duration: number, velocity: number, release: number) {
  try {
    const access = await navigator.requestMIDIAccess();
    const outputs = access.outputs.values();
    let outputDevice: WebMidi.MIDIOutput | null = null;

    for (const output of outputs) {
      if (output.name === `IAC Driver Bus ${bus}`) {
        outputDevice = output;
        break;
      }
    }

    if (!outputDevice) {
      console.log("Output device 'IAC Driver Bus 1' not found.");
      return;
    }

    const startMessage = [0x90, note, velocity];
    const stopMessage = [0x80 , note, release]

    outputDevice.send(startMessage);
    await wait(duration);
    outputDevice.send(stopMessage)
  } catch (error) {
    console.log("MIDI access request failed:", error);
  }
}

export async function playBeat(midi: boolean, pattern: Array<{ index: number; checked: boolean; accent?: boolean }>, groove: number[], bpm: number, stepsRef: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[]) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const swingRatio = 3/3; // adjust as needed

  for (let index = 0; index < groove.length; index++) {
    let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    if (pattern[index].accent) {
      velocity = 90;
      if (Math.random() < 0.17) {  // 1 in 6 chance
        velocity = Math.floor(Math.random() * (120 - 100 + 1) + 100);
      }
    }
    const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    const isEvenSixteenth = index % 4 === 0 || index % 4 === 2;
    const duration = isEvenSixteenth
      ? groove[index] * beatDuration * swingRatio
      : groove[index] * beatDuration;
      if (lamps) {
        lamps[index].checked = true;
      }
      if (pattern === stepsRef[0] && pattern[index].checked) {
        if(!midi) {
          loadSoundFile("../kick.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, velocity/100);
          });
        } else {
          triggerMidi('1', 36, duration, velocity, release)
        }
        await wait(duration)
      } else if (pattern === stepsRef[1]&& pattern[index].checked) {
        if(!midi) {
          loadSoundFile("../snare.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, velocity/100);
        });
        } else {
          triggerMidi('1', 38, duration, velocity, release)
        }
        await wait(duration)
      } else if (pattern === stepsRef[5] && pattern[index].checked) {
        if(!midi){
          loadSoundFile("../hihatC.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, velocity/100);
        })
        } else {
          triggerMidi('1', 42, duration, velocity, release)
        }
        await wait(duration)
      } else if (pattern === stepsRef[6] && pattern[index].checked) {
        if(!midi){
          loadSoundFile("../hihatO.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, velocity/100);
        });
        } else {
          triggerMidi('1', 46, duration, velocity, release)
        }
        await wait(duration)
      } else if (pattern === stepsRef[8] && pattern[index].checked) {
        if(!midi){
          loadSoundFile("../crash.mp3", (buffer: AudioBuffer) => {
          playSound(buffer, velocity/100);
        });
        } else {
          triggerMidi('1', 49, duration, velocity, release)
        }
        await wait(duration)
      }else {
        await wait(duration);
      }
  } 
}

export async function playBass(midi: boolean, pattern: {x: number, y: number, acc: string}[], groove: number[], bpm: number) {
  const beatDuration = 60 / bpm // duration of one beat in seconds
  const audioContext = new AudioContext();

  let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
  const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

  //const output = new midi.Output();
  //output.openPort(1)

  for (let index = 0; index < pattern.length; index++) {
    const duration = groove[index] * beatDuration
    let bass = pattern[index].y;

    if(!midi) {

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
          } break;

        default: bass = 0

      }
        //let velocity = Math.floor(Math.random() * (75 - 60 + 1) + 60);
        //let release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

        //output.sendMessage([144, bass, velocity])
        //await wait(duration)
        //output.sendMessage([128, bass, release])
        if (bass <= 0) {
          await wait(duration);
        } else {
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
      }
      } else {
      switch (bass) {
        //E
        case 120: pattern[index].acc === 'flat' ? bass = midiTone.Eb[1] : bass = midiTone.E[1]; break
        case 67.5: pattern[index].acc === 'flat' ? bass = midiTone.Eb[2] : bass = midiTone.E[2]; break
        //F
        case 112.5: pattern[index].acc === 'sharp' ? bass = midiTone.Gb[1] : bass = midiTone.F[1]; break
        case 60: pattern[index].acc === 'sharp' ? bass = midiTone.Gb[2] : bass = midiTone.F[2]; break
        //G
        case 105: if (pattern[index].acc === 'sharp') {
            bass = midiTone.Ab[1];
          } else if (pattern[index].acc === 'flat'){
            bass = midiTone.Gb[1];
          } else {
            bass = midiTone.G[1];
          } break;
        case 52.5: if (pattern[index].acc === 'sharp') {
            bass = midiTone.Ab[2];
          } else if (pattern[index].acc === 'flat'){
            bass = midiTone.Gb[2];
          } else {
            bass = midiTone.G[2];
          } break;
        //A
        case 97.5: if (pattern[index].acc === 'sharp') {
            bass = midiTone.Bb[1];
          } else if (pattern[index].acc === 'flat'){
            bass = midiTone.Ab[1];
          } else {
            bass = midiTone.A[1];
          } break;
        case 45: if (pattern[index].acc === 'sharp') {
            bass = midiTone.Bb[2];
          } else if (pattern[index].acc === 'flat'){
            bass = midiTone.Ab[2];
          } else {
            bass = midiTone.A[2];
          } break
        //B
        case 90: pattern[index].acc === 'flat' ? bass = midiTone.Bb[1] : bass = midiTone.B[1]; break
        case 37.5: pattern[index].acc === 'flat' ? bass = midiTone.Bb[2] : bass = midiTone.B[2]; break
        //C
        case 82.5: pattern[index].acc === 'sharp' ? bass = midiTone.Db[2] : bass = midiTone.C[2]; break
        case 30: pattern[index].acc === 'sharp' ? bass = midiTone.Db[3] : bass = midiTone.C[3]; break
        //D
        case 75: if (pattern[index].acc === 'sharp') {
            bass = midiTone.Eb[2];
          } else if (pattern[index].acc === 'flat'){
            bass = midiTone.Db[2];
          } else {
            bass = midiTone.D[2];
          } break;
        default: bass = 0
        if (bass <= 0) {
          await wait(duration);
        } else {
        triggerMidi('2', bass, duration, velocity, release)
        await wait(duration) 
      }
    }
  }
}
}

export async function playChords(midi: boolean, pattern: string[], groove: number[], bpm: number) {
  const beatDuration = 60 / bpm; // duration of one beat in seconds
  const audioContext = new AudioContext();

  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();
  filterNode.type = 'lowpass'; // Adjust the filter type as needed
  filterNode.frequency.value = 1000; // Adjust the frequency as needed
  let chordTones: number[] = [];
  let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
  const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

  if (!midi) {
    for (let i = 0; i < pattern.length; i++) {
      const duration = groove[i] * beatDuration;
      if (pattern[i] === '-') {
        await wait(duration);
        continue;
      } else if (chordToneMappings.hasOwnProperty(pattern[i])) {
        const availableChordTones = chordToneMappings[pattern[i]];
        const numberOfTonesToSelect = Math.floor(Math.random() * 3) + 2; // Random number between 2 and 4
    
        const shuffledChordTones = availableChordTones.sort(() => Math.random() - 0.5);
    
        // Select the first numberOfTonesToSelect tones from the shuffled array
        chordTones = shuffledChordTones.slice(0, numberOfTonesToSelect);
      } else {
        console.log('No matching chord tone map @ chord ' + (i + 1))
      }

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

  } else {
    for (let i = 0; i < pattern.length; i++) {
      const duration = groove[i] * beatDuration;
      if (pattern[i] === '-') {
        await wait(duration);
        continue;
      } else if (chordMidiMappings.hasOwnProperty(pattern[i])) {
        const availableChordTones = chordMidiMappings[pattern[i]];
        const numberOfTonesToSelect = Math.floor(Math.random() * 3) + 2; // Random number between 2 and 4
  
        // Shuffle the availableChordTones array to ensure randomness
        const shuffledChordTones = availableChordTones.sort(() => Math.random() - 0.5);
  
        // Select the first numberOfTonesToSelect tones from the shuffled array
        chordTones = shuffledChordTones.slice(0, numberOfTonesToSelect);
        chordTones.map(note => {
          triggerMidi('3', note, duration, velocity, release)
        })
        await wait(duration)
      } else {
        console.log('No matching chord tone map @ chord ' + (i + 1))
        await wait(duration)
      }

    }
  }
}
