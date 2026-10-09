// Realism: the small unevenness of people playing. With it on, each track
// plays the way a musician would - a few milliseconds either side of the
// grid, a touch harder or softer than written - rather than with a
// machine's exactness. Off, every note lands on the grid at its written level.
//
// Timing has three layers. Fluctuations that are correlated over time sound
// like a player; independent ones on every note just sound sloppy. So:
//  - drift: the player slowly pushing ahead or laying back over a second or two;
//  - jitter: each onset's own slight miss, shared by everything the player
//    strikes at once, so a kick and hat on the same step don't flam;
//  - spread: each voice of that onset on its own - a drummer's limbs, a
//    pianist's fingers on a chord, which never land quite together.
// Dynamics: a slow swell over a phrase, and each note's own touch.
//
// Drift, jitter and swell are functions of the note's grid time, not of the
// order notes are scheduled in: every drum row schedules on its own, out of
// step with the others, and a beat they share must still get the same miss.
// Their seeds are drawn at load, so no two sessions play alike, and as
// they're keyed on the audio clock a loop never repeats its last pass.

export type Player = 'drums' | 'bass' | 'chords' | 'melody';

export interface Feel {
  // When a note written for `time` (audio-clock seconds) sounds.
  at(time: number): number;
  // How hard: a multiplier on the note's written level, around 1.
  level(time: number): number;
}

// Standard deviations: timing in seconds, dynamics in log-gain (0.05 is
// about 0.4 dB).
export interface Style {
  drift: number;
  jitter: number;
  spread: number;
  swell: number;
  touch: number;
}

export const STYLES: Record<Player, Style> = {
  // The timekeeper, the tightest of the band.
  drums: { drift: 0.004, jitter: 0.003, spread: 0.0015, swell: 0.04, touch: 0.08 },
  bass: { drift: 0.005, jitter: 0.004, spread: 0, swell: 0.04, touch: 0.06 },
  chords: { drift: 0.005, jitter: 0.004, spread: 0.004, swell: 0.05, touch: 0.05 },
  // A singer floats furthest around the beat.
  melody: { drift: 0.008, jitter: 0.006, spread: 0, swell: 0.05, touch: 0.06 },
};

// However the layers add up: a slip, never a mistake.
export const MAX_OFFSET = 0.02;
export const MAX_LOG_LEVEL = 0.25; // about ±2 dB

// The drift and swell take a new random heading this often (seconds),
// easing from one to the next.
const DRIFT_PERIOD = 1.5;
const SWELL_PERIOD = 3;

// The n-th value of a mulberry32 stream (as in rng.ts), reached directly.
function uniform(seed: number, n: number): number {
  let t = (seed + Math.imul(n, 0x6d2b79f5)) | 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Box-Muller: a standard normal value from two uniform ones.
const normal = (u: number, v: number) => Math.sqrt(-2 * Math.log(1 - u)) * Math.cos(2 * Math.PI * v);

// The same standard normal value every time (seed, n) is asked for.
const fixedNormal = (seed: number, n: number) => normal(uniform(seed, 2 * n), uniform(seed, 2 * n + 1));

// A standard normal value at every random heading `period` apart, eased
// between them.
function wander(seed: number, time: number, period: number): number {
  const x = time / period;
  const k = Math.floor(x);
  const f = x - k;
  const from = fixedNormal(seed, k);
  return from + (fixedNormal(seed, k + 1) - from) * f * f * (3 - 2 * f);
}

const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));

// A player with `style`. `rand` draws the seeds and each note's own
// spread and touch.
export function makeFeel(style: Style, rand: () => number = Math.random): Feel {
  const seed = () => (rand() * 0x100000000) | 0;
  const driftSeed = seed();
  const jitterSeed = seed();
  const swellSeed = seed();
  return {
    at: time => time + clamp(
      style.drift * wander(driftSeed, time, DRIFT_PERIOD)
        + style.jitter * fixedNormal(jitterSeed, Math.round(time * 1000))
        + style.spread * normal(rand(), rand()),
      MAX_OFFSET,
    ),
    level: time => Math.exp(clamp(
      style.swell * wander(swellSeed, time, SWELL_PERIOD) + style.touch * normal(rand(), rand()),
      MAX_LOG_LEVEL,
    )),
  };
}

// Every note on the grid, at its written level.
const STRICT: Feel = { at: time => time, level: () => 1 };

// One feel per player for the whole session, so its drift runs on unbroken
// from part to part.
const band = Object.fromEntries(
  (Object.keys(STYLES) as Player[]).map(player => [player, makeFeel(STYLES[player])]),
) as Record<Player, Feel>;

// How `player` plays the note being scheduled. `realism` is asked note by
// note, so switching it takes effect mid-song.
export function feelFor(player: Player, realism?: () => boolean): Feel {
  return realism?.() ? band[player] : STRICT;
}

// A MIDI velocity: `written` (1-127) scaled by a note's level.
export function velocity(written: number, level: number): number {
  return Math.max(1, Math.min(127, Math.round(written * level)));
}
