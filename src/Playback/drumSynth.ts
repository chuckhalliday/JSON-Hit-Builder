// Oscillator/noise drum synthesis. Replaces the old preloaded mp3 samples so
// every drum-machine row (including the previously silent toms and ride) has a
// voice, in two flavors selected by the app-wide Acoustic/Synth toggle:
//
//  - "acoustic": noise-forward recipes with natural shell tunings and soft
//    attacks, voiced to sit with the plucked acoustic bass and piano chords.
//  - "synth": classic analog-machine recipes (sine-drop kick, metallic
//    square-bank hats, lightly saturated toms), voiced to sit with the
//    distorted saw bass and saw chords.
//
// The tonal voices (kick, toms, snare body) tune themselves from the song key
// so the kit agrees with whatever the bass and chords are playing; the
// noise/metal voices (hats, ride, crash) are deliberately inharmonic.
//
// Every function takes the context and destination explicitly so voices can be
// rendered through an OfflineAudioContext for testing.

export type DrumStop = () => void;

type Src = OscillatorNode | AudioBufferSourceNode;

// Drum-machine row order (matches DrumMachine.tsx / drums.ts).
const KICK = 0, SNARE = 1, LOW_TOM = 2, MID_TOM = 3, HIGH_TOM = 4,
  HIHAT_C = 5, HIHAT_O = 6, RIDE = 7, CRASH = 8;

// Semitone offsets above A for parsing the song key's root note.
const NOTE_SEMITONES: Record<string, number> = {
  A: 0, 'A#': 1, Bb: 1, B: 2, C: 3, 'C#': 4, Db: 4, D: 5, 'D#': 6, Eb: 6,
  E: 7, F: 8, 'F#': 9, Gb: 9, G: 10, 'G#': 11, Ab: 11,
};

// Parses a key string like "C# Major" to its root frequency (A2-referenced,
// 110-208 Hz). Unknown/empty keys fall back to A so playback never breaks.
export function keyRootHz(key?: string): number {
  const note = key?.trim().split(/\s+/)[0] ?? '';
  const semitones = NOTE_SEMITONES[note] ?? 0;
  return 110 * Math.pow(2, semitones / 12);
}

// Folds a frequency by octaves into [min, 2*min) so each drum can pick the
// octave of the key root that suits its register.
function foldToRange(hz: number, min: number): number {
  let f = hz;
  while (f >= min * 2) f /= 2;
  while (f < min) f *= 2;
  return f;
}

// Gentle tanh curve for the synth kick/toms: adds harmonic growl that matches
// the distorted synth bass without audibly clipping.
const SOFT_CLIP = new Float32Array(257);
for (let i = 0; i < 257; i++) {
  const x = (i - 128) / 128;
  SOFT_CLIP[i] = Math.tanh(x * 2.5);
}

// Shared 2-second white-noise buffer, cached per context (WeakMap so offline
// render contexts get their own and are freed afterwards).
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 2), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

// Per-hit assembly. Components (tones, noise bursts, metal banks) connect into
// a shared per-hit gain that applies velocity and the voice's mix level;
// endHit() starts every source, wires teardown, and returns the stop handle
// that playback registers for cancellation.
interface Hit {
  ctx: BaseAudioContext;
  out: GainNode;
  t: number;
  sources: Src[];
  stops: number[];
  nodes: AudioNode[];
}

function newHit(ctx: BaseAudioContext, destination: AudioNode, t: number, gain: number): Hit {
  const out = ctx.createGain();
  out.gain.value = gain;
  out.connect(destination);
  return { ctx, out, t, sources: [], stops: [], nodes: [out] };
}

// Percussive envelope: near-instant attack, exponential decay to silence.
function decayEnv(hit: Hit, peak: number, decay: number, attack = 0.002): GainNode {
  const env = hit.ctx.createGain();
  env.gain.setValueAtTime(0, hit.t);
  env.gain.linearRampToValueAtTime(peak, hit.t + attack);
  env.gain.exponentialRampToValueAtTime(0.0008, hit.t + attack + decay);
  env.gain.linearRampToValueAtTime(0, hit.t + attack + decay + 0.01);
  hit.nodes.push(env);
  return env;
}

interface ToneSpec {
  type: OscillatorType;
  from: number;        // start frequency
  to?: number;         // glide target (pitch-drop drums)
  glide?: number;      // seconds to reach `to`
  peak: number;
  decay: number;
  attack?: number;
  shape?: boolean;     // route through the soft-clip curve (synth flavor)
}

function addTone(hit: Hit, spec: ToneSpec) {
  const osc = hit.ctx.createOscillator();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.from, hit.t);
  if (spec.to !== undefined && spec.glide !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(spec.to, hit.t + spec.glide);
  }
  const env = decayEnv(hit, spec.peak, spec.decay, spec.attack);
  osc.connect(env);
  if (spec.shape) {
    const shaper = hit.ctx.createWaveShaper();
    shaper.curve = SOFT_CLIP;
    env.connect(shaper);
    shaper.connect(hit.out);
    hit.nodes.push(shaper);
  } else {
    env.connect(hit.out);
  }
  hit.sources.push(osc);
  hit.stops.push(hit.t + (spec.attack ?? 0.002) + spec.decay + 0.02);
}

interface NoiseSpec {
  peak: number;
  decay: number;
  attack?: number;
  filterType: BiquadFilterType;
  freq: number;
  Q?: number;
}

function addNoise(hit: Hit, spec: NoiseSpec) {
  const src = hit.ctx.createBufferSource();
  src.buffer = getNoiseBuffer(hit.ctx);
  src.loop = true;
  const filter = hit.ctx.createBiquadFilter();
  filter.type = spec.filterType;
  filter.frequency.value = spec.freq;
  if (spec.Q !== undefined) filter.Q.value = spec.Q;
  const env = decayEnv(hit, spec.peak, spec.decay, spec.attack);
  src.connect(filter);
  filter.connect(env);
  env.connect(hit.out);
  hit.nodes.push(filter);
  hit.sources.push(src);
  hit.stops.push(hit.t + (spec.attack ?? 0.002) + spec.decay + 0.02);
}

// Classic drum-machine cymbal core: a bank of square waves at mutually
// inharmonic ratios, squeezed through a bandpass+highpass pair so only the
// clangorous upper partials survive.
const METAL_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];

interface MetalSpec {
  base: number;        // fundamental the ratio bank multiplies
  bandpass: number;
  highpass: number;
  peak: number;
  decay: number;
  attack?: number;
}

function addMetal(hit: Hit, spec: MetalSpec) {
  const bandpass = hit.ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = spec.bandpass;
  const highpass = hit.ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = spec.highpass;
  const env = decayEnv(hit, spec.peak, spec.decay, spec.attack);
  bandpass.connect(highpass);
  highpass.connect(env);
  env.connect(hit.out);
  hit.nodes.push(bandpass, highpass);
  const stopAt = hit.t + (spec.attack ?? 0.002) + spec.decay + 0.02;
  for (const ratio of METAL_RATIOS) {
    const osc = hit.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = spec.base * ratio;
    osc.connect(bandpass);
    hit.sources.push(osc);
    hit.stops.push(stopAt);
  }
}

function endHit(hit: Hit): DrumStop {
  let lastIndex = 0;
  for (let i = 1; i < hit.stops.length; i++) {
    if (hit.stops[i] > hit.stops[lastIndex]) lastIndex = i;
  }
  hit.sources.forEach((src, i) => {
    src.start(hit.t);
    src.stop(hit.stops[i]);
  });
  const teardown = () => {
    for (const src of hit.sources) src.disconnect();
    for (const node of hit.nodes) node.disconnect();
  };
  hit.sources[lastIndex].onended = teardown;
  return () => {
    for (const src of hit.sources) {
      try { src.stop(); } catch { /* already stopped */ }
    }
  };
}

// --- Kick -------------------------------------------------------------------
// Both flavors are a sine pitch-drop landing on the key root folded into the
// sub register, so the kick sits on the same fundamental the bass resolves to.

function kickSynth(hit: Hit, rootHz: number) {
  const fund = foldToRange(rootHz, 40);
  // Long saturated 808-style drop with a filtered tick for the attack.
  addTone(hit, { type: 'sine', from: fund * 3.4, to: fund, glide: 0.07, peak: 1.0, decay: 0.45, shape: true });
  addNoise(hit, { filterType: 'highpass', freq: 1500, peak: 0.3, decay: 0.015, attack: 0.001 });
}

function kickAcoustic(hit: Hit, rootHz: number) {
  const fund = foldToRange(rootHz, 40);
  // Tight punchy drop plus a beater click and a brief shell knock.
  addTone(hit, { type: 'sine', from: fund * 2.3, to: fund, glide: 0.035, peak: 1.0, decay: 0.24 });
  addTone(hit, { type: 'triangle', from: fund * 1.8, peak: 0.15, decay: 0.05 });
  addNoise(hit, { filterType: 'lowpass', freq: 3500, peak: 0.35, decay: 0.012, attack: 0.001 });
}

// --- Snare ------------------------------------------------------------------

function snareSynth(hit: Hit) {
  // Machine snare: two fixed detuned partials under a bright noise burst.
  addTone(hit, { type: 'triangle', from: 185, to: 160, glide: 0.06, peak: 0.5, decay: 0.12 });
  addTone(hit, { type: 'triangle', from: 330, to: 300, glide: 0.06, peak: 0.3, decay: 0.1 });
  addNoise(hit, { filterType: 'highpass', freq: 1400, peak: 0.8, decay: 0.2, attack: 0.001 });
}

function snareAcoustic(hit: Hit, rootHz: number) {
  // Drum-head modes tuned near the key root plus snare-wire noise; the second
  // mode is deliberately inharmonic (x1.78) like a real shell.
  const body = foldToRange(rootHz, 170);
  addTone(hit, { type: 'triangle', from: body, to: body * 0.94, glide: 0.08, peak: 0.45, decay: 0.14 });
  addTone(hit, { type: 'triangle', from: body * 1.78, peak: 0.22, decay: 0.1 });
  addNoise(hit, { filterType: 'bandpass', freq: 3200, Q: 0.6, peak: 0.7, decay: 0.28, attack: 0.001 });
  addNoise(hit, { filterType: 'highpass', freq: 6000, peak: 0.3, decay: 0.18, attack: 0.001 });
}

// --- Toms -------------------------------------------------------------------
// The low tom takes the key root folded into the tom register; mid and high
// stack a fifth and an octave above it, so fills outline the key.

function tomFund(rootHz: number, voice: number): number {
  const low = foldToRange(rootHz, 80);
  return voice === LOW_TOM ? low : voice === MID_TOM ? low * 1.5 : low * 2;
}

function tomSynth(hit: Hit, rootHz: number, voice: number) {
  const fund = tomFund(rootHz, voice);
  const decay = voice === LOW_TOM ? 0.4 : voice === MID_TOM ? 0.35 : 0.3;
  addTone(hit, { type: 'sine', from: fund * 1.9, to: fund, glide: 0.09, peak: 1.0, decay, shape: true });
  addNoise(hit, { filterType: 'lowpass', freq: 800, peak: 0.2, decay: 0.02, attack: 0.001 });
}

function tomAcoustic(hit: Hit, rootHz: number, voice: number) {
  const fund = tomFund(rootHz, voice);
  const decay = voice === LOW_TOM ? 0.55 : voice === MID_TOM ? 0.45 : 0.38;
  addTone(hit, { type: 'triangle', from: fund * 1.5, to: fund, glide: 0.12, peak: 0.9, decay });
  addNoise(hit, { filterType: 'lowpass', freq: 2500, peak: 0.2, decay: 0.01, attack: 0.001 });
}

// --- Hi-hats ----------------------------------------------------------------

function hatSynth(hit: Hit, open: boolean) {
  // Pure metal-bank hat; the open flavor just lets the envelope ring.
  addMetal(hit, { base: 40, bandpass: 10000, highpass: 7000, peak: 1.0, decay: open ? 0.4 : 0.05, attack: 0.001 });
}

function hatAcoustic(hit: Hit, open: boolean) {
  // Mostly air: filtered noise with a quiet metallic shimmer underneath.
  addNoise(hit, { filterType: 'highpass', freq: open ? 7500 : 8500, peak: 1.0, decay: open ? 0.38 : 0.05, attack: 0.001 });
  addMetal(hit, { base: 40, bandpass: 9000, highpass: 8000, peak: 0.25, decay: open ? 0.3 : 0.03, attack: 0.001 });
}

// --- Ride -------------------------------------------------------------------

function rideSynth(hit: Hit) {
  addMetal(hit, { base: 52, bandpass: 6800, highpass: 4500, peak: 0.6, decay: 0.9, attack: 0.001 });
  addTone(hit, { type: 'sine', from: 1250, peak: 0.2, decay: 0.15 });
}

function rideAcoustic(hit: Hit) {
  // Stick ping over a long airy wash.
  addTone(hit, { type: 'triangle', from: 987, peak: 0.35, decay: 0.4 });
  addTone(hit, { type: 'sine', from: 1480, peak: 0.15, decay: 0.25 });
  addNoise(hit, { filterType: 'highpass', freq: 8000, peak: 0.25, decay: 1.1, attack: 0.001 });
}

// --- Crash ------------------------------------------------------------------

function crashSynth(hit: Hit) {
  addMetal(hit, { base: 47, bandpass: 5500, highpass: 3800, peak: 0.7, decay: 1.3, attack: 0.001 });
  addNoise(hit, { filterType: 'highpass', freq: 5000, peak: 0.6, decay: 1.1, attack: 0.001 });
}

function crashAcoustic(hit: Hit) {
  addNoise(hit, { filterType: 'highpass', freq: 4500, peak: 0.8, decay: 1.5, attack: 0.001 });
  addNoise(hit, { filterType: 'bandpass', freq: 9000, Q: 0.5, peak: 0.4, decay: 0.8, attack: 0.001 });
  addMetal(hit, { base: 55, bandpass: 7000, highpass: 5000, peak: 0.25, decay: 1.0, attack: 0.001 });
}

// Per-voice mix levels, balancing the synthesized kit roughly the way the old
// normalized samples sat against the bass and chord voices.
const VOICE_LEVELS: Record<number, number> = {
  [KICK]: 0.9, [SNARE]: 0.75, [LOW_TOM]: 0.8, [MID_TOM]: 0.8, [HIGH_TOM]: 0.8,
  [HIHAT_C]: 0.32, [HIHAT_O]: 0.32, [RIDE]: 0.4, [CRASH]: 0.45,
};

// Schedules one drum hit at `time`. `velocity` is the same 0-1.2 gain scale
// the sample player used (velocity/100 with accents up to 120). Returns a stop
// handle for playback cancellation, or undefined for an unknown voice.
export function playDrumVoice(
  ctx: BaseAudioContext,
  destination: AudioNode,
  voice: number,
  time: number,
  velocity: number,
  acoustic: boolean,
  rootHz: number,
): DrumStop | undefined {
  const level = VOICE_LEVELS[voice];
  if (level === undefined) return undefined;
  const hit = newHit(ctx, destination, time, velocity * level);

  switch (voice) {
    case KICK:
      acoustic ? kickAcoustic(hit, rootHz) : kickSynth(hit, rootHz);
      break;
    case SNARE:
      acoustic ? snareAcoustic(hit, rootHz) : snareSynth(hit);
      break;
    case LOW_TOM:
    case MID_TOM:
    case HIGH_TOM:
      acoustic ? tomAcoustic(hit, rootHz, voice) : tomSynth(hit, rootHz, voice);
      break;
    case HIHAT_C:
      acoustic ? hatAcoustic(hit, false) : hatSynth(hit, false);
      break;
    case HIHAT_O:
      acoustic ? hatAcoustic(hit, true) : hatSynth(hit, true);
      break;
    case RIDE:
      acoustic ? rideAcoustic(hit) : rideSynth(hit);
      break;
    case CRASH:
      acoustic ? crashAcoustic(hit) : crashSynth(hit);
      break;
  }

  return endHit(hit);
}
