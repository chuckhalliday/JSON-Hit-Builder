import React, { useEffect, useRef } from 'react';

import styles from "./BassStaff.module.scss";

interface BassStaffProps {
  renderWidth: number;
}

export default function BassStaff({ renderWidth }: BassStaffProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    function main() {
      drawScene();
    }

    function drawScene() {
      const CANVAS = canvasRef.current;
      if (CANVAS) {
        CANVAS.width = renderWidth; // Set canvas width based on renderWidth prop
        const ctx = CANVAS.getContext('2d');
        if (ctx) {
          const spacing = CANVAS.height / 20;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          for (let i = -2; i <= 2; i++) {
            const y = CANVAS.height / 2 + i * spacing * 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(renderWidth, y);
            ctx.stroke();
          }
        }
      }
    }

    main();
  }, [renderWidth]);

  return <canvas ref={canvasRef} id="myCanvas" />;
}