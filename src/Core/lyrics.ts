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
}

export interface LyricPlacement {
  syllables: Syllable[];
  total: number; // syllables written
  overflow: number; // of those, how many found no step to land on
  lines: number; // phrases (non-blank lines)
}

export const NO_WORDS = '-';

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
// counted as overflow and left off.
export function placeLyrics(text: string, drumGroove: number[]): LyricPlacement {
  const lines = text.trim() === NO_WORDS
    ? []
    : text.split('\n').map(lineSyllables).filter(line => line.length > 0);
  const total = lines.reduce((n, line) => n + line.length, 0);
  const onsets: number[] = [];
  const length = drumGroove.reduce((t, d) => (onsets.push(t), t + d), 0);
  const placement: LyricPlacement = { syllables: [], total, overflow: 0, lines: lines.length };
  if (lines.length === 0 || onsets.length === 0) return placement;

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
    const slots = fit ? fit.slice(fit.length - line.length) : steps.slice(0, line.length);
    placement.overflow += line.length - slots.length;
    slots.forEach((slot, i) => placement.syllables.push({ ...line[i], step: slot.step, beat: slot.beat }));
  });
  return placement;
}

// ---- Which words a part sings ---------------------------------------------

export interface PartWords {
  text: string;
  // The earlier part whose words this one repeats, when it has none of its own.
  from: number | null;
}

// A part's own words, or - for a repeated section other than a verse, left
// blank - those of the last earlier part of the same kind that has some.
export function partLyrics(parts: Array<{ type: string; lyrics?: string }>, index: number): PartWords {
  const part = parts[index];
  const own = part?.lyrics?.trim() ?? '';
  if (own) return { text: own === NO_WORDS ? '' : part!.lyrics!, from: null };
  if (!part || part.type === 'Verse') return { text: '', from: null };
  for (let i = index - 1; i >= 0; i--) {
    const earlier = parts[i].lyrics?.trim() ?? '';
    if (parts[i].type === part.type && earlier && earlier !== NO_WORDS) return { text: parts[i].lyrics!, from: i };
  }
  return { text: '', from: null };
}
