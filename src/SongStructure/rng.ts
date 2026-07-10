// Seedable pseudo-random generator for song *structure* generation.
//
// Generation used to call Math.random() directly, which made every generated
// song impossible to reproduce or unit-test. Routing generation through a
// seeded RNG lets an entire song be reproduced from a single integer seed
// (stored on the song). Playback humanisation (per-hit velocity/timing) is
// intentionally left on Math.random() — it should vary every performance.
//
// mulberry32: tiny, fast, and more than random enough for musical choices.

let state = 0x9e3779b9;

// Seed the generator. The same seed replays the same sequence of rng() values.
export function seedRng(seed: number): void {
  state = seed >>> 0;
}

// Next value in [0, 1). Drop-in replacement for Math.random().
export function rng(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// A fresh 32-bit seed, for when the caller doesn't supply one.
export function randomSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}
