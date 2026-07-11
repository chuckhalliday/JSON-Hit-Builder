import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import playBass from '../Playback/playBass';
import { setBassState, setCurrentBeat, SongState } from '../reducers';
import { PlayHandle } from './Piano';
import { useLampStep } from '../Playback/useLampStep';
import appStyles from '../Styles/App.module.scss';

// Standard 4-string bass tuning (E1 A1 D2 G2), lowest to highest, expressed as
// the real MIDI note number of each open string - matches the `midi` values
// already stored on notes (see bassPitch.ts), so no pixel/pitch translation
// is needed here.
const BASS_OPEN_MIDI = [28, 33, 38, 43];
// Horizontal position of each tab line, top to bottom (G D A E) - the same
// vertical band the 5-line staff occupies, so switching views doesn't reflow
// the canvas.
const TAB_LINE_Y = [52.5, 67.5, 82.5, 97.5];

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

interface BassStaffProps {
  renderWidth: number;
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
  onPlayingChange?: (isPlaying: boolean) => void;
  viewMode: 'staff' | 'tab';
  onViewModeChange: (viewMode: 'staff' | 'tab') => void;
}


const BassStaff = forwardRef<PlayHandle, BassStaffProps>(function BassStaff({ renderWidth, part, lampsRef, onPlayingChange, viewMode, onViewModeChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CLEF_IMAGE = new Image();
  CLEF_IMAGE.src = "/BassClef.png";
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

  const [pendingNote, setPendingNote] = React.useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    setPendingNote(null);
  }, [part]);

  const MOUSE = {
    x: -10,
    y: -10,
    isDown: false
  };


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
    const baseY = location.y - spacing * 2 + fontSize;
    const gap = fontSize + 6;
    return getAccidentalOptions(location.acc).map((acc, i) => ({
      acc,
      symbol: ACCIDENTAL_SYMBOLS[acc],
      x,
      y: baseY + (i === 0 ? -gap : gap)
    }));
  }

  function drawAccidentalOptions(ctx: CanvasRenderingContext2D, location: { x: number, y: number, acc: string }, spacing: number) {
    const fontSize = 20;
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = "black";
    getAccidentalOptionLayout(location, spacing, fontSize).forEach((opt) => {
      ctx.fillText(opt.symbol, opt.x, opt.y);
    });
  }

  function drawClef(ctx: CanvasRenderingContext2D, location: { x: number, y: number, acc: string }) {
    const CANVAS = canvasRef.current;
    if (CANVAS) {
      const aspectRatio = CLEF_IMAGE.width / CLEF_IMAGE.height;
      const newHeight = CANVAS.height * 0.52;
      const newWidth = aspectRatio * newHeight;

      ctx.drawImage(CLEF_IMAGE,
        location.x - newWidth / 2, location.y - newHeight / 2,
        newWidth, newHeight);
    }
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
      const spacing = CANVAS.height / 20;
      const groove = bassGroove[index];
      ctx.fillStyle = "black";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;

      const fontSize = 20;
      ctx.font = `${fontSize}px serif`;

      //draw notes
      if (location.y >= 30) {
        //add line for notes up to dotted half
        if (groove <= 2.5) {
          ctx.beginPath();
          ctx.moveTo(location.x + spacing,
            location.y);
          ctx.lineTo(location.x + spacing,
            location.y - spacing * 5);
          ctx.stroke();
          }
          //add flag for notes smaller than quarter note
          if(groove < 1){
            ctx.beginPath();
            ctx.moveTo(location.x + spacing,
              location.y - spacing * 5);
            ctx.bezierCurveTo(
              location.x + spacing * 2, location.y - spacing * 3,
              location.x + spacing * 2.5, location.y - spacing * 3,
              location.x + spacing * 2.5, location.y - spacing * 1);
            ctx.bezierCurveTo(
              location.x + spacing * 2.5, location.y - spacing * 2.7,
              location.x + spacing * 2, location.y - spacing * 2.7,
              location.x + spacing, location.y - spacing * 4.5);
            ctx.stroke();
            ctx.fill();
          }
          //add double flag for sixteenth notes
          if(groove === 0.25){
            if (location.y >= 30) {
              ctx.beginPath();
              ctx.moveTo(location.x + spacing, location.y - spacing * 5 + 8);
              ctx.bezierCurveTo(
                location.x + spacing * 2, location.y - spacing * 3 + 7,
                location.x + spacing * 2.5, location.y - spacing * 3 + 7,
                location.x + spacing * 2.5, location.y - spacing * 1 + 4);
              ctx.bezierCurveTo(
                location.x + spacing * 2.5, location.y - spacing * 2.7 + 7,
                location.x + spacing * 2, location.y - spacing * 2.7 + 7,
                location.x + spacing, location.y - spacing * 4.5 + 4);
              ctx.stroke();
              ctx.fill();
            } 
          }
        if (location.acc === 'flat') {
          ctx.fillText('♭', location.x + spacing * -3.5, location.y - spacing * 2 + fontSize);
        }
        if (location.acc === 'sharp') {
          ctx.fillText('#', location.x + spacing * -2.5, location.y - spacing * 1.9 + fontSize );
        }
        //add dots for syncopated notes
        if (groove === 2.5 || groove === 1.5 || groove === 0.75) {
          ctx.beginPath();
          ctx.arc(location.x + spacing + 8, location.y - 3.8, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        //draw actual note
        ctx.beginPath();
        ctx.save();
        ctx.translate(location.x, location.y);
        ctx.rotate(-0.2);
        ctx.scale(1.05, 0.8);
        ctx.arc(0, 0, spacing, 0, Math.PI * 2);

        //half to quarter note fill
        if(groove <= 1.5){
          ctx.fill();
        }
      //draw rests
      } else {
        //half rest  
        if (groove <= 2) {
          if (groove === 2) {
            ctx.beginPath();
            ctx.moveTo(location.x + spacing,
              75);
            ctx.lineTo(location.x + spacing,
              68);
            ctx.lineTo(location.x - spacing,
              68);
            ctx.lineTo(location.x - spacing,
              75);
            ctx.stroke()
            ctx.fill();
            //draw quarter rest
          } else if (groove >= 1) {
            ctx.beginPath();
            ctx.moveTo(location.x - 5, 51);
            ctx.lineTo(location.x + 5, 66);
            ctx.lineTo(location.x + 1, 75);
            ctx.lineTo(location.x + 7, 87);
            ctx.quadraticCurveTo(location.x - 6, 83, location.x + 4, 98)
            ctx.quadraticCurveTo(location.x - 15, 79, location.x + 4, 83)
            ctx.lineTo(location.x - 5, 69)
            ctx.quadraticCurveTo(location.x + 5, 68, location.x - 5, 52)
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.stroke();
            //dotted quarter
            if (groove === 1.5) {
              ctx.beginPath();
              ctx.arc(location.x + 12, 70, 2.8, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (groove < 1) {
            //eighth
            ctx.beginPath();
            ctx.moveTo(location.x - 1, 88);
            ctx.lineTo(location.x + 8, 65);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(location.x - 6, 67, 3.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(location.x - 8, 69);
            ctx.quadraticCurveTo(location.x - 5, 72, location.x + 8, 65);
            ctx.stroke();
            //dotted eigth
            if (groove === 0.75) {
              ctx.beginPath();
              ctx.arc(location.x + 14, 67, 2.8, 0, Math.PI * 2);
              ctx.fill();
            }
            //sixteenth rest
            if(groove === 0.25) {
              ctx.beginPath();
              ctx.moveTo(location.x - 6, 103);
              ctx.lineTo(location.x + 8, 65);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.arc(location.x - 6, 67, 3.5, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(location.x - 8, 69);
              ctx.quadraticCurveTo(location.x - 5, 72, location.x + 8, 65);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.arc(location.x - 9, 82, 3.5, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(location.x - 10, 83);
              ctx.quadraticCurveTo(location.x - 8, 87, location.x + 2, 81);
              ctx.stroke();
            }
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function displayChord(ctx: CanvasRenderingContext2D, location: number, bassGrid: number[], chordName: string) {
    const CANVAS = canvasRef.current;
    if (CANVAS) {
      const spacing = CANVAS.height / 20;
      const fontSize = 20;
      ctx.fillStyle = "black";
      ctx.font = `${fontSize}px serif`;
  
      for (let i = 1; i < bassGrid.length; i++) {
        const isMatch = location === bassGrid[i];
        if (isMatch) {
          ctx.fillText(chordName, location - spacing, CANVAS.height - 136);
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
    ctx.fillStyle = 'black';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('T', 20, 62);
    ctx.fillText('A', 20, 75);
    ctx.fillText('B', 20, 88);
    ctx.textAlign = 'left';
  }

  function drawTabNotes(ctx: CanvasRenderingContext2D) {
    // Walked left to right so each note's string/fret choice can favor
    // staying close to wherever the previous note left the hand, rather than
    // being picked in isolation.
    const orderedNotes = [...bassNoteGrid].sort((a, b) => a.x - b.x);
    let previous: TabPosition | null = null;

    orderedNotes.forEach((note) => {
      let match = false;
      for (let i = 1; i < bassGrid.length; i++) {
        if (note.x === bassGrid[i]) {
          match = true;
          break;
        }
      }
      if (!match) return;

      const position = midiToTabPosition(note.midi, previous);
      if (!position) return; // rest - leave the hand position as-is

      previous = position;

      // Strings are numbered low (E) to high (G); the tab lines are drawn top
      // (G) to bottom (E), so the display row is the mirror of the string index.
      const displayRow = BASS_OPEN_MIDI.length - 1 - position.stringIndex;
      const y = TAB_LINE_Y[displayRow];

      // Blank out the line under the number so it reads clearly, matching how
      // printed tab renders fret numbers directly on the string.
      ctx.fillStyle = 'white';
      ctx.fillRect(note.x - 8, y - 7, 16, 14);

      ctx.fillStyle = 'black';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(position.fret), note.x, y + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });
  }

  function drawScene() {
    const CANVAS = canvasRef.current;
    if (CANVAS) {
      CANVAS.width = renderWidth; // Set canvas width based on renderWidth prop
      const ctx = CANVAS.getContext('2d');
      const spacing = CANVAS.height / 20;
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;

        if (viewMode === 'tab') {
          drawTabLines(ctx);
          for (let i = 0; i < measureLines.length; i++){
            ctx.beginPath();
            ctx.moveTo(measureLines[i], 45);
            ctx.lineTo(measureLines[i], 105);
            ctx.stroke();
          }

          drawTabLabel(ctx);

          drawTabNotes(ctx);
        } else {
          for (let i = -2; i <= 2; i++) {
            const y = CANVAS.height / 2 + i * spacing * 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(renderWidth, y);
            ctx.stroke();
          }
          for (let i = 0; i < measureLines.length; i++){
            ctx.beginPath();
            ctx.moveTo(measureLines[i], 45);
            ctx.lineTo(measureLines[i], 105);
            ctx.stroke();
          }

          const index = Math.round(MOUSE.y / spacing);

          drawClef(ctx, { x: 45, y: CANVAS.height / 2, acc:'none' });

          bassNoteGrid.forEach((note) => {
            drawNote(ctx, note);
          });
          if (pendingNote) {
            const note = bassNoteGrid.find((n) => n.x === pendingNote.x && n.y === pendingNote.y);
            if (note) {
              drawAccidentalOptions(ctx, note, spacing);
            }
          }

          const location = {
            x: mouseX(bassGrid),
            y: index * spacing,
            acc: 'none'
          };
          drawNote(ctx, location);
        }

        chordGrid.forEach((chord, i) => {
          displayChord(ctx, chord, bassGrid, chords[i])
        })
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
        MOUSE.y = event.clientY - rect.top - scrollTop;
      }
    }

    function onMouseDown() {
      MOUSE.isDown = true;
      // Tab view is a read-only conversion of the staff - pitch editing (which
      // repositions notes by staff row) doesn't apply to it.
      if (viewMode === 'tab') return;
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        const spacing = CANVAS.height / 20;
        const fontSize = 20;

        // Accidental options are currently on display for a note - this click
        // either picks one of the two offered symbols or dismisses them.
        if (pendingNote) {
          const note = bassNoteGrid.find((n) => n.x === pendingNote.x && n.y === pendingNote.y);
          if (note) {
            const hit = getAccidentalOptionLayout(note, spacing, fontSize).find((opt) =>
              MOUSE.x >= opt.x - 10 && MOUSE.x <= opt.x + fontSize &&
              MOUSE.y >= opt.y - fontSize && MOUSE.y <= opt.y + 6
            );
            if (hit) {
              const updatedBassNotes = bassNoteGrid.map((n) =>
                n.x === note.x && n.y === note.y ? { ...n, acc: hit.acc } : n
              );
              dispatch(setBassState({ index: part, bassNoteLocations: updatedBassNotes }));
            }
          }
          setPendingNote(null);
          return;
        }

        const index = Math.round(MOUSE.y / spacing);
        const x = mouseX(bassGrid);

        // A note (not a rest) already sits in the exact cell being clicked -
        // show its two other accidental options instead of repositioning it.
        const clickedNote = bassNoteGrid.find(
          (note) => note.x === x && note.y === index * spacing && note.y >= 30
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
  }, [MOUSE, viewMode]);

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

  useEffect(() => {
    function main() {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        animate();
      }
    }

    function animate() {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        drawScene();
        window.requestAnimationFrame(animate);
      }
    }
    main();
  }, [renderWidth, bassNoteGrid, bassGroove, chords, chordGrid, bassGrid, pendingNote, MOUSE, viewMode]);

  return (
    // Sticky positioning can only carry the button as far as this container's
    // own box extends. Left unset, the div shrinks to the visible viewport
    // width (the canvas merely overflows it visually), so the button would
    // stop sticking a screen-width into the scroll. Matching the canvas's
    // actual rendered width here gives it room to stick the whole way.
    <div style={{ width: renderWidth || '100%' }}>
      <button
        type="button"
        onClick={() => onViewModeChange(viewMode === 'staff' ? 'tab' : 'staff')}
        className={viewMode === 'tab' ? `${appStyles.button} ${appStyles.openButton} ${appStyles.stickyToggle}` : `${appStyles.button} ${appStyles.stickyToggle}`}
      >
        {viewMode === 'staff' ? 'Tab' : 'Staff'}
      </button>
      <canvas ref={canvasRef} id="myCanvas" />
    </div>
  )
});

export default BassStaff;