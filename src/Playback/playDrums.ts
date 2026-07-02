import { triggerMidi } from "./playFunctions";
import { getAudioContext } from "./audioContext";
import { runPreScheduledSequence, scheduleTimer, Register } from "./scheduler";

const sampleCache = new Map<string, AudioBuffer>();
const pendingLoads = new Map<string, Promise<AudioBuffer>>();

function loadBuffer(url: string): Promise<AudioBuffer> {
    const cached = sampleCache.get(url);
    if (cached) {
      return Promise.resolve(cached);
    }
    let pending = pendingLoads.get(url);
    if (!pending) {
      const audioContext = getAudioContext();
      pending = new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
          audioContext.decodeAudioData(request.response, (buffer: AudioBuffer) => {
            sampleCache.set(url, buffer);
            resolve(buffer);
          }, reject);
        };
        request.onerror = () => reject(new Error(`Failed to load ${url}`));

        request.send();
      });
      pendingLoads.set(url, pending);
    }
    return pending;
  }

export function loadSoundFile(url: string, callback: (buffer: AudioBuffer) => void) {
    loadBuffer(url).then(callback);
  }

export function playDrumSample(buffer: AudioBuffer, volume: number = 1.0 /*set the volume 0.0 - 1.0*/, time?: number): AudioBufferSourceNode {
    const audioContext = getAudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    // Connect the nodes: source -> gain -> destination (speakers)
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play the sound at the scheduled audio-clock time (falls back to "now")
    source.start(time ?? audioContext.currentTime);
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
    return source;
  }

const SAMPLE_URLS: Record<number, string> = {
  0: "../kick.mp3",
  1: "../snare.mp3",
  5: "../hihatC.mp3",
  6: "../hihatO.mp3",
  8: "../crash.mp3",
};

const MIDI_NOTES: Record<number, number> = {
  0: 36, 1: 38, 5: 42, 6: 46, 8: 49,
};

export default function playBeat(midi: boolean, beat: number, pattern: Array<{ index: number; checked: boolean; accent?: boolean }>, groove: number[], bpm: number, stepsRef: Array<Array<{ index: number; checked: boolean }>>, lamps?: HTMLInputElement[], shouldStop?: () => boolean, mute?: boolean) {
    const beatDuration = 60 / bpm // duration of one beat in seconds
    const swingRatio = 3/3; // adjust as needed

    let voice = -1;
    for (let v = 0; v < stepsRef.length; v++) {
      if (stepsRef[v] === pattern) { voice = v; break; }
    }
    const sampleUrl = SAMPLE_URLS[voice];
    const midiNote = MIDI_NOTES[voice];

    const getDuration = (index: number) => {
      const isEvenSixteenth = index % 4 === 0 || index % 4 === 2;
      return isEvenSixteenth
        ? groove[index] * beatDuration * swingRatio
        : groove[index] * beatDuration;
    };

    const onSchedule = (index: number, time: number, duration: number, register: Register, isCancelled: () => boolean) => {
      let velocity = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      if (pattern[index].accent) {
        velocity = 90;
        if (Math.random() < 0.17) {  // 1 in 6 chance
          velocity = Math.floor(Math.random() * (120 - 100 + 1) + 100);
        }
      }
      const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);

      if (lamps) {
        scheduleTimer(time, () => {
          lamps[index].checked = true;
          lamps[index].dispatchEvent(new Event('change', { bubbles: true }));
        }, register);
      }

      if (sampleUrl === undefined || !pattern[index].checked || mute) return;

      if (!midi) {
        loadSoundFile(sampleUrl, (buffer: AudioBuffer) => {
          if (isCancelled()) return;
          const source = playDrumSample(buffer, velocity / 100, time);
          register(() => { try { source.stop(); } catch { /* already stopped */ } });
        });
      } else {
        scheduleTimer(time, () => triggerMidi('1', midiNote, duration, velocity, release), register);
      }
    };

    return runPreScheduledSequence(beat, groove.length, getDuration, onSchedule, shouldStop);
  }