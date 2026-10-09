// The metronome: a bar of count-in clicks before playback starts, and a
// click on every beat while it plays. Clicks always go through Web Audio,
// whatever the sound source: they're for the player, not part of the song.

import { ensureAudioRunning, getAudioContext } from './audioContext';
import { resolveStart, runPreScheduledSequence, scheduleTimer, Register, SequenceTiming } from './scheduler';

const BEATS_PER_BAR = 4;
// Legacy beat positions carry rounded triplets, so whole beats are found
// with a little slack (as in loop.ts).
const EPS = 0.02;

// Called as each click sounds, with its beat in the bar (0 = the downbeat).
export type OnClick = (beat: number) => void;

// A short blip, higher and louder on the downbeat.
function click(ctx: AudioContext, time: number, accent: boolean, register: Register) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1760 : 1320;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  osc.start(time);
  osc.stop(time + 0.06);
  register(() => {
    try { osc.stop(); } catch { /* already stopped */ }
  });
}

// Where the clicks fall playing beats [from, to) of a part: on each whole
// beat, after a silent lead-in when it starts between beats. `beat` is the
// beat in its bar, null for the lead-in.
export function clickTimes(from: number, to: number): { at: number, beat: number | null }[] {
  const out: { at: number, beat: number | null }[] = [];
  const first = Math.max(0, Math.ceil(from - EPS));
  if (first > from + EPS) out.push({ at: from, beat: null });
  for (let b = first; b < to - EPS; b++) out.push({ at: b, beat: b % BEATS_PER_BAR });
  return out;
}

// The click track for beats [from, to) of a part, alongside its other
// tracks. `on` is asked as each click is scheduled (half a second ahead),
// so the metronome can be switched on or off mid-part.
export function playClickTrack(bpm: number, from: number, to: number, on: () => boolean, onClick?: OnClick, shouldStop?: () => boolean, timing?: SequenceTiming): Promise<number> {
  const clicks = clickTimes(from, to);
  const beatSeconds = 60 / bpm;
  return runPreScheduledSequence(
    0,
    clicks.length,
    i => ((clicks[i + 1]?.at ?? to) - clicks[i].at) * beatSeconds,
    (i, time, _duration, register) => {
      const beat = clicks[i].beat;
      if (beat === null || !on()) return;
      click(getAudioContext(), time, beat === 0, register);
      if (onClick) scheduleTimer(time, () => onClick(beat), register);
    },
    shouldStop,
    timing,
  );
}

// A bar of clicks ahead of playback. Resolves, as soon as they're
// scheduled, with the audio-clock time the music starts at: the end of the
// bar. Stopping cancels the clicks still to come.
export async function countIn(bpm: number, onClick?: OnClick, shouldStop?: () => boolean): Promise<number> {
  const start = resolveStart(await ensureAudioRunning());
  void playClickTrack(bpm, 0, BEATS_PER_BAR, () => true, onClick, shouldStop, { startAt: start });
  return start + BEATS_PER_BAR * (60 / bpm);
}
