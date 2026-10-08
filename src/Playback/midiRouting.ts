import { useSyncExternalStore } from 'react';

// Which MIDI output each track plays to. A setting of this computer, not of
// a song: kept in the browser and shared by every song.
//
// macOS has virtual buses built in (the IAC Driver, enabled in Audio MIDI
// Setup); Windows has none, and loopMIDI is the usual stand-in - its ports
// show up under whatever names they're given. Linux has ALSA's snd-virmidi
// module, whose ports are named after the sound card number it lands on
// (VirMIDI 3-0, 3-1...), which differs between machines - so that preset
// takes whichever VirMIDI ports are there. The presets give one bus or port
// per track; any detected output can be picked instead.
export type MidiTrack = 'drums' | 'bass' | 'chords';
export type MidiRouting = Record<MidiTrack, string>;
export type MidiPreset = 'mac' | 'windows' | 'linux';

export const MIDI_TRACKS: Array<{ id: MidiTrack, label: string }> = [
  { id: 'drums', label: 'Drums' },
  { id: 'bass', label: 'Bass' },
  { id: 'chords', label: 'Chords' },
];

// `match` marks presets whose port names vary: detected outputs matching
// it are used in order, and `routing` names the ports when none are found.
export const PRESETS: Record<MidiPreset, { label: string, routing: MidiRouting, match?: RegExp }> = {
  mac: {
    label: 'Mac · IAC Driver',
    routing: { drums: 'IAC Driver Bus 1', bass: 'IAC Driver Bus 2', chords: 'IAC Driver Bus 3' },
  },
  windows: {
    label: 'Windows · loopMIDI',
    routing: { drums: 'loopMIDI Port 1', bass: 'loopMIDI Port 2', chords: 'loopMIDI Port 3' },
  },
  linux: {
    label: 'Linux · VirMIDI',
    routing: { drums: 'VirMIDI 1-0', bass: 'VirMIDI 1-1', chords: 'VirMIDI 1-2' },
    match: /VirMIDI|Virtual Raw MIDI/i,
  },
};

// The preset for the system the browser reports.
export const defaultPreset = (platform: string): MidiPreset =>
  /win/i.test(platform) ? 'windows' : /mac/i.test(platform) ? 'mac' : /linux|x11/i.test(platform) ? 'linux' : 'mac';

// A preset's routing on this computer: for one whose names vary, the
// matching outputs detected, in order (a track without one keeps the
// preset's name, and shows as not found).
export function presetRouting(preset: MidiPreset, outputs: string[]): MidiRouting {
  const { routing, match } = PRESETS[preset];
  if (!match) return { ...routing };
  const found = outputs.filter(name => match.test(name)).sort();
  return Object.fromEntries(MIDI_TRACKS.map(({ id }, i) => [id, found[i] ?? routing[id]])) as MidiRouting;
}

// Which preset a routing is, if it's exactly one: its names, or for one whose
// names vary, three different ports matching it.
export const presetOf = (routing: MidiRouting): MidiPreset | null =>
  (Object.keys(PRESETS) as MidiPreset[]).find(p => {
    const { match } = PRESETS[p];
    const names = MIDI_TRACKS.map(({ id }) => routing[id]);
    return match
      ? names.every(name => match.test(name)) && new Set(names).size === names.length
      : MIDI_TRACKS.every(({ id }) => PRESETS[p].routing[id] === routing[id]);
  }) ?? null;

const STORAGE_KEY = 'midiRouting';
const listeners = new Set<() => void>();

function load(): MidiRouting {
  const fallback = PRESETS[defaultPreset(typeof navigator !== 'undefined' ? navigator.platform || navigator.userAgent : '')].routing;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (stored && MIDI_TRACKS.every(({ id }) => typeof stored[id] === 'string')) return stored;
  } catch { /* unreadable or unavailable: use the preset */ }
  return { ...fallback };
}

let routing: MidiRouting | null = null;

export function getMidiRouting(): MidiRouting {
  routing = routing ?? load();
  return routing;
}

export function setMidiRouting(next: MidiRouting) {
  routing = { ...next };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routing));
  } catch { /* still applies for this visit */ }
  listeners.forEach(l => l());
}

export function useMidiRouting(): MidiRouting {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getMidiRouting,
  );
}
