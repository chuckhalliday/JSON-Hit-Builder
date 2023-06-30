import React from "react";
import * as Tone from "tone";

import { songVariables } from "./SongStructure/play"

import styles from "./DrumMachine.module.scss";

console.log(songVariables)

const NOTE = "C2";

type Track = {
  id: number;
  sampler: Tone.Sampler;
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
  const seqRef = React.useRef<Tone.Sequence | null>(null);

  let bassDrumV: string;
  let snareDrumV: string;
  let hiHatV: string;

  bassDrumV = songVariables.bassDrumV.replace(/\|/g, '')
  snareDrumV = songVariables.snareDrumV.replace(/\|/g, '')
  hiHatV = songVariables.hiHatV.replace(/\|/g, '')

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

console.log(stepsRef)
  //Array of different sounds
  const trackIds = [...Array(samples.length).keys()] as const;
  //Array of beats
  const stepIds = [...Array(numOfSteps).keys()] as const;

  const handleStartClick = async () => {
    if (Tone.Transport.state === "started") {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      await Tone.start();
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Tone.Transport.bpm.value = Number(e.target.value);
    songVariables.bpm = Number(e.target.value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Tone.Destination.volume.value = Tone.gainToDb(Number(e.target.value));
  };

  React.useEffect(() => {
    tracksRef.current = samples.map((sample, i) => ({
      id: i,
      sampler: new Tone.Sampler({
        urls: {
          [NOTE]: sample.url,
        },
      }).toDestination(),
    }));
    seqRef.current = new Tone.Sequence(
      (time, step) => {
        tracksRef.current.map((trk) => {
          if (stepsRef.current[trk.id]?.[step]?.checked) {
            trk.sampler.triggerAttack(NOTE, time);
          }
          lampsRef.current[step].checked = true;
        });
      },
      [...stepIds],
      "16n"
    );
    seqRef.current.start(0);

    return () => {
      seqRef.current?.dispose();
      tracksRef.current.map((trk) => void trk.sampler.dispose());
    };
  }, [samples, numOfSteps]);

  return (
    <div className={styles.machine}>

      {/* Renders titles */}
      <div className={styles.labelList}>
        {samples.map((sample) => (
          <div>{sample.name}</div>
        ))}
      </div>


      <div className={styles.grid}>
      { /* Renders ticks */}
        <div className={styles.row}>
          {stepIds.map((stepId) => (
            <label className={styles.lamp}>
              <input
                type="radio"
                name="lamp"
                id={"lamp" + "-" + stepId}
                disabled
                ref={(elm) => {
                  if (!elm) return;
                  lampsRef.current[stepId] = elm;
                }}
                className={styles.lamp__input}
              />
              <div className={styles.lamp__content} />
            </label>
          ))}
        </div>


        {/* Renders buttons */}
        <div className={styles.cellList}>
          {trackIds.map((trackId) => (
            <div key={trackId} className={styles.row}>
              {stepIds.map((stepId) => {
                const id = trackId + "-" + stepId;
                return (
                  <label className={styles.cell}>
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
            onChange={handleVolumeChange}
            defaultValue={1}
          />
        </label>
      </div>
    </div>
  );
}
