import { ReactNode, useCallback, useEffect, useState } from "react";
import { defaultPreset, MIDI_TRACKS, MidiPreset, PRESETS, presetOf, presetRouting, setMidiRouting, useMidiRouting } from "../Playback/midiRouting";
import { listMidiOutputs } from "../Playback/playFunctions";
import styles from "../Styles/App.module.scss";

const HELP: Record<MidiPreset, ReactNode> = {
  mac: 'Turn on the IAC Driver in Audio MIDI Setup (Window › Show MIDI Studio) and give it Bus 1, Bus 2 and Bus 3 - one per track. In your DAW, arm a track on each bus.',
  windows: 'Windows has no built-in virtual MIDI. Install loopMIDI and add three ports named loopMIDI Port 1, 2 and 3 - or pick any detected port above. In your DAW, arm a track on each port.',
  linux: <>Load ALSA's virtual MIDI ports with <code>sudo modprobe snd-virmidi midi_devs=3</code> (list <code>snd-virmidi</code> in <code>/etc/modules-load.d</code> to keep them), then Rescan and pick this preset again: it takes the VirMIDI ports in order. In your DAW, arm a track on each.</>,
};

// Which MIDI output each track plays to, opened from the MIDI source button.
export default function MidiRoutingMenu() {
  const routing = useMidiRouting();
  // null while scanning.
  const [outputs, setOutputs] = useState<string[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const scan = useCallback(() => {
    setProblem(null);
    if (!('requestMIDIAccess' in navigator)) {
      setProblem("This browser can't send MIDI. Chrome and Edge can.");
      setOutputs([]);
      return;
    }
    setOutputs(null);
    listMidiOutputs().then(setOutputs, () => {
      setProblem('MIDI access was blocked. Allow it in the site settings, then rescan.');
      setOutputs([]);
    });
  }, []);
  useEffect(scan, [scan]);

  const preset = presetOf(routing);
  const system = defaultPreset(navigator.platform || navigator.userAgent);

  return (
    <div className={`${styles.partMenu} ${styles.midiMenu}`} role="dialog" aria-label="MIDI outputs">
      <div className={styles.partMenuTitle}>MIDI outputs</div>
      {MIDI_TRACKS.map(({ id, label }) => {
        const name = routing[id];
        const found = !!outputs?.includes(name);
        return (
          <label key={id} className={styles.midiRow}>
            <span
              className={`${styles.midiDot} ${outputs === null ? '' : found ? styles.midiDotOn : styles.midiDotOff}`}
              title={outputs === null ? 'Looking…' : found ? 'Connected' : 'Not found on this computer'}
            />
            <span className={styles.midiTrack}>{label}</span>
            <select value={name} onChange={(e) => setMidiRouting({ ...routing, [id]: e.target.value })}>
              {!found && <option value={name}>{name}{outputs === null ? '' : ' (not found)'}</option>}
              {outputs?.map((output) => <option key={output} value={output}>{output}</option>)}
            </select>
          </label>
        );
      })}
      {outputs !== null && outputs.length === 0 && !problem && (
        <p className={styles.midiNote}>No MIDI outputs found.</p>
      )}
      {problem && <p className={`${styles.midiNote} ${styles.midiProblem}`}>{problem}</p>}
      <div className={styles.menuDivider} role="separator" />
      <div className={styles.menuThemeRow}>
        <span id="midi-preset-label">Ports</span>
        <div className={styles.segmented} role="group" aria-labelledby="midi-preset-label">
          {(Object.keys(PRESETS) as MidiPreset[]).map((p) => (
            <button
              key={p}
              className={preset === p ? styles.segmentOn : ''}
              aria-pressed={preset === p}
              onClick={() => setMidiRouting(presetRouting(p, outputs ?? []))}
              title={PRESETS[p].match ? 'Use the VirMIDI ports found, in order' : `Send ${MIDI_TRACKS.map(({ id }) => PRESETS[p].routing[id]).join(', ')}`}
            >
              {PRESETS[p].label}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.midiNote}>{HELP[preset ?? system]}</p>
      <button onClick={scan} disabled={outputs === null}>
        {outputs === null ? 'Looking for outputs…' : 'Rescan outputs'}
      </button>
    </div>
  );
}
