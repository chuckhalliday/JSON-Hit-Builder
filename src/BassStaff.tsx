import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playBass } from './SongStructure/playParts';
import { setBassVerse, setBassChorus, setBassBridge } from './Reducers/bassLine';

import styles from "./DrumMachine.module.scss";

interface BassStaffProps {
  renderWidth: number;
  bass: string[];
  drumGroove: number[];
  bassGroove: number[];
  part: string
}


export default function BassStaff({ renderWidth, bass, drumGroove, bassGroove, part }: BassStaffProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CLEF_IMAGE = new Image();
  CLEF_IMAGE.src = "/BassClef.png";
  const dispatch = useDispatch()

  console.log(part)

  const bpm = useSelector((state: { bpm: { value: number } }) => state.bpm.value);

/*  const NOTES = ["G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3",
    "C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2", "B1", "A1"]; */

  let bassArray: number[]=[115]
  let gridX: number = 115
  let bassSum: number = bassGroove[0]
  let drumSum: number = 0
  let bassIndex: number = 1
  for (let i = 0; i < drumGroove.length; i++) {
    drumSum+= drumGroove[i]
    if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
      gridX += 78
    } else if (Math.abs(Math.round(drumSum) - drumSum) <= 0.005) {
      gridX += 48
    } else {
      gridX += 38
    }
    if (bassSum - drumSum <= 0.05) {
      bassArray.push(gridX)
      if (bassSum >= 7.95 && drumSum >= 7.95) {
        bassSum = 0
        drumSum = 0
      }
      bassSum += bassGroove[bassIndex]
      bassIndex++
    }
  }

  const [bassGrid, setBassGrid] = useState<number[]>(bassArray)

  function drawBass() {
    let bassNoteLocations: {x: number, y: number }[] = [];
    
    for (let i = 0; i < bassGrid.length; i++) {
      let noteLocation: {x: number, y: number } = { x: 0, y: 0 }; // Create a new object for each iteration
    
        noteLocation.x = bassGrid[i];
        if (bass[i] === 'G' || bass[i] === 'G#' || bass[i] === 'Gb') {
          noteLocation.y = 52.5;
        } else if (bass[i] === 'F' || bass[i] === 'F#') {
          noteLocation.y = 60;
        } else if (bass[i] === 'E' || bass[i] === 'Eb') {
          noteLocation.y = 67.5;
        } else if (bass[i] === 'D' || bass[i] === 'D#' || bass[i] === 'Db') {
          noteLocation.y = 75;
        } else if (bass[i] === 'C' || bass[i] === 'C#') {
          noteLocation.y = 82.5;
        } else if (bass[i] === 'B' || bass[i] === 'Bb') {
          noteLocation.y = 90;
        } else if (bass[i] === 'A' || bass[i] === 'A#' || bass[i] === 'Ab') {
          noteLocation.y = 97.5;
        } else {
          noteLocation.y = -20
        }
    
        bassNoteLocations.push(noteLocation);
      }
    
      return bassNoteLocations;
    }
  


  const bassNotesRef = React.useRef<{x: number, y: number}[]>(drawBass())

  function setBassState() {
  const bassNotes = bassNotesRef.current

  if (part === 'Verse') {
    dispatch(setBassVerse(bassNotes))
  } else if (part === 'Chorus') {
    dispatch(setBassChorus(bassNotes))
  } else if (part === 'Bridge') {
    dispatch(setBassBridge(bassNotes))
  }
}

  const MOUSE = {
    x: 0,
    y: 0,
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
        setBassState()
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
        setBassState()
      }
    }

    function onMouseUp(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      MOUSE.isDown = false;
    }

    function drawClef(ctx: CanvasRenderingContext2D, location: { x: number, y: number }) {
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

    function drawNote(ctx: CanvasRenderingContext2D, location: { x: number, y: number }, bassGrid: number[], bassGroove: number[]) {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        const spacing = CANVAS.height / 20;
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        for (let i = 0; i < bassGrid.length; i++){
          const isMatch = location.x === bassGrid[i];
          const groove = bassGroove[i];
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

          drawClef(ctx, { x: 45, y: CANVAS.height / 2 });

          bassNotesRef.current.forEach((note) => {
            drawNote(ctx, note, bassGrid, bassGroove);
          });

          const location = {
            x: mouseX(bassGrid),
            y: index * spacing
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


  return <div>
          <canvas ref={canvasRef} id="myCanvas" />
                {/* Renders controls */}
      <div className={styles.controls}>
        <button onClick={handleStartClick} className={styles.button}>
          {isPlaying ? "Pause" : "Start"}
        </button>
      </div>
          </div>
}