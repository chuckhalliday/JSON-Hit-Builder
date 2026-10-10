// Lyrics: words written per part, split into syllables and laid onto the
// part's step grid so they can be read against the chords and bass.
//
// Nothing here writes words. A part sings what was typed for it - or, for a
// repeated section (a second Chorus...) left blank, the words of the last
// earlier one, since repeats usually reuse them. Verses don't repeat words;
// a lone "-" marks a part that should stay wordless.

export interface Syllable {
  text: string;
  step: number; // drum step it lands on
  beat: number; // the step's onset, in beats from the part's start
  hyphen: boolean; // its word continues on the next syllable
  line: number; // which phrase (non-blank line) it's in
  at: number; // its place in that line
  moved: boolean; // dragged off its automatic spot
  // The longest it's sung, in beats, when its meter cuts it short of the
  // next syllable (an unstressed one in a falling meter: an eighth).
  hold?: number;
}

// Syllables dragged off their automatic spots, by line: each line's moves
// (a beat, or null for "where it lands by itself", per syllable) are kept
// with the line's text, and only apply while the line still reads the same.
export type LyricTiming = Array<{ text: string; beats: Array<number | null> } | null>;

export interface LyricPlacement {
  syllables: Syllable[];
  total: number; // syllables written
  overflow: number; // of those, how many found no step to land on
  lines: number; // phrases (non-blank lines)
}

export const NO_WORDS = '-';

// ---- Meters ----------------------------------------------------------------

// The rhythms a part's words can be set in (the Rhythm menu over the treble
// clef). Even is the plain setting placeLyrics describes. The poetic meters
// put a stressed syllable on beats 1 and 3, its unstressed ones beside it on
// the eighth grid, and mark where each foot ends. A rising meter (da-DUM)
// leads into the stress with pickup eighths and holds it; its lines start on
// pickups and land on the downbeat, as Even's do. A falling one (DUM-da)
// follows the stress with its unstressed syllables, the last an eighth with
// a rest after it; its lines start on the downbeat. (Played as a stream, a
// rising foot and its falling twin would otherwise be the same notes, only
// grouped apart.) A line with more syllables than its meter has room for is
// set evenly.
export type LyricMeter = 'even' | 'iambic' | 'trochaic' | 'anapestic' | 'dactylic';

export interface LyricMeterDef {
  id: LyricMeter;
  name: string;
  foot: string; // its syllables, the stressed one in capitals
  about: string;
  // Beats after each stress its unstressed syllables fall on (the next
  // foot's pickups, for a rising meter), and which way the foot goes.
  weak?: number[];
  rising?: boolean;
}

export const LYRIC_METERS: LyricMeterDef[] = [
  { id: 'even', name: 'Even', foot: 'da da da da', about: 'Syllables evenly on the beat (on eighths when a line is busy), each line landing on a downbeat' },
  { id: 'iambic', name: 'Iambic', foot: 'da-DUM', weak: [1.5], rising: true, about: 'A pickup eighth into each held stress: lines start on the pickup and land on the downbeat' },
  { id: 'trochaic', name: 'Trochaic', foot: 'DUM-da', weak: [1], rising: false, about: 'A stress on the beat, then an eighth and a rest: lines start on the downbeat' },
  { id: 'anapestic', name: 'Anapestic', foot: 'da-da-DUM', weak: [1, 1.5], rising: true, about: 'Two pickup eighths into each stress: lines start on them and land on the downbeat' },
  { id: 'dactylic', name: 'Dactylic', foot: 'DUM-da-da', weak: [0.5, 1], rising: false, about: 'Three eighths from the beat, then a rest: lines start on the downbeat' },
];

export const meterDef = (id: LyricMeter | undefined) => LYRIC_METERS.find(m => m.id === (id ?? 'even'))!;

// ---- Syllables -------------------------------------------------------------

const isVowelAt = (w: string, i: number) => {
  const c = w[i];
  if ('aeiou'.includes(c)) return true;
  // y is a vowel inside a word (my, every, rhythm) unless it starts a
  // syllable before another vowel (yes, beyond).
  const next = w[i + 1];
  return c === 'y' && i > 0 && !(next && 'aeiou'.includes(next));
};

// Consonant pairs that stay together at the start of a syllable (fa-ther,
// se-cret, peo-ple), and pairs that stay with the syllable before (pick-ing,
// sing-er).
const ONSET_PAIRS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'gh', 'qu', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'bl', 'cl', 'fl', 'gl', 'pl']);
const CODA_PAIRS = new Set(['ck', 'ng', 'gh']);
// Endings that are their own syllable after a stem ending in a silent e
// (lone-ly, care-ful, home-less), which the vowel rules would miss.
const SUFFIXES = ['ness', 'less', 'ment', 'ful', 'ly'];
// Compounds whose first half ends in a silent e or would otherwise run into
// the second (some-thing, some-one, any-where).
const COMPOUND = /^(some|any|every|no)(thing|one|body|where|time|times|how|way)$/;

// Where a consonant cluster between two vowels splits: the offset into the
// cluster at which the next syllable starts.
function clusterSplit(c: string): number {
  if (c.length <= 1) return c === 'x' ? 1 : 0; // ti-ger, but tax-i
  if (c.length === 2) {
    if (CODA_PAIRS.has(c)) return 2;
    return ONSET_PAIRS.has(c) ? 0 : 1; // fa-ther; run-ning
  }
  if (CODA_PAIRS.has(c.slice(0, 2))) return 2; // laugh-ter
  if (ONSET_PAIRS.has(c.slice(-2))) return c.length - 2; // con-trol, chil-dren
  return 1; // mon-ster
}

function autoSyllables(word: string): string[] {
  const w = word.toLowerCase();
  if (w.length <= 3) return [word];
  const compound = w.match(COMPOUND);
  if (compound) {
    const head = compound[1].length;
    return [...autoSyllables(word.slice(0, head)), ...autoSyllables(word.slice(head))];
  }
  for (const suffix of SUFFIXES) {
    const stem = w.slice(0, -suffix.length);
    if (w.endsWith(suffix) && stem.length >= 3 && stem.endsWith('e') && !isVowelAt(stem, stem.length - 2)) {
      return [...autoSyllables(word.slice(0, stem.length)), word.slice(stem.length)];
    }
  }
  // Vowel groups: [start, end) spans of consecutive vowels.
  const groups: Array<[number, number]> = [];
  for (let i = 0; i < w.length; i++) {
    if (!isVowelAt(w, i)) continue;
    const last = groups[groups.length - 1];
    if (last && last[1] === i) last[1] = i + 1;
    else groups.push([i, i + 1]);
  }
  // Silent endings: a final e (love, smile - but not lit-tle), and -es / -ed
  // where they don't add a syllable (loves, walked - but kiss-es, want-ed).
  const lastGroup = groups[groups.length - 1];
  if (groups.length > 1 && lastGroup[1] - lastGroup[0] === 1 && w[lastGroup[0]] === 'e') {
    const at = lastGroup[0];
    const before = w[at - 1] ?? '';
    const tail = w.slice(at);
    const silent =
      (tail === 'e' && !(w.endsWith('le') && !isVowelAt(w, at - 2))) ||
      (tail === 'ed' && !'td'.includes(before)) ||
      (tail === 'es' && !'sxzcg'.includes(before) && !['ch', 'sh'].includes(w.slice(at - 2, at)));
    if (silent) groups.pop();
  }
  if (groups.length <= 1) return [word];
  const cuts = groups.slice(1).map(([start], k) => {
    const prevEnd = groups[k][1];
    return prevEnd + clusterSplit(w.slice(prevEnd, start));
  });
  return [0, ...cuts].map((from, k) => word.slice(from, cuts[k] ?? word.length));
}

// One word's syllables. Hyphens in the word split it exactly there
// (beau-ti-ful, ev-ry), overriding the automatic split; punctuation stays
// on the syllable it touches.
export function syllabify(word: string): string[] {
  const match = word.match(/^([^\p{L}\p{N}']*)(.*?)([^\p{L}\p{N}']*)$/u);
  const [, lead, core, trail] = match ?? ['', '', word, ''];
  if (!core) return [];
  const parts = core.includes('-') ? core.split('-').filter(Boolean) : autoSyllables(core);
  if (parts.length === 0) return [];
  parts[0] = lead + parts[0];
  parts[parts.length - 1] += trail;
  return parts;
}

// A line's syllables, each marked with whether its word goes on.
export function lineSyllables(line: string): Array<{ text: string; hyphen: boolean }> {
  return line.split(/\s+/).flatMap(word => {
    const parts = syllabify(word);
    return parts.map((text, i) => ({ text, hyphen: i < parts.length - 1 }));
  });
}

// ---- Placement -------------------------------------------------------------

const EPS = 0.02;
const onGrid = (beat: number, per: number) => Math.abs(beat * per - Math.round(beat * per)) < EPS * per;

// Lay a part's words onto its drum steps (durations in beats). Each line is
// a phrase: lines share out the part's bars (or beats, when there are more
// lines than bars). Within its stretch a phrase lands its last syllable on
// the downbeat of the stretch's last bar (beat 3 of a one-bar stretch) and
// runs back from there - on the beat when the syllables fit, else on
// eighths, else on every step - so short lines read as pickups and long
// ones fill the bar. Syllables that don't fit even on every step are
// counted as overflow and left off. A `meter` other than Even sets each line
// of a bar or longer in its feet instead, when they fit (meterSlots).
//
// Dragged syllables (`timing`) then move to their beats - each one only if a
// step starts there and it stays strictly between its neighbours, else it
// keeps its automatic spot.
export function placeLyrics(text: string, drumGroove: number[], timing?: LyricTiming, meter?: LyricMeter): LyricPlacement {
  const lineTexts = lyricLines(text);
  const lines = lineTexts.map(lineSyllables);
  const total = lines.reduce((n, line) => n + line.length, 0);
  const onsets: number[] = [];
  const length = drumGroove.reduce((t, d) => (onsets.push(t), t + d), 0);
  const placement: LyricPlacement = { syllables: [], total, overflow: 0, lines: lines.length };
  if (lines.length === 0 || onsets.length === 0) return placement;
  const def = meterDef(meter);

  const bars = Math.max(1, Math.round(length / 4));
  const m = lines.length;
  const windows = m <= bars
    ? lines.map((_, k) => [Math.floor((k * bars) / m) * 4, k === m - 1 ? length : Math.floor(((k + 1) * bars) / m) * 4])
    : lines.map((_, k) => [Math.round((k * length) / m), k === m - 1 ? length : Math.round(((k + 1) * length) / m)]);

  lines.forEach((line, k) => {
    const [from, to] = windows[k];
    const span = to - from;
    const land = to - (span >= 8 ? 4 : span >= 4 ? 2 : span >= 2 ? 1 : 0);
    const steps = onsets.map((beat, step) => ({ beat, step })).filter(s => s.beat >= from - EPS && s.beat < to - EPS);
    const upToLanding = steps.filter(s => s.beat <= land + EPS);
    const tiers = [
      upToLanding.filter(s => onGrid(s.beat, 1)),
      upToLanding.filter(s => onGrid(s.beat, 2)),
      upToLanding,
    ];
    const fit = tiers.find(tier => tier.length >= line.length);
    const metered = def.weak && span >= 4 ? meterSlots(def, line.length, from, to, land, steps) : null;
    const slots: Array<{ step: number, beat: number, hold?: number }> = metered ?? (fit ? fit.slice(fit.length - line.length) : steps.slice(0, line.length));
    placement.overflow += line.length - slots.length;
    slots.forEach((slot, i) => placement.syllables.push({
      ...line[i], step: slot.step, beat: slot.beat, line: k, at: i, moved: false, ...(slot.hold ? { hold: slot.hold } : {}),
    }));
  });
  if (timing) applyTiming(placement.syllables, lineTexts, timing, onsets);
  return placement;
}

// A line's steps in a meter, in its stretch [from, to): a stress on every
// other beat from the stretch's start (beats 1 and 3), its unstressed
// syllables at their offsets - each on the step nearest (the later on a tie,
// so a shuffle's "&" is its swung one), and in a falling meter held an
// eighth. A rising line runs back from a stress: the landing, or a later one
// when it needs the room. A falling one runs on from the top. Null when the
// line has more syllables than there are places.
function meterSlots(meter: LyricMeterDef, count: number, from: number, to: number, land: number, steps: Array<{ beat: number, step: number }>) {
  if (steps.length === 0) return null;
  const nearest = (beat: number) => steps.reduce((near, s) => (Math.abs(s.beat - beat) <= Math.abs(near.beat - beat) + EPS / 2 ? s : near));
  const places: Array<{ beat: number, step: number, hold?: number }> = [];
  for (let at = from; at < to - EPS; at += 2) {
    for (const [offset, stress] of [[0, true], ...meter.weak!.map(w => [w, false])] as Array<[number, boolean]>) {
      if (at + offset >= to - EPS) continue;
      const { beat, step } = nearest(at + offset);
      if (places.length && beat <= places[places.length - 1].beat + EPS) continue;
      const eighth = nearest(beat + 0.5).beat - beat;
      places.push({ beat, step, ...(stress || meter.rising ? {} : { hold: eighth > EPS ? eighth : 0.5 }) });
    }
  }
  if (meter.rising) {
    for (let end = land; end < to - EPS; end += 2) {
      const upTo = places.filter(p => p.beat <= end + EPS);
      if (upTo.length >= count) return upTo.slice(upTo.length - count);
    }
    return null;
  }
  return places.length >= count ? places.slice(0, count) : null;
}

// The phrases of a part's words: its non-blank lines, trimmed (none for "-").
export function lyricLines(text: string): string[] {
  if (text.trim() === NO_WORDS) return [];
  return text.split('\n').map(line => line.trim()).filter(line => lineSyllables(line).length > 0);
}

function applyTiming(syllables: Syllable[], lineTexts: string[], timing: LyricTiming, onsets: number[]) {
  const auto = syllables.map(s => ({ step: s.step, beat: s.beat }));
  const moves = syllables.map(s => {
    const entry = timing[s.line];
    const beat = entry && entry.text === lineTexts[s.line] ? entry.beats[s.at] : null;
    const step = beat === null || beat === undefined ? -1 : onsets.findIndex(t => Math.abs(t - beat) < EPS);
    return step === -1 ? null : { step, beat: onsets[step] };
  });
  moves.forEach((move, i) => { if (move) Object.assign(syllables[i], move, { moved: true }); });
  // A move that lands on or past a neighbour goes back to where it'd be by
  // itself; going back can upset another move, so repeat until all are in
  // order (each pass takes at least one back, and automatic spots are).
  for (let changed = true; changed;) {
    changed = false;
    syllables.forEach((s, i) => {
      const before = syllables[i - 1]?.beat ?? -Infinity;
      const after = syllables[i + 1]?.beat ?? Infinity;
      if (s.moved && !(s.beat > before + EPS && s.beat < after - EPS)) {
        Object.assign(s, auto[i], { moved: false });
        changed = true;
      }
    });
  }
}

export interface SyllableMove {
  line: number;
  at: number;
  beat: number | null; // null: back where it lands by itself
}

// The timing with each syllable `at` of line `line` dragged to `beat` (or,
// for null, put back), for words `text`. Lines whose words have changed
// since their moves were made lose them.
export function withLyricMoves(text: string, timing: LyricTiming | undefined, moves: SyllableMove[]): LyricTiming | undefined {
  const lines = lyricLines(text);
  const next: LyricTiming = lines.map((lineText, k) => {
    const entry = timing?.[k];
    const beats = entry && entry.text === lineText ? [...entry.beats] : [];
    for (const move of moves) if (move.line === k) beats[move.at] = move.beat === null ? null : Math.round(move.beat * 1000) / 1000;
    const kept = Array.from({ length: lineSyllables(lineText).length }, (_, i) => beats[i] ?? null);
    return kept.some(b => b !== null) ? { text: lineText, beats: kept } : null;
  });
  return next.some(Boolean) ? next : undefined;
}

export const withLyricMove = (text: string, timing: LyricTiming | undefined, line: number, at: number, beat: number | null) =>
  withLyricMoves(text, timing, [{ line, at, beat }]);

// The step whose onset is nearest a beat (onsets in order).
function nearestStep(onsets: number[], beat: number): number {
  let lo = 0;
  let hi = onsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (onsets[mid] < beat) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && beat - onsets[lo - 1] < onsets[lo] - beat ? lo - 1 : lo;
}

// A part's syllables (the steps they're on, in order) with syllable `i`
// dragged to step `to`: the step each is then on. Between its neighbours it
// moves alone. Past one, it pushes that one onto the step beside it, and
// every syllable beyond along by as much as a block - keeping their rhythm
// (each on the step nearest its new beat, should the grid there differ) - as
// far as the part's first and last steps. Null past those.
export function pushedSteps(steps: number[], i: number, to: number, onsets: number[]): number[] | null {
  const out = [...steps];
  out[i] = to;
  const last = onsets.length - 1;
  for (const dir of [1, -1]) {
    const first = i + dir;
    if (steps[first] === undefined || dir * (steps[first] - to) > 0) continue;
    if (to + dir < 0 || to + dir > last) return null;
    const shift = onsets[to + dir] - onsets[steps[first]];
    let prev = to;
    for (let k = first; k >= 0 && k < steps.length; k += dir) {
      const beat = onsets[steps[k]] + shift;
      if (beat < -EPS || beat > onsets[last] + EPS) return null;
      let step = nearestStep(onsets, beat);
      if (dir * (step - prev) <= 0) step = prev + dir;
      if (step < 0 || step > last) return null;
      out[k] = step;
      prev = step;
    }
  }
  return out;
}

// ---- Which words a part sings ---------------------------------------------

export interface PartWords {
  text: string;
  // The earlier part whose words this one repeats, when it has none of its own.
  from: number | null;
  // Their dragged syllables and meter - which travel with the words.
  timing?: LyricTiming;
  meter?: LyricMeter;
}

// A part's own words, or - for a repeated section other than a verse, left
// blank - those of the last earlier part of the same kind that has some.
export function partLyrics(parts: Array<{ type: string; lyrics?: string; lyricTiming?: LyricTiming; lyricMeter?: LyricMeter }>, index: number): PartWords {
  const part = parts[index];
  const own = part?.lyrics?.trim() ?? '';
  if (own) return own === NO_WORDS ? { text: '', from: null } : { text: part!.lyrics!, from: null, timing: part!.lyricTiming, meter: part!.lyricMeter };
  if (!part || part.type === 'Verse') return { text: '', from: null };
  for (let i = index - 1; i >= 0; i--) {
    const earlier = parts[i].lyrics?.trim() ?? '';
    if (parts[i].type === part.type && earlier && earlier !== NO_WORDS) return { text: parts[i].lyrics!, from: i, timing: parts[i].lyricTiming, meter: parts[i].lyricMeter };
  }
  return { text: '', from: null };
}
