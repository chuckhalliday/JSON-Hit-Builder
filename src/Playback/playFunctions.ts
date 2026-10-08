import { getMidiRouting, MidiTrack } from "./midiRouting";

export function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time * 1000));
}

// MIDI access is requested once and its ports looked up by name and cached,
// instead of a fresh requestMIDIAccess() round trip for every note. Which
// port a track plays to is the MIDI routing (see midiRouting.ts).
let midiAccess: Promise<WebMidi.MIDIAccess> | null = null;
const outputsByName = new Map<string, WebMidi.MIDIOutput | null>();

function access(): Promise<WebMidi.MIDIAccess> {
  if (!midiAccess) {
    midiAccess = navigator.requestMIDIAccess();
    midiAccess.then(a => {
      // Re-scan if ports are plugged in or removed.
      a.onstatechange = () => outputsByName.clear();
    }, () => { midiAccess = null; });
  }
  return midiAccess;
}

async function outputFor(name: string): Promise<WebMidi.MIDIOutput | null> {
  if (outputsByName.has(name)) return outputsByName.get(name)!;
  const found = [...(await access()).outputs.values()].find(output => output.name === name) ?? null;
  if (!found) {
    console.log(`Output device '${name}' not found.`);
  }
  outputsByName.set(name, found);
  return found;
}

// The names of the MIDI outputs this computer has now, for the routing menu.
export async function listMidiOutputs(): Promise<string[]> {
  outputsByName.clear();
  return [...(await access()).outputs.values()].map(output => output.name ?? '').filter(Boolean);
}

export async function triggerMidi(track: MidiTrack, note: number, duration: number, velocity: number, release: number) {
  try {
    const outputDevice = await outputFor(getMidiRouting()[track]);
    if (!outputDevice) return;
    outputDevice.send([0x90, note, velocity]);
    outputDevice.send([0x80, note, release], performance.now() + duration * 1000);
  } catch (error) {
    midiAccess = null;
    console.log("MIDI access request failed:", error);
  }
}
