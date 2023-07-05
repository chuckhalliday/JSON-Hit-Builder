import React from "react";

import { songVariables } from "./SongStructure/play"

import styles from "./DrumMachine.module.scss";

console.log(songVariables)

/*
playSong(songVariables.songStructure, songVariables.bpm, songVariables.initDrums, songVariables.initBass, songVariables.initChords, 
  songVariables.chorusDrums, songVariables.chorusBass, songVariables.chorusChords, songVariables.bridgeDrums, songVariables.bridgeBass, songVariables.bridgeChords, 
  songVariables.bassDrumV, songVariables.snareDrumV, songVariables.hiHatV, songVariables.flairV, songVariables.bassV, songVariables.chordsV, 
  songVariables.bassDrumC, songVariables.snareDrumC, songVariables.hiHatC, songVariables.flairC, songVariables.bassC, songVariables.chordsC, 
  songVariables.bassDrumB, songVariables.snareDrumB, songVariables.hiHatB, songVariables.flairB, songVariables.bassB, songVariables.chordsB)
*/


const NOTE = "C2";

type Track = {
  id: number;
};

type Props = {
  samples: { url: string; name: string }[];
  numOfSteps?: number;
};

export default function DrumMachine({ samples, numOfSteps = songVariables.initDrums.length }: Props) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const tracksRef = React.useRef<Track[]>([]);
  const stepsRef = React.useRef<HTMLInputElement[][]>(Array.from({ length: 4 }, () => Array.from({ length: numOfSteps }, () => document.createElement('input'))));
  const lampsRef = React.useRef<HTMLInputElement[]>([]);

  let bassDrumV: string = songVariables.bassDrumV.replace(/\|/g, '')
  let snareDrumV: string = songVariables.snareDrumV.replace(/\|/g, '')
  let hiHatV: string = songVariables.hiHatV.replace(/\|/g, '')

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

  for (let i = 0; i < bassDrumV.length; i ++){
    if (bassDrumV.charAt(i) === 'x' || bassDrumV.charAt(i) === 'X'){
      const inputElement = stepsRef.current[3][i] as HTMLInputElement;
      inputElement.checked = true;
    }
  }

  for (let i = 0; i < snareDrumV.length; i ++){
    if (snareDrumV.charAt(i) === 'y' || bassDrumV.charAt(i) === 'Y'){
      const inputElement = stepsRef.current[2][i] as HTMLInputElement;
      inputElement.checked = true;
    }
  }

  for (let i = 0; i < hiHatV.length; i ++){
    if (hiHatV.charAt(i) === 'v' || hiHatV.charAt(i) === 'w' || hiHatV.charAt(i) === 'V' || hiHatV.charAt(i) === 'W'){
      const inputElement = stepsRef.current[0][i] as HTMLInputElement;
      inputElement.checked = true;
    }
  }

  //Array of different sounds
  const trackIds = [...Array(samples.length).keys()] as const;
  //Array of beats
  const stepIds = [...Array(numOfSteps).keys()] as const;

  async function playBeat(pattern: HTMLInputElement[], groove: number[], bpm: number, lamps?: HTMLInputElement[]) {
    const beatDuration = 60 / bpm // duration of one beat in seconds
    const swingRatio = 3/3; // adjust as needed
  
    function wait(time: number) {
      return new Promise(resolve => setTimeout(resolve, time * 1000));
    }
    //const output = new midi.Output();
    //output.openPort(0)
  
    for (let index = 0; index < numOfSteps; index++) {
      const release = Math.floor(Math.random() * (70 - 50 + 1) + 50);
      const isEvenSixteenth = index % 4 === 0 || index % 4 === 2;
      const duration = isEvenSixteenth
        ? groove[index] * beatDuration * swingRatio
        : groove[index] * beatDuration;
        if (lamps) {
          lamps[index].checked = true;
        }
      if (pattern === stepsRef.current[3] && pattern[index].checked) {
        loadSoundFile("/kick.wav", (buffer: AudioBuffer) => {
          playSound(buffer);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern === stepsRef.current[2] && pattern[index].checked) {
        loadSoundFile("/snare.wav", (buffer: AudioBuffer) => {
          playSound(buffer);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else if (pattern === stepsRef.current[0] && pattern[index].checked) {
        loadSoundFile("/hat-closed.wav", (buffer: AudioBuffer) => {
          playSound(buffer);
        });
        await wait(duration)
        //output.sendMessage([128, drum, release])
      } else {
        await wait(duration);
      }
    }
  }

  let stopFlag = false
  
  const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopFlag = true; // Set the stop flag to true
    } else {
      stopFlag = false; // Set the stop flag to false
      playVerse(songVariables.bpm, songVariables.initDrums, stepsRef.current[3], stepsRef.current[2], stepsRef.current[0], lampsRef.current);
      setIsPlaying(true);
    }
  };

  async function playVerse(bpm: number, initDrums: number[], bassDrumV: HTMLInputElement[], snareDrumV: HTMLInputElement[], hiHatV: HTMLInputElement[], lamps?: HTMLInputElement[]) {
    while (!stopFlag) {
      if (stopFlag) {
        break
      } else {
      await Promise.all([
        playBeat(bassDrumV, initDrums, bpm, lamps),
        playBeat(snareDrumV, initDrums, bpm),
        playBeat(hiHatV, initDrums, bpm),
      ])
      }
    }
  }


  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    songVariables.bpm = Number(e.target.value);
  };

 /* const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Tone.Destination.volume.value = Tone.gainToDb(Number(e.target.value));
  }; */

  function addSpacingToRows(step: number) {
      let sum = 0;
      let measure
      let beat
  
      for (let i = 0; i < step; i++) {
        sum += songVariables.initDrums[i];
        }
        if (sum >= 7.92 && sum <= 8.08 || sum >= 15.92 && sum <= 16.08 || sum >= 23.92 && sum <= 24.08) {
          measure = 'true'
        } else if (Math.abs(sum - Math.round(sum)) <= 0.005) {
          beat = 'true'
        } else {
          measure = 'false'
          beat = 'false'
        }
        return {
          measure: measure,
          beat: beat
        }
      }
  
  return (
    <div className={styles.machine}>
      <div className={styles.labelList}></div>
      <div>Key of: {songVariables.key}</div>
      {/* Renders titles */}
      <div className={styles.labelList}>
        {samples.map((sample) => (
          <div>{sample.name}</div>
        ))}
      </div>
  
      <div className={styles.grid}>
        {/* Renders ticks */}
        <div className={styles.row}>
          {stepIds.map((stepId) => {
            const measure = addSpacingToRows(stepId + 1).measure
            const beat = addSpacingToRows(stepId + 1).beat
            return(
            <label className={styles.lamp} measure-end={measure} beat-end={beat}>
              <label className={styles.grooveLabel}>
                {songVariables.initDrums[stepId]}
              </label>
              <input
                type="radio"
                name="lamp"
                id={'lamp' + '-' + stepId}
                disabled
                ref={(elm) => {
                  if (!elm) return;
                  lampsRef.current[stepId] = elm;
                }}
                className={styles.lamp__input}
              />
              <div className={styles.lamp__content} />
            </label>
            )
          })}
        </div>
  
        {/* Renders buttons */}
        <div className={styles.cellList}>
          {trackIds.map((trackId) => (
            <div key={trackId} className={styles.row}>
              {stepIds.map((stepId) => {
                const id = trackId + '-' + stepId;
                const measure = addSpacingToRows(stepId + 1).measure
                const beat = addSpacingToRows(stepId + 1).beat
                return (
                  <label className={styles.cell} key={id} measure-end={measure} beat-end={beat}>
                    <input
                      key={id}
                      id={id}
                      type="checkbox"
                      ref={(elm) => {
                        if (!elm) return;
                        if (!stepsRef.current[trackId]) {
                          stepsRef.current[trackId] = [];
                        }
                        stepsRef.current[trackId][stepId] = elm;
                      }}
                      className={styles.cell__input}
                    />
                    <div className={styles.cell__content} />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.labelList}></div>
      <div>{songVariables.hiHatV}</div>
      <div className={styles.labelList}></div>
      <div>{songVariables.snareDrumV}</div>
      <div className={styles.labelList}></div>
      <div>{songVariables.bassDrumV}</div>
      
      {/* Renders controls */}
      <div className={styles.controls}>
        <button onClick={handleStartClick} className={styles.button}>
          {isPlaying ? "Pause" : "Start"}
        </button>
        <label className={styles.fader}>
          <span>BPM:{songVariables.bpm}</span>
          <input
            type="range"
            min={90}
            max={150}
            step={1}
            onChange={handleBpmChange}
            defaultValue={songVariables.bpm}
          />
        </label>
        <label className={styles.fader}>
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
          //  onChange={handleVolumeChange} 
            defaultValue={1}
          />
        </label>
      </div>
    </div>
  );
}
