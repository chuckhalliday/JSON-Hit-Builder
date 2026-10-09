import React, { useEffect, useRef, useState } from "react";
import { BASS_PATTERNS, BassPatternId, patternCells } from "../Core/bassPatterns";
import styles from "../Styles/App.module.scss";

interface BassPatternMenuProps {
  // The pattern the part's bass plays now, if it plays one.
  current: BassPatternId | null;
  onPick: (pattern: BassPatternId) => void;
  // Where it sits over the staff: its bottom center.
  style?: React.CSSProperties;
}

// The Rhythm button over the bass clef, and its menu of common bass
// rhythms, each with a bar of it drawn as cells (a note starts on a lit
// one). Picking one sets the part's whole bass line to it.
export default function BassPatternMenu({ current, onPick, style }: BassPatternMenuProps) {
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
    <div ref={ref} className={styles.bassPatternWrap} style={style}>
      <button
        type="button"
        className={open ? `${styles.bassPatternButton} ${styles.bassPatternButtonOn}` : styles.bassPatternButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        title="Set the whole bass part to a common rhythm"
      >
        Rhythm ▾
      </button>
      {open && (
        <div className={styles.bassPatternMenu} role="menu" aria-label="Bass rhythms">
          <div className={styles.menuTitle}>Bass rhythm for the whole part</div>
          <div className={styles.bassPatternOptions}>
            {BASS_PATTERNS.map(p => (
              <button
                key={p.id}
                type="button"
                role="menuitemradio"
                aria-checked={p.id === current}
                className={p.id === current ? `${styles.menuOption} ${styles.menuCurrent}` : styles.menuOption}
                onClick={() => {
                  setOpen(false);
                  if (p.id !== current) onPick(p.id);
                }}
                title={p.id === current ? `Playing now. ${p.about}` : p.about}
              >
                <span className={styles.menuRoman}>{p.name}</span>
                <span className={styles.patternCells} aria-hidden="true">
                  {patternCells(p).map((beat, b) => (
                    <span key={b} className={styles.patternBeat}>
                      {beat.map((hit, k) => <span key={k} className={hit ? styles.patternHit : undefined} />)}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
