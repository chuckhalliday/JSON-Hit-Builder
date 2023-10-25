import { triggerMidi, wait } from "./playFunctions";

const audioContext = new AudioContext();

export function loadSoundFile(url: string, callback: (buffer: AudioBuffer) => void) {
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

export function playSound(buffer: AudioBuffer, volume: number = 1.0 /*set the volume 0.0 - 1.0*/) {
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

export default async function playBeat(midi: boolean, beat: number, pattern: Array<{ index: number; checked: boolean; accent?: boolean }>, groove: number[], bpm: number, stepsRef: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[]) {
    const beatDuration = 60 / bpm // duration of one beat in seconds
    const swingRatio = 3/3; // adjust as needed
  
    for (let index = beat; index < groove.length; index++) {
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