import React, { useLayoutEffect, useRef } from 'react'
import styles from "../Styles/App.module.scss"

interface FitBoxProps {
  className?: string;
  // Bounds on the scale; the content takes the largest that fits.
  min?: number;
  max?: number;
  // Where the scaled content sits when it's shorter than the box.
  align?: 'top' | 'center';
  children: React.ReactNode;
}

// Scales its content as a whole (like zooming) to the largest size that fits
// its box, so nothing overflows and nothing is left hanging below. The
// content is laid out at the box's width divided by the scale, so it rewraps
// to fill the width once scaled, and it re-fits whenever the box or the
// content changes size.
export default function FitBox({ className, min = 0.5, max = 1, align = 'top', children }: FitBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    let frame = 0;
    const fit = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!width || !height) return;
      // The scaled height at a scale: layout heights ignore the transform.
      const heightAt = (scale: number) => {
        inner.style.width = `${width / scale}px`;
        return inner.offsetHeight * scale;
      };
      // Wider layouts are shorter, so the scaled height grows with the
      // scale: bisect for the largest that fits.
      let lo = min;
      let hi = max;
      if (heightAt(hi) <= height) {
        lo = hi;
      } else {
        for (let i = 0; i < 10; i++) {
          const mid = (lo + hi) / 2;
          if (heightAt(mid) <= height) lo = mid;
          else hi = mid;
        }
      }
      const used = heightAt(lo);
      const top = align === 'center' ? Math.max(0, (height - used) / 2) : 0;
      inner.style.transform = `translate(0, ${top}px) scale(${lo})`;
    };
    const refit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    const observer = new ResizeObserver(refit);
    observer.observe(box);
    observer.observe(inner);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [min, max, align]);

  return (
    <div ref={boxRef} className={className ? `${styles.fitBox} ${className}` : styles.fitBox}>
      <div ref={innerRef} className={styles.fitInner}>{children}</div>
    </div>
  );
}
