import React from 'react'
import styles from "../Styles/App.module.scss"

interface SectionToggleProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  // Controls that belong to the section, shown beside its name.
  children?: React.ReactNode;
}

// The slim header that collapses or expands one section of an open part.
// It stays at the visible left edge while the part scrolls sideways.
export default function SectionToggle({ label, open, onToggle, children }: SectionToggleProps) {
  return (
    <div className={styles.sectionToggleRow}>
      <button
        type="button"
        className={styles.sectionToggle}
        aria-expanded={open}
        onClick={onToggle}
        title={open ? `Collapse ${label.toLowerCase()}` : `Expand ${label.toLowerCase()}`}
      >
        <span className={styles.sectionToggleCaret} aria-hidden="true">{open ? '▾' : '▸'}</span>
        {label}
      </button>
      {children}
    </div>
  );
}
