import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import playBass from '../Playback/playBass';
import { setBassState, setCurrentBeat, SongState } from '../reducers';
import { PlayHandle } from './Piano';
import { useLampStep } from '../Playback/useLampStep';

interface BassStaffProps {
  renderWidth: number;
  part: number;
  lampsRef: React.MutableRefObject<HTMLInputElement[]>;
  onPlayingChange?: (isPlaying: boolean) => void;
}


const BassStaff = forwardRef<PlayHandle, BassStaffProps>(function BassStaff({ renderWidth, part, lampsRef, onPlayingChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CLEF_IMAGE = new Image();
  CLEF_IMAGE.src = "/BassClef.png";
  const dispatch = useDispatch()

  const song = useSelector((state: { song: SongState }) => state.song);
  const bpm = song.bpm
  const midi = song.midi
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
        chordGrid.forEach((chord, i) => {
          displayChord(ctx, chord, bassGrid, chords[i])
        })

        const location = {
          x: mouseX(bassGrid),
          y: index * spacing,
          acc: 'none'
        };
        drawNote(ctx, location);
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
  }, [MOUSE]);

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
    const endBeat = await playBass(midi, beat, bassNoteGrid, bassGroove, bpm, () => stopRef.current, handleStep, drumGroove);
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
  }, [renderWidth, bassNoteGrid, bassGroove, chords, chordGrid, bassGrid, pendingNote, MOUSE]);

  return (
    <div>
      <canvas ref={canvasRef} id="myCanvas" />
    </div>
  )
});

export default BassStaff;