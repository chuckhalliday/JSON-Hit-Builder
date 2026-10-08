import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import playBass from '../Playback/playBass';
import { editBassRhythm, setBassState, setCurrentBeat, SongState } from '../reducers';
import { PlayHandle } from './Piano';
import { useLampStep } from '../Playback/useLampStep';
import appStyles from '../Styles/App.module.scss';
import { NoteLocation } from '../types';
import { isStaffPitch, PITCH_MIN_Y } from '../SongStructure/bassPitch';
import { spellPc, staffY } from '../Core/theory';
import { parseKeyString } from '../Core/exportMidi';
import { useTheme } from '../theme';
import { partLyrics, placeLyrics } from '../Core/lyrics';
import { stepXs } from '../SongStructure/bass';
import { canJoinBassNotes, canSplitBassNote } from '../Core/edits';
import { beatsToTicks } from '../Core/time';

// Standard 4-string bass tuning (E1 A1 D2 G2), lowest to highest, expressed as
// the real MIDI note number of each open string - matches the `midi` values
// already stored on notes (see bassPitch.ts), so no pixel/pitch translation
// is needed here.
const BASS_OPEN_MIDI = [28, 33, 38, 43];

// Fixed vertical unit for one diatonic staff step. This is baked into every
// note's stored `y` (and into bassPitch.ts's switch keys), so it must never
// change - existing songs' note positions depend on it.
const SPACING = 7.5;
// Pitch-space y bounds a note can be placed at: 0 is the 3rd ledger line
// above the staff (G3), 120 is the 1st ledger line below it (E1) - bass is a
// transposing instrument, so the open low E string already lands just one
// ledger line under the staff and is the lowest note a 4-string bass can
// produce, so the range doesn't extend any further down. Everything in
// between lines up with a case in bassPitch.ts.
// Highest placeable pitch: F4, three more ledger lines up (bassPitch.ts) -
// room for the top of a 20-fret neck (Eb4 on the G string).
const NOTE_MIN_Y = PITCH_MIN_Y;
const NOTE_MAX_Y = 120;
// Canvas-pixel margin above/below the mapped pitch range, so noteheads and
// accidental symbols at the extremes have room to render without clipping.
const STAFF_Y_OFFSET = 45;
const CANVAS_HEIGHT = NOTE_MAX_Y + STAFF_Y_OFFSET * 2;
// A part with lyrics opens a band this tall under the chord names, pushing
// the staff/tab down, and sets its syllables in it.
const LYRIC_BAND = 34;
const LYRIC_BASELINE = 51;
const LYRIC_FONT = '13px "Helvetica Neue", Arial, sans-serif';
// The rest a clicked note can turn into, offered to its right (its
// accidentals are offered to its left): drawn this much smaller than a real
// rest, this far right of the notehead's center - past its stem, flag and dot.
const REST_OPTION_SCALE = 0.6;
const REST_OPTION_REACH = 31;
// The rhythm strip in the space under the staff (staff coordinates): its
// band, where its notes' heads and its rests' middles sit, and how much
// smaller than the staff's its notes are drawn.
const STRIP_TOP = 177;
const STRIP_BOTTOM = 209;
const STRIP_HEAD_Y = 201;
const STRIP_MIDDLE = 192;
const STRIP_SCALE = 0.55;
// Pitch-space y of the 5 main staff lines (A2 F2 D2 B1 G1, top to bottom),
// of the 3 extra ledger lines above them (reachable via frets further up the
// neck), and of the single ledger line below (the open low E string).
const MAIN_LINES_Y = [45, 60, 75, 90, 105];
const LEDGER_LINES_ABOVE_Y = [30, 15, 0, -15, -30, -45];
const LEDGER_LINES_BELOW_Y = [120];

// Horizontal position of each tab line, top to bottom (G D A E) - vertically
// centered in the (now taller, to fit the bass staff's ledger lines) canvas
// so switching views doesn't look lopsided.
const TAB_LINE_Y = [52.5, 67.5, 82.5, 97.5].map((y) => y + STAFF_Y_OFFSET);

type TabPosition = { stringIndex: number; fret: number };

// Frets at or below this are considered an easy, open-ish position - used to
// pick a sensible starting spot when there's no previous note to stay close to.
const COMFORTABLE_FRET_SPAN = 12;
const MAX_FRET = 20;

function candidateTabPositions(midi: number): TabPosition[] {
  const candidates: TabPosition[] = [];
  BASS_OPEN_MIDI.forEach((open, i) => {
    const fret = midi - open;
    if (fret >= 0 && fret <= MAX_FRET) {
      candidates.push({ stringIndex: i, fret });
    }
  });
  return candidates;
}

// Clamps into a playable position when a note falls outside every string's
// 0-20 fret range, rather than rendering nothing.
function clampedTabPosition(midi: number): TabPosition {
  let closestIndex = 0;
  let closestDistance = Infinity;
  BASS_OPEN_MIDI.forEach((open, i) => {
    const fret = midi - open;
    const distance = fret < 0 ? -fret : fret - MAX_FRET;
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  });
  const clampedFret = Math.min(MAX_FRET, Math.max(0, midi - BASS_OPEN_MIDI[closestIndex]));
  return { stringIndex: closestIndex, fret: clampedFret };
}

// Picks a string/fret for `midi`. With a previous note in hand, stays as close
// as possible to that fret (minimizing hand movement across a phrase),
// favoring the lower string on ties. With no previous note (start of a part,
// or after a rest), favors the lowest string that lands in a comfortable
// low position rather than always reaching for the highest string.
function midiToTabPosition(midi: number, previous: TabPosition | null): TabPosition | null {
  if (midi <= 0) return null;

  const candidates = candidateTabPositions(midi);
  if (candidates.length === 0) return clampedTabPosition(midi);

  if (previous) {
    let best = candidates[0];
    let bestCost = Infinity;
    candidates.forEach((candidate) => {
      const fretCost = Math.abs(candidate.fret - previous.fret);
      const stringChangeCost = Math.abs(candidate.stringIndex - previous.stringIndex) * 0.1;
      const cost = fretCost + stringChangeCost;
      if (cost < bestCost || (cost === bestCost && candidate.stringIndex < best.stringIndex)) {
        best = candidate;
        bestCost = cost;
      }
    });
    return best;
  }

  const lowestComfortable = candidates
    .filter((c) => c.fret <= COMFORTABLE_FRET_SPAN)
    .sort((a, b) => a.stringIndex - b.stringIndex)[0];
  if (lowestComfortable) return lowestComfortable;

  return candidates.sort((a, b) => a.stringIndex - b.stringIndex)[0];
}

// Tab position of every note of a part, left to right: a hand-picked string
// when the note has one (and it's playable there), otherwise the closest
// comfortable position to the previous note.
function tabPositions(notes: NoteLocation[]): Array<TabPosition | null> {
  let previous: TabPosition | null = null;
  return notes.map((note) => {
    if (note.midi <= 0) return null;
    const fret = note.string !== undefined ? note.midi - BASS_OPEN_MIDI[note.string] : -1;
    const position = fret >= 0 && fret <= MAX_FRET
      ? { stringIndex: note.string!, fret }
      : midiToTabPosition(note.midi, previous);
    if (position) previous = position;
    return position;
  });
}

// Tab rows are drawn top (G) to bottom (E); strings are numbered from low E.
const rowOfString = (stringIndex: number) => BASS_OPEN_MIDI.length - 1 - stringIndex;

interface BassStaffProps {
  renderWidth: number;
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
  onPlayingChange?: (isPlaying: boolean) => void;
  viewMode: 'staff' | 'tab';
  onViewModeChange: (viewMode: 'staff' | 'tab') => void;
}


// Loaded once for every staff instead of on every render.
const CLEF_IMAGE = new Image();
CLEF_IMAGE.src = "/BassClef.png";

// The clef image is black on transparent; recolor it to the theme's ink
// (light on the dark theme). One copy per ink color, made once it's loaded.
const tintedClefs = new Map<string, HTMLCanvasElement>();
function tintedClef(color: string): CanvasImageSource | null {
  if (!CLEF_IMAGE.complete || !CLEF_IMAGE.naturalWidth) return null;
  let tinted = tintedClefs.get(color);
  if (!tinted) {
    tinted = document.createElement('canvas');
    tinted.width = CLEF_IMAGE.naturalWidth;
    tinted.height = CLEF_IMAGE.naturalHeight;
    const g = tinted.getContext('2d');
    if (!g) return CLEF_IMAGE;
    g.drawImage(CLEF_IMAGE, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, tinted.width, tinted.height);
    tintedClefs.set(color, tinted);
  }
  return tinted;
}

// The canvas's colors, from the theme tokens in index.scss.
function readCanvasColors() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    ink: token('--c-ink', 'black'),
    paper: token('--c-bg', 'white'),
    hover: token('--c-info', '#4281b2'),
    muted: token('--c-text-muted', '#66707c'),
  };
}

const BassStaff = forwardRef<PlayHandle, BassStaffProps>(function BassStaff({ renderWidth, part, lampsRef, onPlayingChange, viewMode, onViewModeChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dispatch = useDispatch()

  const song = useSelector((state: { song: SongState }) => state.song);
  const bpm = song.bpm
  const midi = song.midi
  const acoustic = song.acoustic
  const beat = song.selectedBeat[2]

  const bassGrid = song.songStructure[part].bassGrid
  const bassNoteGrid = song.songStructure[part].bassNoteLocations
  const bassGroove = song.songStructure[part].bassGroove
  const drumGroove = song.songStructure[part].drumGroove
  const chordsGroove = song.songStructure[part].chordsGroove
  const chords = song.songStructure[part].chords
  const chordGrid = song.songStructure[part].chordsLocation
  const measureLines = song.songStructure[part].measureLines

  const handleStep = useLampStep(lampsRef, part, drumGroove, bassGroove, chordsGroove);

  // Re-read the canvas colors (and redraw, below) when the theme changes.
  const theme = useTheme();
  const colors = useMemo(readCanvasColors, [theme]);

  // The part's words on its step grid (its own, or a repeat's earlier ones).
  const drumGrooveForLyrics = song.songStructure[part].drumGroove;
  const lyricText = partLyrics(song.songStructure, part).text;
  const lyrics = useMemo(() => placeLyrics(lyricText, drumGrooveForLyrics), [lyricText, drumGrooveForLyrics]);
  const lyricXs = useMemo(() => stepXs(drumGrooveForLyrics), [drumGrooveForLyrics]);
  // On the staff, the band grows to clear the part's highest stem (or, for
  // notes high enough to take their stems down, notehead) under the words.
  const highestReach = viewMode === 'staff'
    ? Math.min(...bassNoteGrid.filter((n) => isStaffPitch(n.y)).map((n) => n.y - (n.y < 0 ? SPACING : SPACING * 5)))
    : Infinity;
  const band = lyrics.syllables.length === 0 ? 0
    : Math.max(LYRIC_BAND, Math.ceil(LYRIC_BASELINE + 7 - (highestReach + STAFF_Y_OFFSET)));
  // Read by the mouse handlers, which work in the staff's own coordinates.
  const bandRef = useRef(band);
  bandRef.current = band;

  const [pendingNote, setPendingNote] = React.useState<{ x: number, y: number } | null>(null);
  // The tab cell being typed into: a note (by x) on one string.
  const [tabEdit, setTabEdit] = useState<{ x: number, stringIndex: number, value: string } | null>(null);
  const skipBlurCommit = useRef(false);

  useEffect(() => {
    setPendingNote(null);
    setTabEdit(null);
  }, [part, viewMode]);

  // The rhythm strip (sculpted songs): while a note is selected, the part's
  // rhythm shows under the staff, where a note splits in half on a click
  // and "+" joins two neighbours.
  const doc = song.doc;
  const rhythmEditable = !!doc && doc.form.length === song.songStructure.length && doc.form[part]?.sectionId === song.songStructure[part].sectionId;
  const rhythmTicks = useMemo(() => bassGroove.map(beatsToTicks), [bassGroove]);
  // The note to keep selected once a split or join lands (by index - its
  // column moves).
  const refocusRef = useRef<number | null>(null);
  useEffect(() => {
    const k = refocusRef.current;
    if (k === null) return;
    refocusRef.current = null;
    const n = bassNoteGrid[k];
    setPendingNote(n ? { x: n.x, y: n.y } : null);
  }, [bassNoteGrid]);

  // One mouse record for the component's lifetime. It used to be a fresh
  // object every render, and since it sat in the effect dependency lists
  // below, every render (one per playback step) re-ran them.
  const MOUSE = useRef({
    x: -10,
    y: -10,
    isDown: false
  }).current;

  // Redraw on demand, coalesced to one frame. The staff used to start a new
  // never-cancelled requestAnimationFrame loop on every render; during
  // playback that piled up dozens of full-canvas redraw loops per part and
  // starved the main thread until playback skipped and stalled.
  const drawRef = useRef<() => void>(() => {});
  const frameRef = useRef(0);
  const requestDraw = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      drawRef.current();
    });
  }, []);


  function mouseX(array: number[]) {
    let closest = array[0]; // Assume first element is closest initially
    let minDistance = Math.abs(MOUSE.x - closest);
  
    for (let i = 1; i < array.length; i++) {
      const distance = Math.abs(MOUSE.x - array[i]);
      if (distance < minDistance) {
        closest = array[i];
        minDistance = distance;
      }
    }
  
    return closest;
  }

  const ACCIDENTAL_SYMBOLS: Record<string, string> = { flat: '♭', sharp: '#', none: '♮' };

  function getAccidentalOptions(acc: string): string[] {
    return ['flat', 'none', 'sharp'].filter((a) => a !== acc);
  }

  function getAccidentalOptionLayout(location: { x: number, y: number, acc: string }, spacing: number, fontSize: number) {
    const x = location.x + spacing * -3.5;
    const baseY = location.y + STAFF_Y_OFFSET - spacing * 2 + fontSize;
    const gap = fontSize + 6;
    return getAccidentalOptions(location.acc).map((acc, i) => ({
      acc,
      symbol: ACCIDENTAL_SYMBOLS[acc],
      x,
      y: baseY + (i === 0 ? -gap : gap)
    }));
  }

  // A clicked note's choices are drawn as small outlined chips in the
  // highlight color, so they read as buttons rather than notation.
  function drawOptionChip(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number) {
    ctx.fillStyle = colors.paper;
    ctx.fillRect(left, top, width, height);
    ctx.strokeStyle = colors.hover;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
  }

  function drawAccidentalOptions(ctx: CanvasRenderingContext2D, location: { x: number, y: number, acc: string }, spacing: number) {
    const fontSize = 20;
    ctx.save();
    ctx.font = `${fontSize}px serif`;
    getAccidentalOptionLayout(location, spacing, fontSize).forEach((opt) => {
      const width = ctx.measureText(opt.symbol).width;
      drawOptionChip(ctx, opt.x - 4, opt.y - fontSize + 2, width + 8, fontSize + 3);
      ctx.fillStyle = colors.hover;
      ctx.fillText(opt.symbol, opt.x, opt.y);
    });
    ctx.restore();
  }

  // Where the rest choice sits: level with the note, to its right (kept
  // inside the canvas for notes at the very top or bottom).
  function getRestOptionLayout(location: { x: number, y: number }) {
    const py = location.y + STAFF_Y_OFFSET;
    return { x: location.x + REST_OPTION_REACH, y: Math.min(CANVAS_HEIGHT - 18, Math.max(18, py)) };
  }

  const hitsRestOption = (location: { x: number, y: number }) => {
    const opt = getRestOptionLayout(location);
    return Math.abs(MOUSE.x - opt.x) <= 12 && Math.abs(MOUSE.y - opt.y) <= 18;
  };

  // Vertical middle of each rest glyph drawRest draws, below its REST_Y.
  const restMiddle = (groove: number) => (groove === 2 ? 71.5 : groove >= 1 ? 74.5 : groove === 0.25 ? 84 : 76.5);

  // The strip's notes, at their staff columns, and a "+" between each pair
  // that can join.
  function rhythmStrip() {
    const notes = bassNoteGrid.map((n, k) => ({ k, x: n.x, splittable: canSplitBassNote(rhythmTicks, k) }));
    const joins = notes.slice(0, -1)
      .filter(({ k }) => canJoinBassNotes(rhythmTicks, k))
      .map(({ k, x }) => ({ k, x: (x + notes[k + 1].x) / 2 }));
    return { notes, joins };
  }

  // What in the strip is under the mouse: a "+" or a note that can split.
  function stripHit(): { op: 'split' | 'join', k: number } | null {
    if (MOUSE.y < STRIP_TOP || MOUSE.y > STRIP_BOTTOM) return null;
    const { notes, joins } = rhythmStrip();
    const join = joins.find((j) => Math.abs(MOUSE.x - j.x) <= 8);
    if (join) return { op: 'join', k: join.k };
    const note = notes.find((n) => n.splittable && MOUSE.x >= n.x - 8 && MOUSE.x <= n.x + 12);
    return note ? { op: 'split', k: note.k } : null;
  }

  function drawRhythmStrip(ctx: CanvasRenderingContext2D, selected: number) {
    const { notes, joins } = rhythmStrip();
    const hover = stripHit();
    ctx.save();
    // A faint, labelled band, so the strip reads as an editor, not notation.
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = colors.hover;
    ctx.fillRect(0, STRIP_TOP, renderWidth, STRIP_BOTTOM - STRIP_TOP);
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.muted;
    ctx.font = '10px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('RHYTHM', 14, STRIP_MIDDLE + 4);
    // Notes in their own shapes, smaller: the selected one (and a hovered one
    // that can split) lit, ones too short to split dimmed.
    notes.forEach(({ k, x, splittable }) => {
      const lit = k === selected || (hover?.op === 'split' && hover.k === k);
      ctx.save();
      ctx.globalAlpha = splittable || lit ? 1 : 0.5;
      ctx.fillStyle = lit ? colors.hover : colors.ink;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1.5;
      const groove = bassGroove[k];
      if (isStaffPitch(bassNoteGrid[k].y)) {
        ctx.translate(x, STRIP_HEAD_Y);
        ctx.scale(STRIP_SCALE, STRIP_SCALE);
        drawNoteGlyph(ctx, 0, 0, groove, false);
      } else {
        ctx.translate(x, STRIP_MIDDLE);
        ctx.scale(STRIP_SCALE, STRIP_SCALE);
        ctx.translate(0, -(STAFF_Y_OFFSET + restMiddle(groove)));
        drawRest(ctx, 0, groove);
      }
      ctx.restore();
    });
    ctx.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    joins.forEach(({ k, x }) => {
      const lit = hover?.op === 'join' && hover.k === k;
      if (lit) {
        ctx.fillStyle = colors.hover;
        ctx.fillRect(x - 7, STRIP_MIDDLE - 8, 14, 16);
      } else {
        drawOptionChip(ctx, x - 7, STRIP_MIDDLE - 8, 14, 16);
      }
      ctx.fillStyle = lit ? colors.paper : colors.hover;
      ctx.fillText('+', x, STRIP_MIDDLE + 1);
    });
    ctx.restore();
  }

  function drawRestOption(ctx: CanvasRenderingContext2D, location: { x: number, y: number }) {
    const groove = bassGroove[bassGrid.indexOf(location.x, 1) - 1];
    if (groove === undefined) return;
    const opt = getRestOptionLayout(location);
    ctx.save();
    drawOptionChip(ctx, opt.x - 12, opt.y - 18, 24, 36);
    ctx.fillStyle = colors.hover;
    ctx.strokeStyle = colors.hover;
    ctx.translate(opt.x, opt.y);
    ctx.scale(REST_OPTION_SCALE, REST_OPTION_SCALE);
    ctx.lineWidth = 1.5;
    ctx.translate(0, -(STAFF_Y_OFFSET + restMiddle(groove)));
    drawRest(ctx, 0, groove);
    ctx.restore();
  }

  function drawClef(ctx: CanvasRenderingContext2D, location: { x: number, y: number, acc: string }) {
    const CANVAS = canvasRef.current;
    const clef = tintedClef(colors.ink);
    if (CANVAS && clef) {
      const aspectRatio = CLEF_IMAGE.width / CLEF_IMAGE.height;
      // Fixed to the 5-line staff's own size, not the canvas's - the canvas
      // is now taller than the staff to fit the ledger lines above/below it.
      const newHeight = 78;
      const newWidth = aspectRatio * newHeight;

      ctx.drawImage(clef,
        location.x - newWidth / 2, location.y - newHeight / 2,
        newWidth, newHeight);
    }
  }

  // Short ledger-line segments through/around a single note, matching printed
  // sheet music: a note ON a ledger line gets a line through it, a note in
  // the space beyond one gets the line(s) it "steps over" but not one
  // through itself. Nothing is drawn for notes within the 5-line staff.
  function drawLedgerLines(ctx: CanvasRenderingContext2D, location: { x: number, y: number }) {
    const staffTop = MAIN_LINES_Y[0];
    const staffBottom = MAIN_LINES_Y[MAIN_LINES_Y.length - 1];
    const needed =
      location.y < staffTop ? LEDGER_LINES_ABOVE_Y.filter((y) => y >= location.y) :
      location.y > staffBottom ? LEDGER_LINES_BELOW_Y.filter((y) => y <= location.y) :
      [];
    if (needed.length === 0) return;

    const halfWidth = SPACING + 4;
    ctx.save();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    needed.forEach((pitchY) => {
      const y = pitchY + STAFF_Y_OFFSET;
      ctx.beginPath();
      ctx.moveTo(location.x - halfWidth, y);
      ctx.lineTo(location.x + halfWidth, y);
      ctx.stroke();
    });
    ctx.restore();
  }

  // A rest of `groove` beats at column x. Rests aren't pitched, so they sit
  // on the middle of the staff whatever their note's y - these pixel values
  // are tuned to the staff's center. Drawn in the current fill and stroke.
  function drawRest(ctx: CanvasRenderingContext2D, x: number, groove: number) {
    const REST_Y = STAFF_Y_OFFSET;
    const spacing = SPACING;
    //half rest
    if (groove <= 2) {
      if (groove === 2) {
        ctx.beginPath();
        ctx.moveTo(x + spacing,
          REST_Y + 75);
        ctx.lineTo(x + spacing,
          REST_Y + 68);
        ctx.lineTo(x - spacing,
          REST_Y + 68);
        ctx.lineTo(x - spacing,
          REST_Y + 75);
        ctx.stroke()
        ctx.fill();
        //draw quarter rest
      } else if (groove >= 1) {
        ctx.beginPath();
        ctx.moveTo(x - 5, REST_Y + 51);
        ctx.lineTo(x + 5, REST_Y + 66);
        ctx.lineTo(x + 1, REST_Y + 75);
        ctx.lineTo(x + 7, REST_Y + 87);
        ctx.quadraticCurveTo(x - 6, REST_Y + 83, x + 4, REST_Y + 98)
        ctx.quadraticCurveTo(x - 15, REST_Y + 79, x + 4, REST_Y + 83)
        ctx.lineTo(x - 5, REST_Y + 69)
        ctx.quadraticCurveTo(x + 5, REST_Y + 68, x - 5, REST_Y + 52)
        ctx.fill();
        ctx.stroke();
        //dotted quarter
        if (groove === 1.5) {
          ctx.beginPath();
          ctx.arc(x + 12, REST_Y + 70, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (groove < 1) {
        //eighth
        ctx.beginPath();
        ctx.moveTo(x - 1, REST_Y + 88);
        ctx.lineTo(x + 8, REST_Y + 65);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x - 6, REST_Y + 67, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x - 8, REST_Y + 69);
        ctx.quadraticCurveTo(x - 5, REST_Y + 72, x + 8, REST_Y + 65);
        ctx.stroke();
        //dotted eigth
        if (groove === 0.75) {
          ctx.beginPath();
          ctx.arc(x + 14, REST_Y + 67, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        //sixteenth rest
        if(groove === 0.25) {
          ctx.beginPath();
          ctx.moveTo(x - 6, REST_Y + 103);
          ctx.lineTo(x + 8, REST_Y + 65);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x - 6, REST_Y + 67, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(x - 8, REST_Y + 69);
          ctx.quadraticCurveTo(x - 5, REST_Y + 72, x + 8, REST_Y + 65);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x - 9, REST_Y + 82, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(x - 10, REST_Y + 83);
          ctx.quadraticCurveTo(x - 8, REST_Y + 87, x + 2, REST_Y + 81);
          ctx.stroke();
        }
      }
    }
  }

  // A note's shape - stem, flags, dot and head - at column x with its head
  // at py, in the current fill and stroke. The stem points up, or down
  // (mirrored about the head) for notes high above the staff.
  function drawNoteGlyph(ctx: CanvasRenderingContext2D, x: number, py: number, groove: number, stemDown: boolean) {
    const spacing = SPACING;
    ctx.save();
    if (stemDown) {
      ctx.translate(0, 2 * py);
      ctx.scale(1, -1);
    }
    //add line for notes up to dotted half
    if (groove <= 2.5) {
      ctx.beginPath();
      ctx.moveTo(x + spacing,
        py);
      ctx.lineTo(x + spacing,
        py - spacing * 5);
      ctx.stroke();
      }
      //add flag for notes smaller than quarter note
      if(groove < 1){
        ctx.beginPath();
        ctx.moveTo(x + spacing,
          py - spacing * 5);
        ctx.bezierCurveTo(
          x + spacing * 2, py - spacing * 3,
          x + spacing * 2.5, py - spacing * 3,
          x + spacing * 2.5, py - spacing * 1);
        ctx.bezierCurveTo(
          x + spacing * 2.5, py - spacing * 2.7,
          x + spacing * 2, py - spacing * 2.7,
          x + spacing, py - spacing * 4.5);
        ctx.stroke();
        ctx.fill();
      }
      //add double flag for sixteenth notes
      if(groove === 0.25){
        ctx.beginPath();
        ctx.moveTo(x + spacing, py - spacing * 5 + 8);
        ctx.bezierCurveTo(
          x + spacing * 2, py - spacing * 3 + 7,
          x + spacing * 2.5, py - spacing * 3 + 7,
          x + spacing * 2.5, py - spacing * 1 + 4);
        ctx.bezierCurveTo(
          x + spacing * 2.5, py - spacing * 2.7 + 7,
          x + spacing * 2, py - spacing * 2.7 + 7,
          x + spacing, py - spacing * 4.5 + 4);
        ctx.stroke();
        ctx.fill();
      }
    ctx.restore();
    //add dots for syncopated notes
    if (groove === 2.5 || groove === 1.5 || groove === 0.75) {
      ctx.beginPath();
      ctx.arc(x + spacing + 8, py - 3.8, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    //draw actual note
    ctx.beginPath();
    ctx.save();
    ctx.translate(x, py);
    ctx.rotate(-0.2);
    ctx.scale(1.05, 0.8);
    ctx.arc(0, 0, spacing, 0, Math.PI * 2);

    //half to quarter note fill
    if(groove <= 1.5){
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawNote(ctx: CanvasRenderingContext2D, location: { x: number, y: number, acc: string }) {
    const CANVAS = canvasRef.current;
    let match = false
    let index = 0
    for (let i = 1; i < bassGrid.length; i++){
      if (location.x === bassGrid[i]){
        match = true;
        index = i - 1;
        break;
      }
    }
    if (CANVAS && match) {
      const spacing = SPACING;
      const groove = bassGroove[index];
      ctx.fillStyle = colors.ink;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1;

      const fontSize = 20;
      ctx.font = `${fontSize}px serif`;

      //draw notes
      if (isStaffPitch(location.y)) {
        // location.y is pitch-space (unshifted, as stored on the note); `py`
        // is where that pitch actually lands on the canvas.
        const py = location.y + STAFF_Y_OFFSET;
        drawLedgerLines(ctx, location);
        if (location.acc === 'flat') {
          ctx.fillText('♭', location.x + spacing * -3.5, py - spacing * 2 + fontSize);
        }
        if (location.acc === 'sharp') {
          ctx.fillText('#', location.x + spacing * -2.5, py - spacing * 1.9 + fontSize );
        }
        // Notes above the staff's top ledger lines take their stem (and
        // flags) downward, mirrored about the notehead, so they stay on the
        // canvas.
        drawNoteGlyph(ctx, location.x, py, groove, location.y < 0);
      //draw rests
      } else {
        drawRest(ctx, location.x, groove);
        ctx.stroke();
      }
    }
  }

  function displayChord(ctx: CanvasRenderingContext2D, location: number, bassGrid: number[], chordName: string) {
    const CANVAS = canvasRef.current;
    if (CANVAS) {
      const spacing = SPACING;
      const fontSize = 20;
      ctx.fillStyle = colors.ink;
      ctx.font = `${fontSize}px serif`;

      for (let i = 1; i < bassGrid.length; i++) {
        const isMatch = location === bassGrid[i];
        if (isMatch) {
          // Sits just above the highest ledger line, independent of note pitch.
          ctx.fillText(chordName, location - spacing, STAFF_Y_OFFSET - 16);
        }
      }
    }
  }


  function drawTabLines(ctx: CanvasRenderingContext2D) {
    TAB_LINE_Y.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(renderWidth, y);
      ctx.stroke();
    });
  }

  function drawTabLabel(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = colors.ink;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('T', 20, 62 + STAFF_Y_OFFSET);
    ctx.fillText('A', 20, 75 + STAFF_Y_OFFSET);
    ctx.fillText('B', 20, 88 + STAFF_Y_OFFSET);
    ctx.textAlign = 'left';
  }

  // The note column and string under the mouse in tab view (a click there
  // opens the fret editor), or null.
  function tabCellAtMouse(): { note: NoteLocation, stringIndex: number } | null {
    const x = mouseX(bassGrid);
    const note = bassNoteGrid.find((n) => n.x === x);
    if (!note || Math.abs(MOUSE.x - x) > 18) return null;
    const row = TAB_LINE_Y.findIndex((y) => Math.abs(MOUSE.y - y) <= 8);
    if (row === -1) return null;
    return { note, stringIndex: rowOfString(row) };
  }

  function drawTabNotes(ctx: CanvasRenderingContext2D) {
    const positions = tabPositions(bassNoteGrid);
    bassNoteGrid.forEach((note, k) => {
      const position = positions[k];
      if (!position || !bassGrid.includes(note.x)) return;
      const y = TAB_LINE_Y[rowOfString(position.stringIndex)];

      // Blank out the line under the number so it reads clearly, matching how
      // printed tab renders fret numbers directly on the string.
      ctx.fillStyle = colors.paper;
      ctx.fillRect(note.x - 8, y - 7, 16, 14);

      ctx.fillStyle = colors.ink;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(position.fret), note.x, y + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });

    // Hovered cell: where a click will type a fret.
    const hover = tabCellAtMouse();
    if (hover && !tabEdit) {
      const y = TAB_LINE_Y[rowOfString(hover.stringIndex)];
      ctx.save();
      ctx.strokeStyle = colors.hover;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hover.note.x - 11, y - 9, 22, 18);
      ctx.restore();
    }
  }

  // Syllables centered over the steps they land on, squeezed to fit between
  // their neighbours, with a hyphen where a word carries on.
  function drawLyrics(ctx: CanvasRenderingContext2D) {
    const syllables = lyrics.syllables;
    if (syllables.length === 0) return;
    ctx.save();
    ctx.fillStyle = colors.ink;
    ctx.font = LYRIC_FONT;
    ctx.textAlign = 'center';
    const xs = syllables.map((syl) => lyricXs[syl.step]);
    const widths = syllables.map((syl, k) => {
      const room = Math.min(k > 0 ? xs[k] - xs[k - 1] : Infinity, k < xs.length - 1 ? xs[k + 1] - xs[k] : Infinity) - 6;
      return Math.min(ctx.measureText(syl.text).width, Number.isFinite(room) ? room : Infinity);
    });
    syllables.forEach((syl, k) => {
      ctx.fillText(syl.text, xs[k], LYRIC_BASELINE, widths[k]);
      if (syl.hyphen && k < syllables.length - 1) {
        const from = xs[k] + widths[k] / 2;
        const to = xs[k + 1] - widths[k + 1] / 2;
        if (to - from > 8) ctx.fillText('-', (from + to) / 2, LYRIC_BASELINE);
      }
    });
    ctx.restore();
  }

  function drawScene() {
    const CANVAS = canvasRef.current;
    if (CANVAS) {
      // Resizing reallocates the canvas, so only do it when the size changes.
      if (CANVAS.width !== renderWidth) CANVAS.width = renderWidth;
      if (CANVAS.height !== CANVAS_HEIGHT + band) CANVAS.height = CANVAS_HEIGHT + band;
      const ctx = CANVAS.getContext('2d');
      const spacing = SPACING;
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 1;
        // The staff/tab sits under the lyric band (when there is one); the
        // chord names stay at the top.
        ctx.save();
        ctx.translate(0, band);

        if (viewMode === 'tab') {
          drawTabLines(ctx);
          for (let i = 0; i < measureLines.length; i++){
            ctx.beginPath();
            ctx.moveTo(measureLines[i], STAFF_Y_OFFSET + 45);
            ctx.lineTo(measureLines[i], STAFF_Y_OFFSET + 105);
            ctx.stroke();
          }

          drawTabLabel(ctx);

          drawTabNotes(ctx);
        } else {
          MAIN_LINES_Y.forEach((pitchY) => {
            const y = pitchY + STAFF_Y_OFFSET;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(renderWidth, y);
            ctx.stroke();
          });
          // The extra ledger lines above/below the staff are drawn per-note
          // in drawNote/drawLedgerLines, not as permanent lines here - notes
          // can still be placed on them and in the spaces around them.

          for (let i = 0; i < measureLines.length; i++){
            ctx.beginPath();
            ctx.moveTo(measureLines[i], STAFF_Y_OFFSET + MAIN_LINES_Y[0]);
            ctx.lineTo(measureLines[i], STAFF_Y_OFFSET + MAIN_LINES_Y[MAIN_LINES_Y.length - 1]);
            ctx.stroke();
          }

          const rawIndex = Math.round((MOUSE.y - STAFF_Y_OFFSET) / spacing);
          const index = Math.min(NOTE_MAX_Y / spacing, Math.max(NOTE_MIN_Y / spacing, rawIndex));

          // Centered on the staff's actual middle line (D2), not the canvas's
          // geometric center - the canvas isn't vertically symmetric around
          // the staff since it has 3 ledger lines above but only 1 below.
          drawClef(ctx, { x: 45, y: MAIN_LINES_Y[2] + STAFF_Y_OFFSET, acc:'none' });

          bassNoteGrid.forEach((note) => {
            drawNote(ctx, note);
          });
          if (pendingNote) {
            const note = bassNoteGrid.find((n) => n.x === pendingNote.x && n.y === pendingNote.y);
            if (note) {
              if (rhythmEditable) drawRhythmStrip(ctx, bassNoteGrid.indexOf(note));
              // Its choices draw over the strip. (A note the strip joined
              // into a rest stays selected there, without them.)
              if (isStaffPitch(note.y)) {
                drawAccidentalOptions(ctx, note, spacing);
                drawRestOption(ctx, note);
              }
            }
          }

          // Where a click would put a note - unless a note's choices are up,
          // when a click picks one or dismisses them instead.
          if (!pendingNote) {
            const location = {
              x: mouseX(bassGrid),
              y: index * spacing,
              acc: 'none'
            };
            drawNote(ctx, location);
          }
        }
        ctx.restore();

        chordGrid.forEach((chord, i) => {
          displayChord(ctx, chord, bassGrid, chords[i])
        })
        drawLyrics(ctx);
      }
    }
  }

  useEffect(() => {
    // Event Listener Setup
    const CANVAS = canvasRef.current;

    function onMouseMove(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        const rect = CANVAS.getBoundingClientRect();
        const scrollLeft = document.documentElement.scrollLeft;
        const scrollTop = document.documentElement.scrollTop;
        MOUSE.x = event.clientX - rect.left - scrollLeft;
        MOUSE.y = event.clientY - rect.top - scrollTop - bandRef.current;
        requestDraw();
      }
    }

    function onMouseDown(event: MouseEvent) {
      MOUSE.isDown = true;
      // Tab view: click a string at a note to type its fret there. The
      // default mousedown action would move focus off the editor that just
      // opened (the canvas can't take focus), closing it again.
      if (viewMode === 'tab') {
        const cell = tabCellAtMouse();
        if (cell) {
          event.preventDefault();
          openTabEdit(cell.note.x, cell.stringIndex);
        }
        return;
      }
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        const spacing = SPACING;
        const fontSize = 20;

        // A note's choices are on display - this click picks one of its two
        // other accidentals or its matching rest, or dismisses them.
        if (pendingNote) {
          const note = bassNoteGrid.find((n) => n.x === pendingNote.x && n.y === pendingNote.y);
          if (note) {
            const pitched = isStaffPitch(note.y);
            const hit = pitched ? getAccidentalOptionLayout(note, spacing, fontSize).find((opt) =>
              MOUSE.x >= opt.x - 10 && MOUSE.x <= opt.x + fontSize &&
              MOUSE.y >= opt.y - fontSize && MOUSE.y <= opt.y + 6
            ) : undefined;
            const strip = rhythmEditable ? stripHit() : null;
            if (hit) {
              const updatedBassNotes = bassNoteGrid.map((n) =>
                n.x === note.x && n.y === note.y ? { ...n, acc: hit.acc } : n
              );
              dispatch(setBassState({ index: part, bassNoteLocations: updatedBassNotes }));
            } else if (pitched && hitsRestOption(note)) {
              // The rest keeps the note's length, so it's the matching rest.
              // Clicking its column on the staff puts a note back.
              const updatedBassNotes = bassNoteGrid.map((n) =>
                n.x === note.x && n.y === note.y ? { ...n, y: -20, acc: 'none', string: undefined } : n
              );
              dispatch(setBassState({ index: part, bassNoteLocations: updatedBassNotes }));
            } else if (strip) {
              // The strip stays open on the same note: its index moves up past
              // a split before it and back past a join before it, and a note
              // joined into the one before it goes with that one.
              const selected = bassNoteGrid.indexOf(note);
              refocusRef.current = selected > strip.k ? selected + (strip.op === 'split' ? 1 : -1) : selected;
              dispatch(editBassRhythm({ part, note: strip.k, op: strip.op }));
              return;
            }
          }
          setPendingNote(null);
          return;
        }

        const rawIndex = Math.round((MOUSE.y - STAFF_Y_OFFSET) / spacing);
        const index = Math.min(NOTE_MAX_Y / spacing, Math.max(NOTE_MIN_Y / spacing, rawIndex));
        const x = mouseX(bassGrid);

        // A note (not a rest) already sits in the exact cell being clicked -
        // show its two other accidental options instead of repositioning it.
        const clickedNote = bassNoteGrid.find(
          (note) => note.x === x && note.y === index * spacing && isStaffPitch(note.y)
        );

        if (clickedNote) {
          setPendingNote({ x: clickedNote.x, y: clickedNote.y });
        } else {
          const updatedBassNotes = bassNoteGrid.map((note) => {
            if (note.x === x) {
              return { ...note, y: index * spacing };
            }
            return note;
          });

          dispatch(setBassState({ index: part, bassNoteLocations: updatedBassNotes }));
        }
      }
    }

    function onMouseUp(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      MOUSE.isDown = false;
    }

    if (CANVAS) {
      CANVAS.addEventListener('mousemove', onMouseMove as any);
      CANVAS.addEventListener('mousedown', onMouseDown as any);
      CANVAS.addEventListener('mouseup', onMouseUp as any);
    }
    return () => {
      if (CANVAS) {
        CANVAS.removeEventListener('mousemove', onMouseMove as any);
        CANVAS.removeEventListener('mousedown', onMouseDown as any);
        CANVAS.removeEventListener('mouseup', onMouseUp as any);
      }
    };
    // Re-bound only when something the handlers read changes - not on every
    // playback step.
  }, [MOUSE, viewMode, pendingNote, bassNoteGrid, bassGrid, part, dispatch, requestDraw, tabEdit, rhythmEditable, rhythmTicks]);

  // ---- Tab fret editor -----------------------------------------------------

  // Open the editor on a note's column and string, showing the note's fret
  // if it's played on that string.
  function openTabEdit(x: number, stringIndex: number) {
    const k = bassNoteGrid.findIndex((n) => n.x === x);
    if (k === -1) return;
    const position = tabPositions(bassNoteGrid)[k];
    const value = position && position.stringIndex === stringIndex ? String(position.fret) : '';
    skipBlurCommit.current = false;
    setTabEdit({ x, stringIndex, value });
    setPendingNote(null);
  }

  // Apply what was typed: a fret number moves the note to that string and
  // fret (re-spelled on the staff for the key); empty or "x" on the note's
  // own string turns it into a rest. Anything else leaves it as it was.
  function commitTabEdit(edit: { x: number, stringIndex: number, value: string }) {
    const k = bassNoteGrid.findIndex((n) => n.x === edit.x);
    if (k === -1) return;
    const note = bassNoteGrid[k];
    const text = edit.value.trim().toLowerCase();
    const current = tabPositions(bassNoteGrid)[k];
    let updated: NoteLocation | null = null;
    if (text === '' || text === 'x' || text === '-') {
      if (current && current.stringIndex === edit.stringIndex) {
        updated = { ...note, y: -20, acc: 'none', string: undefined };
      }
    } else if (/^\d{1,2}$/.test(text) && Number(text) <= MAX_FRET) {
      const fret = Number(text);
      if (current && current.stringIndex === edit.stringIndex && current.fret === fret && note.string === edit.stringIndex) return;
      const midi = BASS_OPEN_MIDI[edit.stringIndex] + fret;
      const key = parseKeyString(song.key) ?? { tonic: 0, mode: 'major' as const };
      const spelled = spellPc(midi, key);
      const acc = spelled.acc > 0 ? 'sharp' : spelled.acc < 0 ? 'flat' : 'none';
      updated = { ...note, y: staffY(midi, spelled), acc, string: edit.stringIndex };
    }
    if (updated) {
      dispatch(setBassState({ index: part, bassNoteLocations: bassNoteGrid.map((n, i) => (i === k ? updated! : n)) }));
    }
  }

  function handleTabKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!tabEdit) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      skipBlurCommit.current = true;
      commitTabEdit(tabEdit);
      setTabEdit(null);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      skipBlurCommit.current = true;
      setTabEdit(null);
    } else if (event.key === 'Tab') {
      // Commit and move along the same string to the next (or previous) note.
      event.preventDefault();
      skipBlurCommit.current = true;
      commitTabEdit(tabEdit);
      const columns = bassNoteGrid.map((n) => n.x).filter((x) => bassGrid.includes(x)).sort((a, b) => a - b);
      const next = columns[columns.indexOf(tabEdit.x) + (event.shiftKey ? -1 : 1)];
      if (next !== undefined) {
        // Opened after the edit lands, reading the updated notes.
        setTimeout(() => openTabEditRef.current(next, tabEdit.stringIndex));
      } else {
        setTabEdit(null);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const n = Number(tabEdit.value);
      const base = tabEdit.value === '' || Number.isNaN(n) ? 0 : n;
      const value = Math.min(MAX_FRET, Math.max(0, base + (event.key === 'ArrowUp' ? 1 : -1)));
      setTabEdit({ ...tabEdit, value: String(value) });
    }
  }

  const openTabEditRef = useRef(openTabEdit);
  openTabEditRef.current = openTabEdit;

  const [isPlaying, setIsPlaying] = React.useState(false);
  const stopRef = useRef(false);

  const handleStartClick = async () => {
    if (isPlaying) {
      stopRef.current = true;
      setIsPlaying(false);
      onPlayingChange?.(false);
      return;
    }
    stopRef.current = false;
    setIsPlaying(true);
    onPlayingChange?.(true);
    const endBeat = await playBass(midi, beat, bassNoteGrid, bassGroove, bpm, () => stopRef.current, handleStep, drumGroove, undefined, acoustic);
    setIsPlaying(false);
    onPlayingChange?.(false);
    const nextBeat = endBeat >= bassGroove.length ? 0 : endBeat;
    dispatch(setCurrentBeat([part, song.selectedBeat[1], nextBeat, song.selectedBeat[3]]));
  };

  useImperativeHandle(ref, () => ({
    play: handleStartClick
  }));

  drawRef.current = drawScene;

  // Draw when what the staff shows changes, and once the clef image loads.
  useEffect(() => {
    requestDraw();
  }, [requestDraw, renderWidth, bassNoteGrid, bassGroove, chords, chordGrid, bassGrid, measureLines, pendingNote, viewMode, tabEdit, colors, lyrics, lyricXs]);

  useEffect(() => {
    if (!CLEF_IMAGE.complete) CLEF_IMAGE.addEventListener('load', requestDraw);
    return () => {
      CLEF_IMAGE.removeEventListener('load', requestDraw);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [requestDraw]);

  return (
    // Sticky positioning can only carry the button as far as this container's
    // own box extends. Left unset, the div shrinks to the visible viewport
    // width (the canvas merely overflows it visually), so the button would
    // stop sticking a screen-width into the scroll. Matching the canvas's
    // actual rendered width here gives it room to stick the whole way.
    <div style={{ width: renderWidth || '100%', position: 'relative' }}>
      <button
        type="button"
        onClick={() => onViewModeChange(viewMode === 'staff' ? 'tab' : 'staff')}
        className={viewMode === 'tab' ? `${appStyles.button} ${appStyles.openButton} ${appStyles.stickyToggle}` : `${appStyles.button} ${appStyles.stickyToggle}`}
      >
        {viewMode === 'staff' ? 'Staff' : 'Tab'}
      </button>
      <canvas ref={canvasRef} id="myCanvas" />
      {viewMode === 'tab' && tabEdit && (
        <input
          key={`${tabEdit.x}:${tabEdit.stringIndex}`}
          className={appStyles.tabInput}
          style={{
            left: tabEdit.x - 15,
            top: (canvasRef.current?.offsetTop ?? 0) + band + TAB_LINE_Y[rowOfString(tabEdit.stringIndex)] - 12,
          }}
          value={tabEdit.value}
          autoFocus
          inputMode="numeric"
          maxLength={2}
          aria-label="Fret number"
          title="Fret 0-20 · Enter to set · Tab for the next note · ↑↓ to step · x or empty to make a rest · Esc to cancel"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setTabEdit({ ...tabEdit, value: e.target.value.replace(/[^0-9xX-]/g, '') })}
          onKeyDown={handleTabKey}
          onBlur={() => {
            if (!skipBlurCommit.current) commitTabEdit(tabEdit);
            skipBlurCommit.current = false;
            // Clicking another cell opens its editor before this one blurs;
            // close only if this edit is still the open one.
            setTabEdit((open) => (open === tabEdit ? null : open));
          }}
        />
      )}
    </div>
  )
});

export default BassStaff;