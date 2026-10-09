import { feelFor, makeFeel, MAX_LOG_LEVEL, MAX_OFFSET, STYLES, velocity } from './realism';
import playChords from './playChords';
import { rng, seedRng } from '../SongStructure/rng';

// scheduleTimer sets its timers on window.
(globalThis as unknown as { window: typeof globalThis }).window = globalThis;

// A clock the tests move, and when each chord tone started on it (the
// acoustic voice's triangle is one per tone).
const started: number[] = [];
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ connect() {}, disconnect() {} });
const fakeContext = {
  currentTime: 0,
  destination: {},
  createGain: () => ({ ...node(), gain: param() }),
  createBiquadFilter: () => ({ ...node(), frequency: param(), Q: param() }),
  createOscillator: () => {
    const osc = { ...node(), type: '', frequency: param(), onended: null, start: (t: number) => { if (osc.type === 'triangle') started.push(t); }, stop() {} };
    return osc;
  },
};
jest.mock('./audioContext', () => ({
  getAudioContext: () => fakeContext,
  ensureAudioRunning: async () => fakeContext,
}));

const sd = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
};

describe('realism', () => {
  beforeEach(() => seedRng(7));

  // Sixteenths at 120 BPM for a minute.
  const grid = Array.from({ length: 480 }, (_, i) => 10 + i * 0.125);

  it('leaves every note on the grid at its written level when off', () => {
    for (const realism of [undefined, () => false]) {
      const feel = feelFor('drums', realism);
      expect(grid.map(t => feel.at(t))).toEqual(grid);
      expect(grid.every(t => feel.level(t) === 1)).toBe(true);
    }
  });

  it('moves notes a few milliseconds either side of the grid, never further than a slip', () => {
    const feel = makeFeel(STYLES.drums, rng);
    const offsets = grid.map(t => feel.at(t) - t);
    expect(offsets.every(o => Math.abs(o) <= MAX_OFFSET)).toBe(true);
    expect(sd(offsets)).toBeGreaterThan(0.002);
    expect(sd(offsets)).toBeLessThan(0.008);
    expect(Math.abs(offsets.reduce((a, b) => a + b, 0) / offsets.length)).toBeLessThan(0.002);
  });

  it('plays a little harder or softer, around the written level', () => {
    const feel = makeFeel(STYLES.drums, rng);
    const levels = grid.map(t => feel.level(t));
    expect(levels.every(l => Math.abs(Math.log(l)) <= MAX_LOG_LEVEL + 1e-9)).toBe(true);
    expect(sd(levels)).toBeGreaterThan(0.04);
    expect(sd(levels)).toBeLessThan(0.15);
  });

  it('keeps voices struck together together, so a kick and hat on one step do not flam', () => {
    const feel = makeFeel(STYLES.drums, rng);
    // Kick and hat on the same steps, each row scheduled on its own.
    const kick = grid.map(t => feel.at(t));
    const hat = grid.map(t => feel.at(t));
    const apart = kick.map((k, i) => Math.abs(k - hat[i]));
    expect(Math.max(...apart)).toBeLessThan(0.01);
    expect(sd(apart)).toBeLessThan(sd(kick.map((k, i) => k - grid[i])) / 2);
  });

  it('drifts: neighbouring notes lean the same way, distant ones independently', () => {
    const feel = makeFeel({ drift: 0.005, jitter: 0, spread: 0, swell: 0, touch: 0 }, rng);
    const offsets = Array.from({ length: 4000 }, (_, i) => feel.at(i * 0.125) - i * 0.125);
    const change = (lag: number) => sd(offsets.slice(lag).map((o, i) => o - offsets[i]));
    // A sixteenth apart they barely differ; seconds apart, as much as any two.
    expect(change(1)).toBeLessThan(change(32) / 4);
  });

  it('scales and clamps MIDI velocities', () => {
    expect(velocity(60, 1)).toBe(60);
    expect(velocity(60, 1.1)).toBe(66);
    expect(velocity(120, 1.2)).toBe(127);
    expect(velocity(1, 0.5)).toBe(1);
  });
});

describe('realism in playback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fakeContext.currentTime = 10;
    started.length = 0;
  });
  afterEach(() => jest.useRealTimers());

  async function run(promise: Promise<unknown>, onTick = () => {}) {
    let settled = false;
    promise.then(() => { settled = true; });
    while (!settled) {
      fakeContext.currentTime += 0.05;
      onTick();
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      await Promise.resolve();
    }
  }

  // Two triads, a beat each at 60 BPM, from 11 s.
  const chords = { oscTones: [[262, 330, 392], [220, 262, 330]], midiTones: [[60, 64, 67], [57, 60, 64]] };
  const play = (realism: () => boolean, onTick?: () => void) =>
    run(playChords(false, 0, ['C', 'Am'], chords, [1, 1], 60, undefined, undefined, undefined, false, true, { startAt: 11 }, undefined, realism), onTick);

  it('plays chords exactly on the grid with it off', async () => {
    await play(() => false);
    expect(started).toEqual([11, 11, 11, 12, 12, 12]);
  });

  it('lands each tone of a chord a hair apart, near the grid, with it on', async () => {
    await play(() => true);
    expect(started).toHaveLength(6);
    started.forEach((t, i) => expect(Math.abs(t - (i < 3 ? 11 : 12))).toBeLessThanOrEqual(MAX_OFFSET));
    expect(new Set(started.slice(0, 3)).size).toBe(3);
  });

  it('is asked note by note, so switching it mid-part takes effect', async () => {
    // Notes are scheduled half a second ahead: switched off once the first
    // chord's are (at 10.5), and before the second's.
    let on = true;
    await play(() => on, () => {
      if (fakeContext.currentTime >= 11) on = false;
    });
    expect(started.slice(0, 3).every(t => t !== 11)).toBe(true);
    expect(started.slice(3)).toEqual([12, 12, 12]);
  });
});
