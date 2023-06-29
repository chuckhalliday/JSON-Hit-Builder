import DrumMachine from "./DrumMachine";

import { songVariables } from "./SongStructure/play"

function App() {
  return (
    <DrumMachine
      samples={[
        { url: "/hat-closed.wav", name: "CH" },
        { url: "/clap.wav", name: "CL" },
        { url: "/snare.wav", name: "SD" },
        { url: "/kick.wav", name: "BD" },
      ]}
    />
  );
}

export default App;
