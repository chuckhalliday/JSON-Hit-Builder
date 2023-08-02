import React from 'react';

import styles from "./Piano.module.scss"

interface PianoProps {

}

const generatePianoKeys = () => {
    const whiteKeys = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
    const numberOfKeys = 25;
    const keys = [];
  
    for (let i = 0; i < numberOfKeys; i++) {
      if (whiteKeys.includes(i)) {
        keys.push(<div key={i} className={styles.pianoKeys}></div>);
      } else if (i >= 1 && i <= 22 && !whiteKeys.includes(i)) {
        keys.push(<div key={i} className={styles.pianoKeysBlack}></div>);
      }
    }
  
    return keys;
  };

export default function Piano() {
  // Generate the array of piano keys
  const pianoKeys = generatePianoKeys();

  return (
    <div className={styles.piano}>
      {pianoKeys}
    </div>
  );
}



