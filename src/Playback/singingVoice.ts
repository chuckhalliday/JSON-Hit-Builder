// A sung syllable, synthesized: a formant voice.
//
// A breathy pulse wave at the note's pitch (the vocal folds) runs through
// three band-pass filters at a vowel's resonances (the vocal tract); noise
// through a moving band-pass makes the hisses and bursts of consonants, and
// through the same resonances the breath of an h. Each syllable is laid out
// as its consonants, the vowel it holds the note on, and its closing
// consonants, by automating those gains and filter frequencies - so the
// voice runs on the same audio clock as every other track.

import { Register } from './scheduler';
import { SungSyllable, Vowel } from '../Core/phonemes';
import { midiToFreq } from '../Core/theory';

type Formants = [number, number, number];

// Vowel resonances (Hz) of a higher voice, after Peterson & Barney; the
// two-part vowels glide from the first to the second.
const VOWELS: Record<Vowel, Formants | [Formants, Formants]> = {
  IY: [310, 2790, 3310], IH: [430, 2480, 3070], EH: [610, 2330, 2990], AE: [860, 2050, 2850],
  AA: [850, 1220, 2810], AO: [590, 920, 2710], UH: [470, 1160, 2680], UW: [370, 950, 2670],
  AH: [760, 1400, 2780], ER: [500, 1640, 1960],
  EY: [[520, 2400, 3000], [330, 2700, 3250]], AY: [[850, 1300, 2800], [400, 2500, 3100]],
  OW: [[560, 1000, 2700], [400, 900, 2650]], AW: [[850, 1250, 2800], [420, 950, 2650]],
  OY: [[590, 950, 2700], [400, 2400, 3050]],
};

type Kind = 'stop' | 'affricate' | 'fricative' | 'aspirate' | 'nasal' | 'liquid';
interface Consonant {
  kind: Kind;
  voiced: boolean;
  noise?: [number, number, number]; // center Hz, Q, level
  formants?: Formants; // for the voiced, vowel-like ones
}

const CONSONANTS: Record<string, Consonant> = {
  P: { kind: 'stop', voiced: false, noise: [1000, 1, 0.6] }, B: { kind: 'stop', voiced: true, noise: [800, 1, 0.3] },
  T: { kind: 'stop', voiced: false, noise: [4200, 1.5, 0.6] }, D: { kind: 'stop', voiced: true, noise: [3600, 1.5, 0.3] },
  K: { kind: 'stop', voiced: false, noise: [2000, 2, 0.6] }, G: { kind: 'stop', voiced: true, noise: [1800, 2, 0.3] },
  CH: { kind: 'affricate', voiced: false, noise: [2800, 1.5, 0.55] }, JH: { kind: 'affricate', voiced: true, noise: [2600, 1.5, 0.3] },
  F: { kind: 'fricative', voiced: false, noise: [7000, 0.7, 0.25] }, V: { kind: 'fricative', voiced: true, noise: [6000, 0.7, 0.15] },
  TH: { kind: 'fricative', voiced: false, noise: [7500, 0.7, 0.18] }, DH: { kind: 'fricative', voiced: true, noise: [6000, 0.7, 0.1] },
  S: { kind: 'fricative', voiced: false, noise: [6500, 2, 0.45] }, Z: { kind: 'fricative', voiced: true, noise: [6000, 2, 0.28] },
  SH: { kind: 'fricative', voiced: false, noise: [2800, 1.5, 0.5] }, ZH: { kind: 'fricative', voiced: true, noise: [2600, 1.5, 0.3] },
  HH: { kind: 'aspirate', voiced: false },
  M: { kind: 'nasal', voiced: true, formants: [250, 1100, 2300] }, N: { kind: 'nasal', voiced: true, formants: [250, 1500, 2500] },
  NG: { kind: 'nasal', voiced: true, formants: [250, 2000, 2600] },
  L: { kind: 'liquid', voiced: true, formants: [360, 1100, 2900] }, R: { kind: 'liquid', voiced: true, formants: [420, 1300, 1700] },
  W: { kind: 'liquid', voiced: true, formants: [300, 700, 2200] }, Y: { kind: 'liquid', voiced: true, formants: [280, 2250, 3000] },
};

const LENGTH: Record<Kind, number> = { stop: 0.07, affricate: 0.1, fricative: 0.09, aspirate: 0.06, nasal: 0.07, liquid: 0.06 };
const VOICED_LEVEL: Record<Kind, number> = { stop: 0.12, affricate: 0.2, fricative: 0.3, aspirate: 0, nasal: 0.45, liquid: 0.7 };
// How far ahead of the beat a syllable's opening consonants may start, so
// its vowel - where a note is heard to begin - lands on the beat.
const ANTICIPATION = 0.08;
// The upper resonances carry which vowel it is; they're weighted up so a
// high voice's sparse harmonics still sound them.
const FORMANT_GAINS = [1, 1.1, 0.7];
// Bandwidths, wider than a speaking voice's: a high note's harmonics are
// far apart, and a narrow resonance can fall between them and go unheard.
const FORMANT_WIDTHS = [130, 220, 320];

// Shared per audio context: a second of white noise, and the pulse wave.
const shared = new WeakMap<BaseAudioContext, { noise: AudioBuffer, glottal: PeriodicWave }>();
function resources(ctx: BaseAudioContext) {
  let r = shared.get(ctx);
  if (!r) {
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    // A bright pulse - harmonics falling off like a sawtooth's - so the
    // resonances have something to shape all the way up.
    const n = 64;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) imag[k] = 1 / k;
    r = { noise, glottal: ctx.createPeriodicWave(real, imag) };
    shared.set(ctx, r);
  }
  return r;
}

// Breakpoints for one parameter, applied in order as linear ramps.
class Line {
  private points: Array<[number, number]> = [];
  constructor(private initial: number) {}
  // Hold the current value until t, then move to v over `over` seconds.
  to(t: number, v: number, over = 0.012) {
    const last = this.points.length ? this.points[this.points.length - 1][1] : this.initial;
    this.points.push([t, last], [t + over, v]);
    return this;
  }
  apply(param: AudioParam, start: number) {
    param.setValueAtTime(this.initial, start);
    let prev = start;
    for (const [t, v] of this.points) {
      const time = Math.max(t, prev);
      param.linearRampToValueAtTime(v, time);
      prev = time;
    }
  }
}

const vowelTargets = (v: Vowel): [Formants, Formants] => {
  const f = VOWELS[v];
  return Array.isArray(f[0]) ? (f as [Formants, Formants]) : [f as Formants, f as Formants];
};

// Sing `syllable` on `midi`, its note (vowel) starting at `start` and the
// whole syllable over by `start + duration`.
export function scheduleSungSyllable(ctx: BaseAudioContext, destination: AudioNode, syllable: SungSyllable, midi: number, start: number, duration: number, register: Register, level = 0.5) {
  const { noise, glottal } = resources(ctx);
  const f0 = midiToFreq(midi);
  const onset = syllable.onset.map(p => CONSONANTS[p]).filter(Boolean);
  const coda = syllable.coda.map(p => CONSONANTS[p]).filter(Boolean);
  const [vowelFrom, vowelTo] = vowelTargets(syllable.vowel);

  // Timing: opening consonants start up to ANTICIPATION early; the rest of
  // them, the vowel and the closing ones share the note, consonants never
  // taking more than 40% of it.
  const onsetLength = onset.reduce((t, c) => t + LENGTH[c.kind], 0);
  const codaLength = coda.reduce((t, c) => t + LENGTH[c.kind], 0);
  const early = Math.min(onsetLength, ANTICIPATION);
  const squeeze = Math.min(1, (duration * 0.4) / Math.max(1e-6, onsetLength - early + codaLength));
  const begin = start - early;
  const end = start + duration;

  const voiced = new Line(0);
  const breath = new Line(0);
  const hiss = new Line(0);
  const hissFreq = new Line(4000);
  const hissQ = new Line(1);
  const formants = [0, 1, 2].map(i => new Line(vowelFrom[i]));
  const setFormants = (t: number, f: Formants, over = 0.03) => formants.forEach((line, i) => line.to(t, f[i], over));

  const consonant = (c: Consonant, t: number, length: number) => {
    if (c.formants) setFormants(t, c.formants, 0.015);
    if (c.noise) {
      hissFreq.to(t, c.noise[0], 0.002);
      hissQ.to(t, c.noise[1], 0.002);
    }
    switch (c.kind) {
      case 'stop': {
        const closure = length * 0.45;
        voiced.to(t, c.voiced ? VOICED_LEVEL.stop : 0, 0.008);
        hiss.to(t + closure, c.noise![2], 0.003).to(t + closure + 0.006, 0, length - closure - 0.006);
        break;
      }
      case 'affricate': {
        voiced.to(t, c.voiced ? VOICED_LEVEL.affricate : 0, 0.008);
        hiss.to(t + length * 0.3, c.noise![2], 0.004).to(t + length - 0.015, 0, 0.015);
        break;
      }
      case 'fricative':
        voiced.to(t, c.voiced ? VOICED_LEVEL.fricative : 0, 0.01);
        hiss.to(t, c.noise![2], 0.015).to(t + length - 0.015, 0, 0.015);
        break;
      case 'aspirate':
        voiced.to(t, 0, 0.01);
        setFormants(t, vowelFrom, 0.005);
        breath.to(t, 0.5, 0.01).to(t + length - 0.01, 0.05, 0.01);
        break;
      default:
        voiced.to(t, VOICED_LEVEL[c.kind], 0.015);
    }
  };

  let t = begin;
  onset.forEach((c, k) => {
    const length = k === 0 && onsetLength <= early ? LENGTH[c.kind] : LENGTH[c.kind] * (t + LENGTH[c.kind] > start ? squeeze : 1);
    consonant(c, t, length);
    t += length;
  });
  // The vowel: full voice, a breath of air, gliding for the two-part ones.
  const vowelStart = Math.max(t, begin);
  const codaStart = Math.max(vowelStart + 0.05, end - codaLength * squeeze);
  setFormants(vowelStart, vowelFrom, 0.035);
  voiced.to(vowelStart, 1, 0.02);
  hiss.to(vowelStart, 0, 0.01);
  breath.to(vowelStart, 0.04, 0.02);
  if (vowelFrom !== vowelTo) setFormants(vowelStart + (codaStart - vowelStart) * 0.55, vowelTo, (codaStart - vowelStart) * 0.4);
  t = codaStart;
  coda.forEach(c => {
    const length = LENGTH[c.kind] * squeeze;
    consonant(c, t, length);
    t += length;
  });
  const stop = Math.max(t, end) + 0.03;
  voiced.to(stop - 0.03, 0, 0.03);
  breath.to(stop - 0.03, 0, 0.03);
  hiss.to(stop - 0.03, 0, 0.02);

  // The graph.
  const source = ctx.createOscillator();
  source.setPeriodicWave(glottal);
  source.frequency.value = f0;
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 5.3;
  const vibratoDepth = ctx.createGain();
  vibratoDepth.gain.setValueAtTime(0, begin);
  vibratoDepth.gain.linearRampToValueAtTime(f0 * 0.007, Math.min(stop, start + 0.45));
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(source.frequency);

  const air = ctx.createBufferSource();
  air.buffer = noise;
  air.loop = true;
  const hissSource = ctx.createBufferSource();
  hissSource.buffer = noise;
  hissSource.loop = true;

  const out = ctx.createGain();
  out.gain.value = level;
  out.connect(destination);

  const voicedGain = ctx.createGain();
  const breathGain = ctx.createGain();
  source.connect(voicedGain);
  air.connect(breathGain);
  // The fundamental, kept under the resonances so high notes don't thin out.
  const body = ctx.createBiquadFilter();
  body.type = 'lowpass';
  body.frequency.value = Math.min(1200, f0 * 2.2);
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.08;
  voicedGain.connect(body);
  body.connect(bodyGain);
  bodyGain.connect(out);

  const filters = [0, 1, 2].map(i => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = vowelFrom[i] / FORMANT_WIDTHS[i];
    const gain = ctx.createGain();
    gain.gain.value = FORMANT_GAINS[i];
    voicedGain.connect(filter);
    breathGain.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    formants[i].apply(filter.frequency, begin);
    return { filter, gain };
  });

  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'bandpass';
  const hissGain = ctx.createGain();
  hissSource.connect(hissFilter);
  hissFilter.connect(hissGain);
  hissGain.connect(out);

  voiced.apply(voicedGain.gain, begin);
  breath.apply(breathGain.gain, begin);
  hiss.apply(hissGain.gain, begin);
  hissFreq.apply(hissFilter.frequency, begin);
  hissQ.apply(hissFilter.Q, begin);

  const sources = [source, vibrato, air, hissSource];
  [source, vibrato, air].forEach(s => s.start(begin));
  hissSource.start(begin, 0.37); // a different stretch of the noise than the breath's
  sources.forEach(s => s.stop(stop));
  source.onended = () => {
    [...sources, out, voicedGain, breathGain, body, bodyGain, vibratoDepth, hissFilter, hissGain, ...filters.flatMap(f => [f.filter, f.gain])].forEach(node => node.disconnect());
  };
  register(() => sources.forEach(s => { try { s.stop(); } catch { /* already stopped */ } }));
  return { begin, stop };
}
