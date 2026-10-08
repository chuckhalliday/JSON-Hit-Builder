import React, { useEffect, useRef, useState } from 'react'
import styles from "../Styles/App.module.scss"
import { setThemePref, ThemePref, useThemePref } from '../theme'
import MidiRoutingMenu from './MidiRoutingMenu'

export type SoundSource = 'synth' | 'acoustic' | 'midi';
export type Track = 'chords' | 'bass' | 'drums' | 'melody';

const BPM_MIN = 90;
const BPM_MAX = 150;
// Pixels of vertical drag per BPM step.
const DRAG_PX_PER_BPM = 4;

const clampBpm = (v: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v)));

// Tempo as a number you drag (up/down), scroll, step with the arrow keys or
// the ▴▾ buttons, or double-click to type - the way a DAW's tempo field works.
function BpmControl({ bpm, onChange }: { bpm: number, onChange: (bpm: number) => void }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number, from: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const set = (v: number) => { const next = clampBpm(v); if (next !== bpm) onChange(next); };
  const setRef = useRef(set);
  setRef.current = set;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  // Wheel needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setRef.current(bpmRef.current + (e.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [editing]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(bpm + step);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(bpm - step);
    else if (e.key === 'PageUp') set(bpm + 10);
    else if (e.key === 'PageDown') set(bpm - 10);
    else if (e.key === 'Home') set(BPM_MIN);
    else if (e.key === 'End') set(BPM_MAX);
    else if (e.key === 'Enter') setEditing(true);
    else return;
    e.preventDefault();
  };

  const commit = (text: string) => {
    const v = parseInt(text, 10);
    if (!Number.isNaN(v)) set(v);
    setEditing(false);
  };

  return (
    <div className={styles.bpmControl}>
      {editing ? (
        <input
          className={styles.bpmInput}
          type="number"
          min={BPM_MIN}
          max={BPM_MAX}
          defaultValue={bpm}
          autoFocus
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget.value);
            else if (e.key === 'Escape') setEditing(false);
          }}
          aria-label="Tempo in BPM"
        />
      ) : (
        <div
          ref={fieldRef}
          className={styles.bpmField}
          role="spinbutton"
          tabIndex={0}
          aria-label="Tempo"
          aria-valuemin={BPM_MIN}
          aria-valuemax={BPM_MAX}
          aria-valuenow={bpm}
          aria-valuetext={`${bpm} BPM`}
          title="Drag up/down, scroll, or use the arrow keys (Shift for ×10). Double-click to type."
          onKeyDown={onKeyDown}
          onDoubleClick={() => setEditing(true)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { y: e.clientY, from: bpm };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            set(drag.current.from + (drag.current.y - e.clientY) / DRAG_PX_PER_BPM);
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          <span className={styles.bpmValue}>{bpm}</span>
          <span className={styles.bpmUnit}>BPM</span>
        </div>
      )}
      <div className={styles.bpmSteppers}>
        <button onClick={() => set(bpm + 1)} disabled={bpm >= BPM_MAX} aria-label="Faster" tabIndex={-1}>▴</button>
        <button onClick={() => set(bpm - 1)} disabled={bpm <= BPM_MIN} aria-label="Slower" tabIndex={-1}>▾</button>
      </div>
    </div>
  );
}

interface TransportProps {
  songKey: string;
  onKeyClick: () => void;
  source: SoundSource;
  onSourceChange: (source: SoundSource) => void;
  isPlaying: boolean;
  onPlay: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  tracks: Record<Track, boolean>;
  onToggleTrack: (track: Track) => void;
  // The melody's toggle shows once the song has one.
  hasMelody: boolean;
  loopOn: boolean;
  hasLoop: boolean;
  onToggleLoop: () => void;
  loopPick: 'start' | 'end' | null;
  onArmLoopPick: (which: 'start' | 'end') => void;
  loopReadout: string;
  hasSong: boolean;
  onSave: () => void;
  onSounds: () => void;
  onExport: () => void;
  onLogout: () => void;
  // Song tabs, for users who have them. On phones they collapse into a
  // picker beside the source switch instead of their own row under the bar.
  songTabs?: { count: number, current: number, onSwitch: (index: number) => void };
}

// Closes a popup on a press outside `wrapRef` or on Escape.
function useDismiss(open: boolean, close: () => void, wrapRef: React.RefObject<HTMLElement>) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, wrapRef]);
}

const TRACKS: Array<{ id: Track, label: string }> = [
  { id: 'melody', label: 'Melody' },
  { id: 'chords', label: 'Chords' },
  { id: 'bass', label: 'Bass' },
  { id: 'drums', label: 'Drums' },
];

const SOURCES: Array<{ id: SoundSource, label: string, title: string }> = [
  { id: 'synth', label: 'Synth', title: 'Play through the built-in oscillators' },
  { id: 'acoustic', label: 'Acoustic', title: 'Play through the built-in acoustic samples' },
  { id: 'midi', label: 'MIDI', title: 'Send notes to a connected MIDI device' },
];

const THEMES: Array<{ id: ThemePref, label: string, title: string }> = [
  { id: 'system', label: 'Auto', title: "Follow the system's light/dark setting" },
  { id: 'light', label: 'Light', title: 'Always light' },
  { id: 'dark', label: 'Dark', title: 'Always dark' },
];

// The footer: key, sound source, play/loop/tempo in the middle, track
// toggles, and the less-frequent actions tucked into a menu.
function Transport(props: TransportProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const themePref = useThemePref();

  // The MIDI routing menu: opens when MIDI is picked as the source; clicking
  // MIDI again while it's the source toggles it.
  const [midiMenuOpen, setMidiMenuOpen] = useState(false);
  const sourceWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (props.source !== 'midi') setMidiMenuOpen(false);
  }, [props.source]);
  useDismiss(midiMenuOpen, () => setMidiMenuOpen(false), sourceWrapRef);
  const pickSource = (source: SoundSource) => {
    if (source === 'midi') setMidiMenuOpen(open => (props.source === 'midi' ? !open : true));
    props.onSourceChange(source);
  };

  useDismiss(menuOpen, () => setMenuOpen(false), menuWrapRef);

  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const tabWrapRef = useRef<HTMLDivElement>(null);
  useDismiss(tabMenuOpen, () => setTabMenuOpen(false), tabWrapRef);

  const menuAction = (fn: () => void) => () => { setMenuOpen(false); fn(); };

  return (
    <div className={styles.transport}>
      <div className={styles.transportSide}>
        <button className={styles.keyChip} onClick={props.onKeyClick} title="Generate a new song">
          <span className={styles.keyChipLabel}>Key</span>
          <span className={styles.keyChipValue}>{props.songKey}</span>
        </button>
        <div className={styles.sourceGroup}>
        <div className={styles.menuWrap} ref={sourceWrapRef}>
          <div className={styles.segmented} role="group" aria-label="Sound source">
            {SOURCES.map(s => (
              <button
                key={s.id}
                className={props.source === s.id ? styles.segmentOn : ''}
                aria-pressed={props.source === s.id}
                aria-expanded={s.id === 'midi' ? midiMenuOpen : undefined}
                onClick={() => pickSource(s.id)}
                title={s.id === 'midi' && props.source === 'midi' ? 'Choose which MIDI output each track plays to' : s.title}
              >
                {s.label}{s.id === 'midi' && props.source === 'midi' ? ' ▾' : ''}
              </button>
            ))}
          </div>
          {midiMenuOpen && <MidiRoutingMenu />}
        </div>
        {props.songTabs && (
          <div className={`${styles.menuWrap} ${styles.tabPicker}`} ref={tabWrapRef}>
            <button
              className={styles.tabPickerButton}
              onClick={() => setTabMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={tabMenuOpen}
              aria-label={`Song tab T${props.songTabs.current + 1}`}
              title="Switch song tab"
            >
              T{props.songTabs.current + 1} ▾
            </button>
            {tabMenuOpen && (
              <div className={`${styles.partMenu} ${styles.tabMenu}`} role="menu">
                {Array.from({ length: props.songTabs.count }, (_, index) => (
                  <button
                    key={index}
                    role="menuitemradio"
                    aria-checked={props.songTabs!.current === index}
                    className={props.songTabs!.current === index ? styles.openButton : ''}
                    onClick={() => { setTabMenuOpen(false); props.songTabs!.onSwitch(index); }}
                  >
                    T{index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <div className={styles.transportCenter}>
        <div className={styles.transportMain}>
          <button
            className={`${styles.roundButton} ${props.loopOn ? styles.loopActive : ''}`}
            onClick={props.onToggleLoop}
            disabled={!props.hasLoop}
            aria-pressed={props.loopOn}
            aria-label="Loop"
            title={props.hasLoop ? 'Cycle playback between the loop points' : 'Set loop points first: Set start, then click where it starts and where it ends - or click a bar number above the drum grid'}
          >
            ⟳
          </button>
          <button
            className={`${styles.playButton} ${props.isPlaying ? styles.playing : ''}`}
            onClick={props.onPlay}
            aria-label={props.isPlaying ? 'Pause' : 'Play'}
            title={`${props.isPlaying ? 'Pause' : 'Play'} (Space)`}
          >
            {props.isPlaying ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
            )}
          </button>
          <BpmControl bpm={props.bpm} onChange={props.onBpmChange} />
        </div>
        <div className={styles.loopStrip}>
          <button
            className={props.loopPick === 'start' ? styles.pickArmed : ''}
            aria-pressed={props.loopPick === 'start'}
            onClick={() => props.onArmLoopPick('start')}
            title="Then click a step lamp or bar number to start the loop there"
          >Set start</button>
          <span className={props.loopOn ? styles.loopReadoutOn : ''}>{props.loopReadout}</span>
          <button
            className={props.loopPick === 'end' ? styles.pickArmed : ''}
            aria-pressed={props.loopPick === 'end'}
            onClick={() => props.onArmLoopPick('end')}
            title="Then click a step lamp or bar number to end the loop there (that step or bar is included)"
          >Set end</button>
        </div>
      </div>

      <div className={`${styles.transportSide} ${styles.transportRight}`}>
        <div className={styles.trackPills} role="group" aria-label="Tracks">
          {TRACKS.filter(t => t.id !== 'melody' || props.hasMelody).map(t => (
            <button
              key={t.id}
              className={`${styles.trackPill} ${props.tracks[t.id] ? styles.trackOn : ''}`}
              aria-pressed={props.tracks[t.id]}
              onClick={() => props.onToggleTrack(t.id)}
              title={props.tracks[t.id] ? `Mute ${t.label.toLowerCase()}` : `Unmute ${t.label.toLowerCase()}`}
            >
              <span className={styles.trackDot} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.transportActions}>
        <button className={styles.ghostButton} onClick={props.onSave}>Save / Load</button>
        <div className={styles.menuWrap} ref={menuWrapRef}>
          <button
            className={styles.iconButton}
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More actions"
            title="More actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={`${styles.partMenu} ${styles.overflowMenu}`} role="menu">
              <button role="menuitem" onClick={menuAction(props.onSounds)} disabled={!props.hasSong} title="Recommended Ableton Live 10 Suite instruments for this song's drums, bass and chords">
                Sounds…
              </button>
              <button role="menuitem" onClick={menuAction(props.onExport)} title="Download a multitrack .mid (drums, bass, chords, guide tones, section markers) for your DAW">
                Export MIDI
              </button>
              <div className={styles.menuDivider} role="separator" />
              {/* Stays open on a pick, so the change can be seen and undone. */}
              <div className={styles.menuThemeRow}>
                <span id="theme-label">Theme</span>
                <div className={styles.segmented} role="group" aria-labelledby="theme-label">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      role="menuitemradio"
                      aria-checked={themePref === t.id}
                      className={themePref === t.id ? styles.segmentOn : ''}
                      onClick={() => setThemePref(t.id)}
                      title={t.title}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.menuDivider} role="separator" />
              <button role="menuitem" onClick={menuAction(props.onLogout)}>
                Log out
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default Transport;
