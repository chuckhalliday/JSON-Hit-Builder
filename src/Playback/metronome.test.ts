import { clickTimes, countIn, playClickTrack } from './metronome';

// scheduleTimer (the click callbacks) sets its timers on window.
(globalThis as unknown as { window: typeof globalThis }).window = globalThis;

// A clock the tests move, and the clicks started on it: [time, pitch].
const started: [number, number][] = [];
const param = { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
const fakeContext = {
  currentTime: 0,
  destination: {},
  createGain: () => ({ gain: param, connect() {}, disconnect() {} }),
  createOscillator: () => {
    const osc = {
      frequency: { value: 0 },
      onended: null,
      connect() {},
      disconnect() {},
      start: (t: number) => started.push([t, osc.frequency.value]),
      stop() {},
    };
    return osc;
  },
};
jest.mock('./audioContext', () => ({
  getAudioContext: () => fakeContext,
  ensureAudioRunning: async () => fakeContext,
}));

describe('metronome', () => {
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

  it('clicks on whole beats, accenting each bar, after a lead-in between beats', () => {
    expect(clickTimes(0, 6)).toEqual([0, 1, 2, 3, 0, 1].map((beat, at) => ({ at, beat })));
    expect(clickTimes(2.5, 5)).toEqual([{ at: 2.5, beat: null }, { at: 3, beat: 3 }, { at: 4, beat: 0 }]);
    // Rounded triplet positions still land on the beat.
    expect(clickTimes(1.99, 3)).toEqual([{ at: 2, beat: 2 }]);
    expect(clickTimes(4, 4)).toEqual([]);
  });

  it('plays a click track in time, from where playback starts', async () => {
    // 120 BPM from beat 2.5: half a beat of lead-in, then beats 3 and 4.
    await run(playClickTrack(120, 2.5, 5, () => true, undefined, undefined, { startAt: 11 }));
    expect(started).toEqual([[11.25, 1320], [11.75, 1760]]);
  });

  it('asks whether the metronome is on click by click', async () => {
    let on = true;
    // Clicks are scheduled half a second ahead: switched off once the
    // second beat's is (at 11.5), and before the third's.
    await run(playClickTrack(60, 0, 4, () => on, undefined, undefined, { startAt: 11 }), () => {
      if (fakeContext.currentTime >= 11.6) on = false;
    });
    expect(started.map(([t]) => t)).toEqual([11, 12]);
  });

  it('counts in a bar and starts the music where it ends', async () => {
    const beats: number[] = [];
    const musicAt = await countIn(120, beat => beats.push(beat));
    expect(musicAt).toBeCloseTo(12.1);
    await run(new Promise(resolve => setTimeout(resolve, 2500)));
    expect(started.map(([t, pitch]) => [+t.toFixed(2), pitch])).toEqual([[10.1, 1760], [10.6, 1320], [11.1, 1320], [11.6, 1320]]);
    expect(beats).toEqual([0, 1, 2, 3]);
  });

  it('stops the count-in when playback stops', async () => {
    let stopped = false;
    await countIn(60, undefined, () => stopped);
    await run(new Promise(resolve => setTimeout(resolve, 1200)));
    stopped = true;
    await run(new Promise(resolve => setTimeout(resolve, 4000)));
    expect(started.length).toBeLessThan(4);
  });
});
