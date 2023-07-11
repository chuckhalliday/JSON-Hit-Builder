import { useState } from 'react'
import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { songVariables } from "./SongStructure/play"

import styles from "./App.module.scss"

const songStructure = songVariables.songStructure


function App() {
  const [openedParts, setOpenedParts] = useState<{ [key: string]: boolean }>({});

  const handlePartOpen = (key: string) => {
    setOpenedParts((prevState) => ({
      ...prevState,
      [key]: !prevState[key]
    }));
  };

  const [renderWidth, setRenderWidth] = useState(0);

  console.log(renderWidth)

  const handleRenderWidthChange = (width: number) => {
    setRenderWidth(width);
  };

  return (
    <div className={styles.rowContainer}>
      <div className={styles.key}>Key of : {songVariables.key}</div>
      {songStructure.map((songProps, index) => {
        const songParts = [];
        for (let i = 0; i < songProps.repeat; i++) {
          const key = `${index}_${i}`;
          const isOpen = openedParts[key];

          songParts.push(
            <div key={key} className={styles.button}>
              <button onClick={() => handlePartOpen(key)}>
                {songProps.type.charAt(0)}
              </button>
              {isOpen && (
                <div className={styles.openedPart}>
                  <h3>{songProps.type} ({i + 1})</h3>
                  <BassStaff renderWidth={renderWidth}/>
                  <DrumMachine
                    onRenderWidthChange={handleRenderWidthChange}
                    numOfSteps={songProps.drumGroove.length}
                    drumGroove={songProps.drumGroove}
                    kick={songProps.kick}
                    snare={songProps.snare}
                    hat={songProps.hiHat}
                    bpm={songVariables.bpm}
                  />
                </div>
              )}
            </div>
          );
        }
        return songParts;
      })}
    </div>
  );
}

export default App;
