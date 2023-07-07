import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { songVariables } from "./SongStructure/play"

function App() {
  return (
    <div>
      <div>Key of: {songVariables.key}</div>
    <BassStaff />
    <DrumMachine numOfSteps={songVariables.initDrums.length} drumGroove={songVariables.initDrums} 
                 kick={songVariables.bassDrumV} snare={songVariables.snareDrumV} 
                 hat={songVariables.hiHatV} bpm={songVariables.bpm}
    />
    </div>
  );
}

export default App;
