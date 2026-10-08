// Pronunciation for the sung melody: each syllable as the sounds a voice
// makes - consonants before the vowel, the vowel it holds the note on, and
// consonants after. Phones are ARPAbet (the CMU dictionary's alphabet).
//
// A small dictionary covers the words lyrics use most, whose spelling
// misleads (love, one, heart, through); anything else goes by English
// spelling rules - vowel teams, silent e, r-colored vowels, consonant pairs.
// Rough, but it only has to be clear enough to be sung.

export type Vowel = 'IY' | 'IH' | 'EH' | 'AE' | 'AA' | 'AO' | 'UH' | 'UW' | 'AH' | 'ER' | 'EY' | 'AY' | 'OW' | 'AW' | 'OY';

export interface SungSyllable {
  onset: string[];
  vowel: Vowel;
  coda: string[];
}

const VOWELS = new Set(['IY', 'IH', 'EH', 'AE', 'AA', 'AO', 'UH', 'UW', 'AH', 'ER', 'EY', 'AY', 'OW', 'AW', 'OY']);

// Words by syllable, written as space-separated phones with '|' between
// syllables. Used when the word splits into as many syllables as listed.
const WORDS: Record<string, string> = {
  a: 'AH', i: 'AY', "i'm": 'AY M', "i'll": 'AY L', "i've": 'AY V', "i'd": 'AY D',
  the: 'DH AH', of: 'AH V', to: 'T UW', two: 'T UW', too: 'T UW', do: 'D UW', who: 'HH UW', you: 'Y UW', your: 'Y AO R', "you're": 'Y AO R',
  we: 'W IY', me: 'M IY', be: 'B IY', he: 'HH IY', she: 'SH IY', my: 'M AY', by: 'B AY', why: 'W AY', bye: 'B AY',
  and: 'AE N D', in: 'IH N', is: 'IH Z', it: 'IH T', "it's": 'IH T S', as: 'AE Z', at: 'AE T', on: 'AA N', or: 'AO R', for: 'F AO R',
  are: 'AA R', were: 'W ER', where: 'W EH R', there: 'DH EH R', their: 'DH EH R', "they're": 'DH EH R', here: 'HH IH R', hear: 'HH IH R',
  they: 'DH EY', them: 'DH EH M', then: 'DH EH N', than: 'DH AE N', this: 'DH IH S', that: 'DH AE T', these: 'DH IY Z', those: 'DH OW Z',
  with: 'W IH DH', what: 'W AH T', was: 'W AH Z', want: 'W AA N T', all: 'AO L', call: 'K AO L', fall: 'F AO L', small: 'S M AO L',
  love: 'L AH V', of_: 'AH V', one: 'W AH N', once: 'W AH N S', come: 'K AH M', some: 'S AH M', done: 'D AH N', none: 'N AH N',
  gone: 'G AO N', give: 'G IH V', live: 'L IH V', have: 'HH AE V', move: 'M UW V', lose: 'L UW Z', whole: 'HH OW L',
  heart: 'HH AA R T', eyes: 'AY Z', eye: 'AY', night: 'N AY T', light: 'L AY T', right: 'R AY T', tonight: 'T AH|N AY T',
  know: 'N OW', no: 'N OW', go: 'G OW', so: 'S OW', oh: 'OW', low: 'L OW', slow: 'S L OW', show: 'SH OW', grow: 'G R OW', own: 'OW N',
  now: 'N AW', how: 'HH AW', down: 'D AW N', town: 'T AW N', around: 'AH|R AW N D',
  through: 'TH R UW', though: 'DH OW', thought: 'TH AO T', said: 'S EH D', says: 'S EH Z', been: 'B IH N', again: 'AH|G EH N',
  could: 'K UH D', would: 'W UH D', should: 'SH UH D', good: 'G UH D', look: 'L UH K', took: 'T UH K', book: 'B UH K',
  world: 'W ER L D', word: 'W ER D', work: 'W ER K', mind: 'M AY N D', find: 'F AY N D', kind: 'K AY N D', wild: 'W AY L D',
  home: 'HH OW M', alone: 'AH|L OW N', only: 'OW N|L IY', any: 'EH|N IY', many: 'M EH|N IY', every: 'EH V|R IY', ever: 'EH|V ER',
  never: 'N EH|V ER', forever: 'F ER|EH|V ER', baby: 'B EY|B IY', heaven: 'HH EH|V AH N', head: 'HH EH D', dead: 'D EH D',
  break: 'B R EY K', great: 'G R EY T', friend: 'F R EH N D', people: 'P IY|P AH L', together: 'T AH|G EH|DH ER',
  remember: 'R IH|M EH M|B ER', water: 'W AO|T ER', over: 'OW|V ER', under: 'AH N|D ER', little: 'L IH|T AH L',
  something: 'S AH M|TH IH NG', nothing: 'N AH|TH IH NG', everything: 'EH V|R IY|TH IH NG', someone: 'S AH M|W AH N',
  money: 'M AH|N IY', honey: 'HH AH|N IY', other: 'AH|DH ER', mother: 'M AH|DH ER', brother: 'B R AH|DH ER',
  tomorrow: 'T AH|M AA|R OW', sorry: 'S AA|R IY', hold: 'HH OW L D', old: 'OW L D', cold: 'K OW L D', soul: 'S OW L',
  four: 'F AO R', more: 'M AO R', door: 'D AO R', your_: 'Y AO R', sure: 'SH UH R', fire: 'F AY|ER', hour: 'AW|ER',
  dear: 'D IH R', near: 'N IH R', fear: 'F IH R', year: 'Y IH R', tear: 'T IH R', care: 'K EH R', air: 'EH R',
  "don't": 'D OW N T', "won't": 'W OW N T', "can't": 'K AE N T', walk: 'W AO K', talk: 'T AO K', walking: 'W AO|K IH NG', talking: 'T AO|K IH NG',
  always: 'AO L|W EY Z', also: 'AO L|S OW', wow: 'W AW', cow: 'K AW', allow: 'AH|L AW', vow: 'V AW', crowd: 'K R AW D',
  young: 'Y AH NG', touch: 'T AH CH', enough: 'IH|N AH F', rough: 'R AH F', tough: 'T AH F', laugh: 'L AE F',
  yeah: 'Y EH', hey: 'HH EY', ooh: 'UW', ah: 'AA', la: 'L AA', na: 'N AA', da: 'D AA',
};

// ---- Spelling rules --------------------------------------------------------

const ONSET_PAIRS: Record<string, string[]> = {
  ch: ['CH'], sh: ['SH'], th: ['TH'], ph: ['F'], wh: ['W'], ck: ['K'], qu: ['K', 'W'], kn: ['N'], wr: ['R'], gh: ['G'], gn: ['N'],
};
const CODA_PAIRS: Record<string, string[]> = {
  tch: ['CH'], dge: ['JH'], dg: ['JH'], ng: ['NG'], nk: ['NG', 'K'], ck: ['K'], ch: ['CH'], sh: ['SH'], th: ['TH'], ph: ['F'], gh: [], mb: ['M'], ll: ['L'], ss: ['S'], ff: ['F'], zz: ['Z'],
};
const SINGLE: Record<string, string[]> = {
  b: ['B'], c: ['K'], d: ['D'], f: ['F'], g: ['G'], h: ['HH'], j: ['JH'], k: ['K'], l: ['L'], m: ['M'], n: ['N'],
  p: ['P'], q: ['K'], r: ['R'], s: ['S'], t: ['T'], v: ['V'], w: ['W'], x: ['K', 'S'], y: ['Y'], z: ['Z'],
};

function consonants(letters: string, pairs: Record<string, string[]>, beforeFront: boolean): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < letters.length) {
    const three = pairs[letters.slice(i, i + 3)];
    if (three) { out.push(...three); i += 3; continue; }
    const two = pairs[letters.slice(i, i + 2)];
    if (two) { out.push(...two); i += 2; continue; }
    const c = letters[i];
    const soft = (c === 'c' || c === 'g') && i === letters.length - 1 && beforeFront;
    out.push(...(soft ? (c === 'c' ? ['S'] : ['JH']) : SINGLE[c] ?? []));
    i += 1;
  }
  // Doubled letters sound once (running, little).
  return out.filter((p, k) => p !== out[k - 1]);
}

// The vowel a syllable's vowel letters stand for, from what follows them
// and whether a silent e or open syllable makes them long.
function vowelOf(v: string, after: string, open: boolean, magicE: boolean, lone: boolean): { vowel: Vowel, eatsR: boolean } {
  const r = after.startsWith('r');
  const teams: Record<string, Vowel> = {
    ee: 'IY', ea: 'IY', ie: lone ? 'AY' : 'IY', ei: 'EY', ey: 'EY', ai: 'EY', ay: 'EY', oa: 'OW', oe: 'OW', oo: 'UW', ou: 'AW', ow: 'AW',
    oi: 'OY', oy: 'OY', au: 'AO', aw: 'AO', ue: 'UW', ew: 'UW', ui: 'UW', eye: 'AY', igh: 'AY', eigh: 'EY', ay_: 'EY',
  };
  if (r) {
    if (v === 'a') return { vowel: 'AA', eatsR: false };
    if (v === 'o' || v === 'oa' || v === 'ou' || v === 'oo') return { vowel: 'AO', eatsR: false };
    if (v === 'e' || v === 'i' || v === 'u' || v === 'ea' && after.startsWith('rth') || v === 'ou' && after.startsWith('rn')) return { vowel: 'ER', eatsR: true };
    if (v === 'ea' || v === 'ee' || v === 'ie') return { vowel: 'IH', eatsR: false };
    if (v === 'ai') return { vowel: 'EH', eatsR: false };
  }
  if (teams[v]) return { vowel: v === 'oo' && /^(k|d|t)$/.test(after) ? 'UH' : teams[v], eatsR: false };
  const long = open || magicE;
  switch (v[0]) {
    case 'a': return { vowel: /^(ll|lk|lt|w)/.test(after) ? 'AO' : long ? 'EY' : 'AE', eatsR: false };
    case 'e': return { vowel: long ? 'IY' : 'EH', eatsR: false };
    case 'i': return { vowel: long || /^(nd|ld)$/.test(after) ? 'AY' : 'IH', eatsR: false };
    case 'o': return { vowel: long || /^(ld|lt|st)$/.test(after) ? 'OW' : 'AA', eatsR: false };
    case 'u': return { vowel: long ? 'UW' : 'AH', eatsR: false };
    case 'y': return { vowel: after !== '' ? 'IH' : lone ? 'AY' : 'IY', eatsR: false };
    default: return { vowel: 'AH', eatsR: false };
  }
}

const VOICED = new Set(['M', 'N', 'NG', 'L', 'R', 'B', 'D', 'G', 'V', 'DH', 'Z', 'JH']);

// One syllable by the rules. `first`/`last`: it starts/ends its word;
// `lone`: the word is this one syllable.
export function syllableByRules(text: string, first: boolean, last: boolean, lone: boolean): SungSyllable {
  let s = text.toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return { onset: [], vowel: 'AH', coda: [] };
  // A final -le after a consonant is its own sung vowel: lit-tle.
  if (/^[^aeiouy]le$/.test(s)) return { onset: consonants(s[0], ONSET_PAIRS, false), vowel: 'AH', coda: ['L'] };
  // Silent final e (time, chance): it softens c/g before it, and makes a
  // vowel one consonant before it long.
  let magicE = false;
  let silentE = false;
  if (last && s.length > 2 && /[^aeiouy]e$/.test(s) && /[aeiouy]/.test(s.slice(0, -1))) {
    magicE = /[aeiou][^aeiouy]e$/.test(s);
    silentE = true;
    s = s.slice(0, -1);
  }
  // Consonants first - y and the u of qu count as one before a vowel
  // (yes, quiet) - then the vowel letters, then the rest.
  let i = 0;
  while (i < s.length && (!/[aeiouy]/.test(s[i]) || (s[i] === 'y' && /[aeiou]/.test(s[i + 1] ?? '')) || (s[i] === 'u' && s[i - 1] === 'q' && /[aeiouy]/.test(s[i + 1] ?? '')))) i++;
  if (i === s.length) return { onset: consonants(s, ONSET_PAIRS, false), vowel: 'AH', coda: [] };
  let j = i;
  if (/^(eigh|igh)/.test(s.slice(i))) j = i + (s.slice(i).startsWith('eigh') ? 4 : 3);
  else {
    while (j < s.length && /[aeiou]/.test(s[j])) j++;
    if (j === i) j++; // a lone y vowel (my, gym)
    else if (/[wy]/.test(s[j] ?? '') && !/[aeiou]/.test(s[j + 1] ?? '')) j++; // ow, aw, ay, oy
  }
  let on = s.slice(0, i);
  const v = s.slice(i, j);
  // Letters after the vowel; any further vowels (one syllable written as
  // one, like every-thing's "every") are skipped.
  const after = s.slice(j).replace(/[aeiou]/g, '').replace(/y$/, '');
  if (!first && on.startsWith('kn')) on = 'k' + on; // dark-ness: k sounds mid-word
  const open = after === '' && v.length === 1 && v !== 'y' && (!lone || v !== 'e');
  const ow = v === 'ow' ? (after === '' || /^(n|l)/.test(after) === false ? 'OW' : 'AW') : null;
  // -nge is a soft g after n, and a before it is long: change, strange.
  const nge = silentE && after.endsWith('ng');
  const vowelSound = ow ? { vowel: ow as Vowel, eatsR: false } : nge && v === 'a' ? { vowel: 'EY' as Vowel, eatsR: false } : vowelOf(v, after, open, magicE, lone);
  const { vowel, eatsR } = vowelSound;
  const coda = nge
    ? [...consonants(after.slice(0, -2), CODA_PAIRS, false), 'N', 'JH']
    : consonants(eatsR ? after.slice(1) : after, CODA_PAIRS, silentE || /^[eiy]/.test(after.slice(1)));
  // A written final s after a voiced sound buzzes: dreams, ends.
  if (after.endsWith('s') && coda.length > 1 && coda[coda.length - 1] === 'S' && VOICED.has(coda[coda.length - 2])) coda[coda.length - 1] = 'Z';
  return { onset: consonants(on, ONSET_PAIRS, /^[eiy]/.test(v)), vowel, coda };
}

function parseEntry(entry: string): SungSyllable[] {
  return entry.split('|').map(part => {
    const phones = part.trim().split(/\s+/);
    const at = phones.findIndex(p => VOWELS.has(p));
    if (at === -1) return { onset: phones, vowel: 'AH' as Vowel, coda: [] };
    return { onset: phones.slice(0, at), vowel: phones[at] as Vowel, coda: phones.slice(at + 1) };
  });
}

// The sounds of each sung syllable, in order. Syllables are grouped back
// into words by their hyphens, so a word in the dictionary is read whole.
export function sungSyllables(syllables: Array<{ text: string, hyphen: boolean }>): SungSyllable[] {
  const out: SungSyllable[] = [];
  let word: Array<{ text: string }> = [];
  const flush = () => {
    if (word.length === 0) return;
    const whole = word.map(s => s.text).join('').toLowerCase().replace(/[^a-z']/g, '');
    const entry = WORDS[whole];
    const listed = entry ? parseEntry(entry) : null;
    if (listed && listed.length === word.length) out.push(...listed);
    else word.forEach((s, i) => out.push(syllableByRules(s.text, i === 0, i === word.length - 1, word.length === 1)));
    word = [];
  };
  syllables.forEach(s => {
    word.push(s);
    if (!s.hyphen) flush();
  });
  flush();
  return out;
}
