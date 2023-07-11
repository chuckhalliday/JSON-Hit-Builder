import React, { useEffect, useRef } from 'react';

import styles from "./BassStaff.module.scss";

interface BassStaffProps {
  renderWidth: number;
}

export default function BassStaff({ renderWidth }: BassStaffProps) {
  let canvasRef = useRef<HTMLCanvasElement | null>(null);
  let CANVAS = canvasRef.current
  let CLEF_IMAGE=new Image()
  CLEF_IMAGE.src="/BassClef.png"

  useEffect(() => {
    function main() {
      drawScene();
    }

    function drawClef(ctx: CanvasRenderingContext2D, location: {x: number, y:number}) {
      if (CANVAS) {
        let aspectRatio=CLEF_IMAGE.width/CLEF_IMAGE.height;
        let newHeight=CANVAS.height*0.52;
        let newWidth=aspectRatio*newHeight;

        ctx.drawImage(CLEF_IMAGE,
          location.x-newWidth/2, location.y-newHeight/2,
          newWidth, newHeight);
      }
    }

    function drawNote(ctx: CanvasRenderingContext2D, location: {x: number, y: number}) {
      if (CANVAS) {
        const spacing = CANVAS.height / 20;
        ctx.fillStyle="black";
        ctx.strokeStyle="black";
        ctx.lineWidth=1;

        ctx.beginPath();
        ctx.moveTo(location.x+spacing,
          location.y);
        ctx.lineTo(location.x+spacing,
          location.y-spacing*5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(location.x+spacing,
          location.y-spacing*5);
        ctx.bezierCurveTo(
          location.x+spacing*2, location.y-spacing*3,
          location.x+spacing*2.5, location.y-spacing*3,
          location.x+spacing*2.5, location.y-spacing*1);
        ctx.bezierCurveTo(
          location.x+spacing*2.5, location.y-spacing*2.7,
          location.x+spacing*2, location.y-spacing*2.7,
          location.x+spacing, location.y-spacing*4.5);
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        ctx.save();
        ctx.translate(location.x, location.y);
        ctx.rotate(-0.2);
        ctx.scale(1.05, 0.8)
        ctx.arc(0, 0, spacing, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawScene() {
      if (CANVAS) {
        CANVAS.width = renderWidth; // Set canvas width based on renderWidth prop
        const ctx = CANVAS.getContext('2d');
        const spacing = CANVAS.height / 20;
        if (ctx) {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          for (let i = -2; i <= 2; i++) {
            const y = CANVAS.height / 2 + i * spacing * 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(renderWidth, y);
            ctx.stroke();
          }

          let location = {
            x:CANVAS.width/2,
            y:CANVAS.height/2
          }
          drawNote(ctx, location)
          
          location.x-=CANVAS.width*0.49
          drawClef(ctx, location)
        }
      }
    }

    main();
  }, [renderWidth]);

  return <canvas ref={canvasRef} id="myCanvas" />;
}