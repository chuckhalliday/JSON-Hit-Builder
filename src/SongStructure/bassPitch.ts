import { tone, midiTone } from "./tone";

export interface Pitch {
  osc: number;  // oscillator frequency in Hz (0 or negative = rest / no pitch)
  midi: number; // MIDI note number     (0 or negative = rest / no pitch)
}

// The staff IS the pitch UI: a bass note's vertical position (`y`) together with
// its accidental determines its pitch. This function is the single source of
// that mapping, so playback can read a note's stored osc/midi and never has to
// interpret pixel coordinates.
//
// Extracted verbatim from the old `mapBassValue()` switch that used to live
// inside the audio scheduler (playBass.ts), keyed on the exact staff-Y
// constants that drawBass emits. Behaviour is intentionally identical.
export function bassPitch(y: number, acc: string): Pitch {
  const pick = (name: keyof typeof tone, octave: number): Pitch => ({
    osc: tone[name][octave],
    midi: midiTone[name][octave],
  });

  switch (y) {
    // E
    case 120: return acc === 'flat' ? pick('Eb', 1) : pick('E', 1);
    case 67.5: return acc === 'flat' ? pick('Eb', 2) : pick('E', 2);
    // F
    case 112.5: return acc === 'sharp' ? pick('Gb', 1) : pick('F', 1);
    case 60: return acc === 'sharp' ? pick('Gb', 2) : pick('F', 2);
    // G
    case 105:
      if (acc === 'sharp') return pick('Ab', 1);
      if (acc === 'flat') return pick('Gb', 1);
      return pick('G', 1);
    case 52.5:
      if (acc === 'sharp') return pick('Ab', 2);
      if (acc === 'flat') return pick('Gb', 2);
      return pick('G', 2);
    // A
    case 97.5:
      if (acc === 'sharp') return pick('Bb', 1);
      if (acc === 'flat') return pick('Ab', 1);
      return pick('A', 1);
    case 45:
      if (acc === 'sharp') return pick('Bb', 2);
      if (acc === 'flat') return pick('Ab', 2);
      return pick('A', 2);
    // B
    case 90: return acc === 'flat' ? pick('Bb', 1) : pick('B', 1);
    case 37.5: return acc === 'flat' ? pick('Bb', 2) : pick('B', 2);
    // C
    case 82.5: return acc === 'sharp' ? pick('Db', 2) : pick('C', 2);
    case 30: return acc === 'sharp' ? pick('Db', 3) : pick('C', 3);
    // D
    case 75:
      if (acc === 'sharp') return pick('Eb', 2);
      if (acc === 'flat') return pick('Db', 2);
      return pick('D', 2);
    default:
      // Faithful to the legacy default: a rest (y = -20) or a note dragged off
      // the mapped staff grid falls through with the raw y as its "pitch".
      // Playback treats values <= 0 as rests.
      return { osc: y, midi: y };
  }
}
