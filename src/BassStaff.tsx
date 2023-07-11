import React, { useEffect, useRef } from 'react';

import styles from "./BassStaff.module.scss";

interface BassStaffProps {
  renderWidth: number;
}

export default function BassStaff({ renderWidth }: BassStaffProps) {
  let canvasRef = useRef<HTMLCanvasElement | null>(null);
  let CLEF_IMAGE=new Image()
  CLEF_IMAGE.src="/BassClef.png"

  let MOUSE= {
    x:0,
    y:0,
    isDown:false
  }

  useEffect(() => {
    let CANVAS = canvasRef.current
    function main() {
      addEventListeners()
      drawScene();
      animate()
    }

    function animate() {
      drawScene();
      window.requestAnimationFrame(animate)
    }

    function addEventListeners() {
      if (CANVAS) {
        CANVAS.addEventListener('mousemove', onMouseMove as any);
        CANVAS.addEventListener('mousedown', onMouseDown as any);
        CANVAS.addEventListener('mouseup', onMouseUp as any);
      }
    }

    function onMouseMove(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      if (CANVAS) {
      const rect = CANVAS.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      MOUSE.x = event.clientX - rect.left - scrollLeft;
      MOUSE.y = event.clientY - rect.top - scrollTop;
      }
    }

    function onMouseDown(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      MOUSE.isDown=true
    }

    function onMouseUp(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
      MOUSE.isDown=false
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
        let ctx = CANVAS.getContext('2d');
        const spacing = CANVAS.height / 20;
        if (ctx) {
          ctx.clearRect(0,0,CANVAS.width,CANVAS.height)
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
            x: MOUSE.x,
            y: MOUSE.y
          }
          drawNote(ctx, location)
          
          drawClef(ctx, {x: 45, y:CANVAS.height/2})
        }
      }
    }

    main();
  }, [renderWidth, MOUSE]);

  return <canvas ref={canvasRef} id="myCanvas" />;
}