import DrumMachine from "./DrumMachine";
import BassStaff from "./BassStaff";
import { songVariables } from "./SongStructure/play"

function App() {
  return (
    <div>
    <BassStaff />
    <DrumMachine
      samples={[
        { url: "/hat-closed.wav", name: "CH" },
        { url: "/clap.wav", name: "CL" },
        { url: "/snare.wav", name: "SD" },
        { url: "/kick.wav", name: "BD" },
      ]}
    />
    </div>
  );
}

export default App;
