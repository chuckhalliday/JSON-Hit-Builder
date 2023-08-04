import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playBass } from './SongStructure/playParts';
import { setBassState, SongState } from './reducers';

import styles from "./DrumMachine.module.scss";

interface BassStaffProps {
  renderWidth: number;
  part: number
}


export default function BassStaff({ renderWidth, part }: BassStaffProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CLEF_IMAGE = new Image();
  CLEF_IMAGE.src = "/BassClef.png";
  const dispatch = useDispatch()

  const bpm = useSelector((state: { song: { bpm: number } }) => state.song.bpm);

  const bassGrid = useSelector((state: { song: SongState }) => state.song.songStructure[part].bassGrid);
  const bassNoteGrid = useSelector((state: { song: SongState }) => state.song.songStructure[part].bassNoteLocations);
  const bassGroove = useSelector((state: { song: SongState}) => state.song.songStructure[part].bassGroove);

/*  const NOTES = ["G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3",
    "C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2", "B1", "A1"]; */

  const bassNotesRef = React.useRef<{x: number, y: number, acc: string}[]>(bassNoteGrid)

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

  useEffect(() => {
    function main() {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        addEventListeners();
        drawScene();
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

    function addEventListeners() {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        CANVAS.addEventListener('mousemove', onMouseMove as any);
        CANVAS.addEventListener('mousedown', onMouseDown as any);
        CANVAS.addEventListener('mouseup', onMouseUp as any);
      }
    }

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
    
        bassNotesRef.current = bassNotesRef.current.map((note) => {
          if (note.x === x) {
            return { ...note, y: index * spacing };
          }
          return note;
        });
        dispatch(setBassState({index: part, bassNoteLocations: bassNotesRef.current}))
      }
    }

    function onMouseUp(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      MOUSE.isDown = false;
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

        for (let i = 0; i < bassGrid.length; i++){
          const isMatch = location.x === bassGrid[i];
          const groove = bassGroove[i];
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
          if (isMatch && groove <= 2) {
            ctx.beginPath();
            ctx.moveTo(location.x + spacing,
              location.y);
            ctx.lineTo(location.x + spacing,
              location.y - spacing * 5);
            ctx.stroke();
          }
          if(location.x === bassGrid[i] && bassGroove[i] <= 0.75){
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
          if(location.x === bassGrid[i] && bassGroove[i] <= 0.25){
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
        ctx.beginPath();
        ctx.save();
        ctx.translate(location.x, location.y);
        ctx.rotate(-0.2);
        ctx.scale(1.05, 0.8);
        ctx.arc(0, 0, spacing, 0, Math.PI * 2);

        //half to quarter note fill
        for (let i = 0; i < bassGrid.length; i++) {
          if(location.x === bassGrid[i] && bassGroove[i] <= 1.5){
        ctx.fill();
          }
        }
        
        ctx.stroke();
        ctx.restore();
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

          const index = Math.round(MOUSE.y / spacing);

          drawClef(ctx, { x: 45, y: CANVAS.height / 2, acc:'none' });

          bassNotesRef.current.forEach((note) => {
            drawNote(ctx, note, bassGrid, bassGroove);
          });

          const location = {
            x: mouseX(bassGrid),
            y: index * spacing,
            acc: 'none'
          };
          drawNote(ctx, location, bassGrid, bassGroove);
        }
      }
    }

    main();
  }, [renderWidth, MOUSE]);

  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleStartClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      playBass(bassNotesRef.current, bassGroove, bpm);
      setIsPlaying(true);
    }
  };


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