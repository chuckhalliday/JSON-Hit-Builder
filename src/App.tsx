import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { songVariables } from "./SongStructure/play"

const songStructure = songVariables.songStructure

function App() {
  return (
    <div>
      <div>Key of: {songVariables.key}</div>
      {songStructure.map((songProps, index) => {
        const songParts = [];
        for (let i = 0; i < songProps.repeat; i++) {
          songParts.push(
            <div>
            <h3>{songProps.type}</h3>
            <BassStaff />
            <DrumMachine
              key={`${index}_${i}`} // Assign a unique key for each DrumMachine component
              numOfSteps={songProps.drumGroove.length}
              drumGroove={songProps.drumGroove}
              kick={songProps.kick}
              snare={songProps.snare}
              hat={songProps.hiHat}
              bpm={songVariables.bpm}
            />
            </div>
          );
        }
        return songParts;
      })}
    </div>
  );
}

export default App;
