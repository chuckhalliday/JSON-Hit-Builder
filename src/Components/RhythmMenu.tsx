import React, { useEffect, useRef, useState } from "react";
import { BASS_PATTERNS, BassPatternId, patternCells } from "../Core/bassPatterns";
import { LYRIC_METERS, LyricMeter } from "../Core/lyrics";
import styles from "../Styles/App.module.scss";

export interface RhythmOption<Id extends string> {
  id: Id;
  name: string;
  about: string;
  preview: React.ReactNode; // a glimpse of it, under the name
  wide?: boolean; // across the whole menu
}

// The bass's common rhythms, each with a bar of it drawn as cells (a note
// starts on a lit one).
export const BASS_RHYTHMS: RhythmOption<BassPatternId>[] = BASS_PATTERNS.map(p => ({
  id: p.id,
  name: p.name,
  about: p.about,
  preview: (
    <span className={styles.patternCells} aria-hidden="true">
      {patternCells(p).map((beat, b) => (
        <span key={b} className={styles.patternBeat}>
          {beat.map((hit, k) => <span key={k} className={hit ? styles.patternHit : undefined} />)}
        </span>
      ))}
    </span>
  ),
}));

// The melody's meters, each with its foot, the stressed syllable in bold:
// Even across the top, then rising and falling side by side.
export const MELODY_RHYTHMS: RhythmOption<LyricMeter>[] = LYRIC_METERS.map(m => ({
  id: m.id,
  name: m.name,
  about: m.about,
  wide: !m.weak,
  preview: (
    <span className={styles.meterFoot} aria-hidden="true">
      {m.foot.split(/([- ])/).map((syl, k) => (syl === syl.toUpperCase() && /\w/.test(syl) ? <b key={k}>{syl}</b> : syl))}
    </span>
  ),
}));

interface RhythmMenuProps<Id extends string> {
  options: RhythmOption<Id>[];
  // The option the part plays now, if it plays one as set.
  current: Id | null;
  onPick: (id: Id) => void;
  heading: string; // over the options
  label: string; // the menu's accessible name
  title: string; // the button's
  // Where it sits over the staff: its bottom center.
  style?: React.CSSProperties;
}

// The Rhythm button over a clef, and its menu of common rhythms. Picking
// one sets the whole part's rhythm (bass line or words) to it.
export default function RhythmMenu<Id extends string>({ options, current, onPick, heading, label, title, style }: RhythmMenuProps<Id>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // A press anywhere else closes it (the button itself toggles it).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={styles.rhythmMenuWrap} style={style}>
      <button
        type="button"
        className={open ? `${styles.rhythmMenuButton} ${styles.rhythmMenuButtonOn}` : styles.rhythmMenuButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        title={title}
      >
        Rhythm ▾
      </button>
      {open && (
        <div className={styles.rhythmMenu} role="menu" aria-label={label}>
          <div className={styles.menuTitle}>{heading}</div>
          <div className={styles.rhythmMenuOptions}>
            {options.map(p => (
              <button
                key={p.id}
                type="button"
                role="menuitemradio"
                aria-checked={p.id === current}
                className={p.id === current ? `${styles.menuOption} ${styles.menuCurrent}` : styles.menuOption}
                style={p.wide ? { gridColumn: '1 / -1' } : undefined}
                onClick={() => {
                  setOpen(false);
                  if (p.id !== current) onPick(p.id);
                }}
                title={p.id === current ? `Playing now. ${p.about}` : p.about}
              >
                <span className={styles.menuRoman}>{p.name}</span>
                {p.preview}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
