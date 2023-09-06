import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playBass } from '../SongStructure/playParts';
import { setBassState, SongState } from '../reducers';

import styles from "../Styles/DrumMachine.module.scss";

interface BassStaffProps {
  renderWidth: number;
  part: number
}


export default function BassStaff({ renderWidth, part }: BassStaffProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CLEF_IMAGE = new Image();
  CLEF_IMAGE.src = "/BassClef.png";
  const dispatch = useDispatch()

  const song = useSelector((state: { song: SongState }) => state.song);
  const bpm = song.bpm
  const midi = song.midi
  const beat = song.selectedBeat[1]

  const bassGrid = song.songStructure[part].bassGrid
  const bassNoteGrid = song.songStructure[part].bassNoteLocations
  const bassGroove = song.songStructure[part].bassGroove
  const chords = song.songStructure[part].chords
  const chordGrid = song.songStructure[part].chordsLocation
  const measureLines = song.songStructure[part].measureLines

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

  function drawNote(ctx: CanvasRenderingContext2D, location: { x: number, y: number, acc: string }, bassGrid: number[], bassGroove: number[]) {
    const CANVAS = canvasRef.current;
    if (CANVAS) {
      const spacing = CANVAS.height / 20;
      ctx.fillStyle = "black";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;

      const fontSize = 20;
      ctx.font = `${fontSize}px serif`;

      for (let i = 1; i < bassGrid.length; i++){
        const isMatch = location.x === bassGrid[i];
        const groove = bassGroove[i - 1];
        if (location.y >= 30) {
        if (location.x === bassGrid[i] && location.acc === 'flat') {
          ctx.fillText('♭', location.x + spacing * -3.5, location.y - spacing * 2 + fontSize);
        }
        if (location.x === bassGrid[i] && location.acc === 'sharp') {
          ctx.fillText('#', location.x + spacing * -2.5, location.y - spacing * 1.9 + fontSize );
        }
        if (isMatch && groove === 1.5 || isMatch && groove === 0.75) {
          ctx.beginPath();
          ctx.arc(location.x + spacing + 8, location.y - 3.8, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
        if (isMatch && groove <= 2) {
          if (location.y < 30 && groove === 2) {
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
          } else if (location.y < 30 && groove >= 1) {
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
            if (groove === 1.5) {
              ctx.beginPath();
              ctx.arc(location.x + 12, 70, 2.8, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (location.y < 30 && groove >= 0.5) {
            ctx.beginPath();
            ctx.moveTo(location.x - 2, 88);
            ctx.lineTo(location.x + 8, 65);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(location.x - 6, 67, 3.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(location.x - 8, 69);
            ctx.quadraticCurveTo(location.x - 5, 72, location.x + 8, 65);
            ctx.stroke();
            if (groove === 0.75) {
              ctx.beginPath();
              ctx.arc(location.x + 14, 67, 2.8, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (location.y >= 30) {
          ctx.beginPath();
          ctx.moveTo(location.x + spacing,
            location.y);
          ctx.lineTo(location.x + spacing,
            location.y - spacing * 5);
          ctx.stroke();
          }
        }
        if(location.x === bassGrid[i] && bassGroove[i - 1] <= 0.75 && location.y >= 30){
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
        if(location.x === bassGrid[i] && bassGroove[i - 1] <= 0.25){
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
          } else {
            ctx.beginPath();
            ctx.moveTo(location.x - 5, 103);
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
      if (location.y >= 30) {
      ctx.beginPath();
      ctx.save();
      ctx.translate(location.x, location.y);
      ctx.rotate(-0.2);
      ctx.scale(1.05, 0.8);
      ctx.arc(0, 0, spacing, 0, Math.PI * 2);
      }

      //half to quarter note fill
      for (let i = 1; i < bassGrid.length; i++) {
        if(location.x === bassGrid[i] && bassGroove[i - 1] <= 1.5 && location.y >= 30){
          ctx.fill();
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
          drawNote(ctx, note, bassGrid, bassGroove);
        });
        chordGrid.forEach((chord, i) => {
          displayChord(ctx, chord, bassGrid, chords[i])
        })

        const location = {
          x: mouseX(bassGrid),
          y: index * spacing,
          acc: 'none'
        };
        drawNote(ctx, location, bassGrid, bassGroove);
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
        const index = Math.round(MOUSE.y / spacing);
        const x = mouseX(bassGrid);
    
        const updatedBassNotes = bassNoteGrid.map((note) => {
          if (note.x === x) {
            return { ...note, y: index * spacing };
          }
          return note;
        });
  
        dispatch(setBassState({ index: part, bassNoteLocations: updatedBassNotes }));
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

  const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      playBass(midi, beat, bassNoteGrid, bassGroove, bpm);
      setIsPlaying(true);
    }
  };
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
  }, [renderWidth, bassNoteGrid, bassGroove, chords, chordGrid, bassGrid, MOUSE]);

  return ( 
    <div>
      <canvas ref={canvasRef} id="myCanvas" />
      {/* Renders controls */}
      <div className={styles.controls}>
          <button onClick={handleStartClick} className={styles.button}>
            {isPlaying ? "Pause" : "Play Bass"}
          </button>
      </div>
    </div>
  )
}