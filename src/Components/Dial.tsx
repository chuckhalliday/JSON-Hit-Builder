import { useRef } from "react";
import styles from "../Styles/App.module.scss";

interface DialProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  // Double-clicking the knob snaps back to this value.
  defaultValue: number;
  // Renders the value readout under the knob; plain String(value) if omitted.
  format?: (value: number) => string;
  // Tooltip explaining what the setting does.
  hint?: string;
  onChange: (value: number) => void;
}

// Rotary knob: a 270° sweep from 7 o'clock to 5 o'clock, the standard synth
// layout, so the default sits at 12 o'clock when it centers the range.
const sweepDegrees = 270;
// Pixels of vertical drag that travel the full min→max range.
const dragRangePx = 150;

export default function Dial({ label, value, min, max, step, defaultValue, format, hint, onChange }: DialProps) {
  // Drag bookkeeping lives in a ref: pointer moves only re-render through
  // onChange when the stepped value actually changes.
  const drag = useRef<{ startY: number; startValue: number } | null>(null);

  // Snap to the step grid and clamp; rounded to 2 decimals so repeated drags
  // never accumulate float noise into the stored recipe.
  const clampToStep = (raw: number) => {
    const snapped = min + Math.round((raw - min) / step) * step;
    return Math.round(Math.min(max, Math.max(min, snapped)) * 100) / 100;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Best-effort: throws NotFoundError if the pointer was already released
    // by the time the handler runs, and the drag math works uncaptured.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { /* keep dragging without capture */ }
    drag.current = { startY: e.clientY, startValue: value };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    // Dragging up increases the value.
    const travel = (drag.current.startY - e.clientY) * ((max - min) / dragRangePx);
    const stepped = clampToStep(drag.current.startValue + travel);
    if (stepped !== value) {
      onChange(stepped);
    }
  };

  const handlePointerUp = () => {
    drag.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta =
      e.key === "ArrowUp" || e.key === "ArrowRight" ? step :
      e.key === "ArrowDown" || e.key === "ArrowLeft" ? -step : 0;
    if (delta !== 0) {
      e.preventDefault();
      onChange(clampToStep(value + delta));
    }
  };

  const normalized = (value - min) / (max - min);
  const angle = normalized * sweepDegrees - sweepDegrees / 2;

  return (
    <div className={styles.dial} title={hint}>
      <span className={styles.dialLabel}>{label}</span>
      <div
        className={styles.dialKnob}
        style={{ "--sweep": `${normalized * sweepDegrees}deg` } as React.CSSProperties}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format ? format(value) : undefined}
        tabIndex={0}
        title="Drag up/down; double-click to reset"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => onChange(defaultValue)}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.dialIndicator} style={{ transform: `rotate(${angle}deg)` }} />
      </div>
      <span className={styles.dialValue}>{format ? format(value) : String(value)}</span>
    </div>
  );
}
