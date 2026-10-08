import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMelodyEnabled, setPartLyrics, SongState } from "../reducers";
import { NO_WORDS, partLyrics, placeLyrics } from "../Core/lyrics";
import { Part } from "../types";
import styles from "../Styles/App.module.scss";

interface LyricsSheetProps {
  parts: Part[];
  openPart: number;
  onOpenPart: (index: number) => void;
  onClose: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// The lyric worksheet: one box per part, in song order. Typing in a box
// opens that part, so its syllables can be seen landing on the staff.
export default function LyricsSheet({ parts, openPart, onOpenPart, onClose }: LyricsSheetProps) {
  const dispatch = useDispatch();
  const doc = useSelector((state: { song: SongState }) => state.song.doc);
  const melodyOn = !!doc?.melody;
  const sheetRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Keep the open part's box in view as parts are opened elsewhere (or by
  // playback) - but not while typing in the sheet, which would scroll the
  // box being typed in away.
  useEffect(() => {
    if (sheetRef.current?.contains(document.activeElement)) return;
    cardRefs.current[openPart]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [openPart]);

  return (
    <aside ref={sheetRef} className={styles.lyricsSheet} aria-label="Lyrics worksheet">
      <div className={styles.lyricsSheetHeader}>
        <h2>Lyrics</h2>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close lyrics" title="Close">×</button>
      </div>
      <p className={styles.lyricsHelp}>
        One line per phrase; lines share out the part's bars and land on the beat.
        Hyphenate to split syllables your way (<i>beau-ti-ful</i>). A repeated chorus left
        blank sings the earlier words; write <b>{NO_WORDS}</b> for none. Drag a syllable on the
        staff to move it between its neighbours; double-click it to put it back.
      </p>
      <div className={styles.melodyToggle}>
        <button
          className={melodyOn ? styles.ghostButton : styles.primaryButton}
          onClick={() => dispatch(setMelodyEnabled(!melodyOn))}
          disabled={!doc}
          aria-pressed={melodyOn}
        >
          {melodyOn ? 'Remove melody' : '♪ Add melody'}
        </button>
        <span>
          {!doc
            ? 'A melody needs a song from the form-first engine.'
            : melodyOn
              ? 'Each part sings its words on the treble staff. Click the staff to change a note; lock or re-roll it in the section panel.'
              : 'Sets the words to a tune on a staff above the bass, following the chords and answering the bass line.'}
        </span>
      </div>
      <ol className={styles.lyricsParts}>
        {parts.map((p, i) => {
          const own = p.lyrics ?? '';
          const words = partLyrics(parts, i);
          const placement = placeLyrics(words.text, p.drumGroove);
          const bars = Math.round(p.drumGroove.reduce((a, b) => a + b, 0) / 4);
          const source = words.from !== null ? parts[words.from] : null;
          const meta = own.trim() === NO_WORDS
            ? 'no words'
            : source
              ? `repeats ${source.type} ${source.repeat}`
              : placement.total > 0
                ? `${plural(placement.total, 'syllable')} · ${plural(placement.lines, 'line')} · ${plural(bars, 'bar')}`
                : plural(bars, 'bar');
          return (
            <li
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={i === openPart ? `${styles.lyricsPart} ${styles.lyricsPartOpen}` : styles.lyricsPart}
            >
              <div className={styles.lyricsPartHead}>
                <button className={styles.lyricsPartName} onClick={() => onOpenPart(i)} title="Open this part">
                  {p.type} {p.repeat}
                </button>
                <span className={styles.lyricsPartMeta}>{meta}</span>
              </div>
              <textarea
                value={own}
                rows={Math.max(2, own.split('\n').length, source ? words.text.split('\n').length : 0)}
                placeholder={source ? words.text : `Words for ${p.type.toLowerCase()} ${p.repeat}…`}
                spellCheck
                aria-label={`Lyrics for ${p.type} ${p.repeat}`}
                onFocus={() => onOpenPart(i)}
                onChange={(e) => dispatch(setPartLyrics({ part: i, text: e.target.value }))}
              />
              {placement.overflow > 0 && (
                <p className={styles.lyricsWarn}>
                  {plural(placement.overflow, 'syllable')} won't fit this part's rhythm - shorten a line or move words on.
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
