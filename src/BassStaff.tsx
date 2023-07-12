import React, { useEffect, useRef } from 'react';

interface BassStaffProps {
  renderWidth: number;
  drumGroove: number[];
  bassGroove: number[];
}

export default function BassStaff({ renderWidth, drumGroove, bassGroove }: BassStaffProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CLEF_IMAGE = new Image();
  CLEF_IMAGE.src = "/BassClef.png";
  console.log(renderWidth)
  console.log(drumGroove.length)

  const NOTES = ["G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3",
    "C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2", "B1", "A1"];

  const MOUSE = {
    x: 0,
    y: 0,
    isDown: false
  };

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
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        MOUSE.x = event.clientX - rect.left - scrollLeft;
        MOUSE.y = event.clientY - rect.top - scrollTop;
      }
    }

    function onMouseDown(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      MOUSE.isDown = true;
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

    function drawNote(ctx: CanvasRenderingContext2D, location: { x: number, y: number }) {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        const spacing = CANVAS.height / 20;
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(location.x + spacing,
          location.y);
        ctx.lineTo(location.x + spacing,
          location.y - spacing * 5);
        ctx.stroke();

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

        ctx.beginPath();
        ctx.save();
        ctx.translate(location.x, location.y);
        ctx.rotate(-0.2);
        ctx.scale(1.05, 0.8);
        ctx.arc(0, 0, spacing, 0, Math.PI * 2);
        ctx.fill();
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

          let bassGrid: number[]=[115]
          let gridX: number = 115
          let bassSum: number = bassGroove[0]
          let drumSum: number = 0
          let bassIndex: number = 1
          for (let i = 0; i < drumGroove.length; i++) {
            drumSum+= drumGroove[i]
            if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
              gridX += 78
            } else if (Math.abs(drumSum - Math.round(drumSum)) <= 0.005) {
              gridX += 48
            } else {
              gridX += 38
            }
            if (drumSum === bassSum) {
              bassGrid.push(gridX)
              if (bassSum >= 7.93 && bassSum <= 8.07) {
                bassSum = 0
                drumSum = 0
              }
              bassSum += bassGroove[bassIndex]
              bassIndex++
            }
          }
          console.log(bassGrid)

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
          // Start 100, box 30, space 8, 24 space 10, 7 margin space 40 660
          console.log(`Mouse: ${MOUSE.x}`);

          const location = {
            x: mouseX(bassGrid),
            y: index * spacing
          };
          drawNote(ctx, location);

          drawClef(ctx, { x: 45, y: CANVAS.height / 2 });
        }
      }
    }

    main();
  }, [renderWidth, MOUSE]);

  return <canvas ref={canvasRef} id="myCanvas" />;
}