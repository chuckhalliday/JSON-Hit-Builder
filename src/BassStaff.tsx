import React, { useEffect, useRef } from 'react';

import styles from "./BassStaff.module.scss";

export default function BassStaff() {
  
  
  
  
  
  
  
  //Draw staff
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    function main() {
      drawScene();
    }
    
    function drawScene() {
      let CANVAS = canvasRef.current;
      if (CANVAS) {
        const ctx = CANVAS.getContext("2d") as CanvasRenderingContext2D;
        const spacing = CANVAS.height / 20;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          let y = CANVAS.height / 2 + i * spacing * 2;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS.width, y);
          ctx.stroke();
        }
      }
    }

    main();
  }, []);

  return <canvas ref={canvasRef} id="myCanvas" />;
};