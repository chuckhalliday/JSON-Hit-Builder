import React, { useEffect, useRef } from "react";
import { SectionLabel, SongDoc } from "../Core/doc";
import { isDetached } from "../Core/generate";
import styles from "../Styles/App.module.scss";

// The kinds of section a part can be switched to, in song order. Anything
// else this song already has (a Breakdown, a Drop...) is offered too.
const BASIC_LABELS: SectionLabel[] = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'];

interface SectionTypeMenuProps {
  doc: SongDoc;
  part: number;
  // The button that toggles the menu; clicks on it are left to it.
  anchor: React.RefObject<HTMLElement>;
  onPick: (label: SectionLabel) => void;
  onClose: () => void;
}

// The menu behind an open part's title: turn the part into another kind of
// section where it stands in the song.
export default function SectionTypeMenu({ doc, part, anchor, onPick, onClose }: SectionTypeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || anchor.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // Deferred so the click that opened the menu doesn't close it.
    const id = setTimeout(() => document.addEventListener('mousedown', onDown));
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose]);

  const labelOf = (i: number) => doc.sections[doc.form[i].sectionId]?.label;
  const current = labelOf(part);
  const inSong = doc.form.map((_, i) => labelOf(i));
  const labels = [...BASIC_LABELS, ...inSong.filter((l): l is SectionLabel => !!l && !BASIC_LABELS.includes(l))]
    .filter((l, i, all) => all.indexOf(l) === i);

  // What picking each one means: joining the song's section of that kind
  // (and with how many other parts), starting from a copy of one that's
  // only played "this part only", or generating a new one.
  const note = (label: SectionLabel) => {
    if (label === current) return 'current';
    const others = inSong.filter((l, i) => l === label && i !== part && !isDetached(doc, i)).length;
    if (others > 0) return `linked · ${others} part${others === 1 ? '' : 's'}`;
    return inSong.includes(label) ? 'copy' : 'new';
  };

  return (
    <div ref={ref} className={`${styles.partMenu} ${styles.sectionTypeMenu}`} role="menu">
      <div className={styles.partMenuTitle}>Change this part to</div>
      {labels.map(label => (
        <button
          key={label}
          role="menuitemradio"
          aria-checked={label === current}
          className={label === current ? styles.sectionTypeCurrent : ''}
          disabled={label === current}
          onClick={() => { onPick(label); onClose(); }}
          title={note(label) === 'new'
            ? `Generate a new ${label.toLowerCase()} for this spot`
            : note(label) === 'copy'
              ? `Start from a copy of this song's ${label.toLowerCase()}`
              : `Play the song's ${label.toLowerCase()} here, linked to its other parts`}
        >
          <span>{label}</span>
          <span className={styles.sectionTypeNote}>{note(label)}</span>
        </button>
      ))}
    </div>
  );
}
