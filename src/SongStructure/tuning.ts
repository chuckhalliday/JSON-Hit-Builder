// Tunable odds for the deep generation algorithm.
//
// The generators hard-code the probability of every optional musical choice
// (a kick landing, a triad being swapped for a substitution, a chord change
// committing early, a section repeating). Those base odds stay in the
// algorithm files as the single source of truth; the Advanced panel's dials
// only scale them through this module. generateSong calls setTuning() up
// front (the same pattern as seedRng / rollAccidentals) and the generators
// route each base probability through the odds helpers as they roll.
//
// Two invariants keep this safe:
// - At defaultTuning every helper returns its input unchanged and no extra
//   rng() calls are made, so a seed stored before tuning existed still
//   replays the exact same song, and the defaults ARE the stock algorithm.
// - Every tuning entering the generators passes through normalizeTuning(),
//   which maps retired recipe shapes and clamps each field to its bounds, so
//   no stored, partial, or corrupt recipe can produce NaN thresholds or a
//   non-terminating structure loop (maxPartRepeats < 1 would stall
//   generateSongStructure's remaining-parts countdown).

import { GenerationTuning, StoredTuning } from "../types";

export const defaultTuning: GenerationTuning = {
  kickOdds: 1,
  snareOdds: 1,
  crashOdds: 1,
  chordSubstitutionRate: 1,
  chordChangeRate: 1,
  maxPartRepeats: 3,
};

// Legal range (and dial step) per field — the one definition the Advanced
// panel's dials and the sanitizer below both read.
export const tuningBounds: { [K in keyof GenerationTuning]: { min: number; max: number; step: number } } = {
  kickOdds: { min: 0, max: 2, step: 0.05 },
  snareOdds: { min: 0, max: 2, step: 0.05 },
  crashOdds: { min: 0, max: 2, step: 0.05 },
  chordSubstitutionRate: { min: 0, max: 2, step: 0.05 },
  chordChangeRate: { min: 0, max: 2, step: 0.05 },
  maxPartRepeats: { min: 1, max: 6, step: 1 },
};

// Missing or non-finite values fall back to the default; everything else is
// clamped into bounds (and rounded for the integer repeat cap).
const sanitizeField = (key: keyof GenerationTuning, raw: number | undefined): number => {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return defaultTuning[key];
  }
  const { min, max } = tuningBounds[key];
  const clamped = Math.min(max, Math.max(min, raw));
  return key === "maxPartRepeats" ? Math.round(clamped) : clamped;
};

// Resolve a stored (possibly partial, legacy, or corrupt) tuning to a safe
// GenerationTuning. Recipes recorded by the retired single drum dial fan
// their drumHitOdds out to the three per-drum dials it used to scale.
export function normalizeTuning(stored?: StoredTuning): GenerationTuning {
  const legacyDrum = stored?.drumHitOdds;
  return {
    kickOdds: sanitizeField("kickOdds", stored?.kickOdds ?? legacyDrum),
    snareOdds: sanitizeField("snareOdds", stored?.snareOdds ?? legacyDrum),
    crashOdds: sanitizeField("crashOdds", stored?.crashOdds ?? legacyDrum),
    chordSubstitutionRate: sanitizeField("chordSubstitutionRate", stored?.chordSubstitutionRate),
    chordChangeRate: sanitizeField("chordChangeRate", stored?.chordChangeRate),
    maxPartRepeats: sanitizeField("maxPartRepeats", stored?.maxPartRepeats),
  };
}

let current: GenerationTuning = { ...defaultTuning };

// Install the tuning for the generation about to run. Always normalized, so
// the generators can trust every field regardless of where the value came
// from; omitted fields fall back to the stock defaults.
export function setTuning(tuning?: StoredTuning): void {
  current = normalizeTuning(tuning);
}

// A scaled probability is always a real number in [0, 1], so both roll forms
// (`rng() < odds` and the complement `rng() < 1 - odds`) stay well-defined.
const scaleOdds = (base: number, factor: number) =>
  Math.min(1, Math.max(0, base * factor));

// Probability that an optional hit lands, per drum voice.
export const kickOdds = (base: number) => scaleOdds(base, current.kickOdds);
export const snareOdds = (base: number) => scaleOdds(base, current.snareOdds);
export const crashOdds = (base: number) => scaleOdds(base, current.crashOdds);

// Probability that a chord deviates from the plain diatonic triad.
export const subOdds = (base: number) => scaleOdds(base, current.chordSubstitutionRate);

// Probability that a chord change commits after one beat instead of holding
// for two — higher means busier harmony.
export const chordChangeOdds = (base: number) => scaleOdds(base, current.chordChangeRate);

// Longest run of the same part type the structure generator may emit.
// normalizeTuning guarantees an integer >= 1, so the structure loop's
// remaining-parts countdown always makes progress.
export const maxPartRepeats = () => current.maxPartRepeats;
