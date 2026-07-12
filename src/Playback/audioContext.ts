let audioContext: AudioContext | null = null;

// Perpetual, humanly-inaudible keep-alive: a 30 Hz sine at -56 dBFS. After a
// few seconds of digital silence Chrome's audio service closes the physical
// output stream and only reopens it when non-silent frames arrive; on this
// Linux/PipeWire stack the sink suspends meanwhile and the reopen takes
// seconds, heard as the first measures of a song playing silently while the
// renderer (and the lamp timers) run on. A signal above the silence-detection
// threshold keeps the stream open for the life of the page. 30 Hz at 0.2%
// amplitude is far below audibility (and below what speakers reproduce down
// there), but well above the detector's power threshold.
function startKeepAlive(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 30;
  const gain = ctx.createGain();
  gain.gain.value = 0.002;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
}

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    startKeepAlive(audioContext);
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// Resolves once the context is genuinely rendering. Scheduling must sample
// currentTime only after this: a context freshly created inside a user
// gesture reports "running" while its output stream is still opening, and on
// Linux the clock burst-advances past wall time during that window — anything
// scheduled against the earlier reading lands in the past and envelope-driven
// voices decay to silence before they become audible.
export async function ensureAudioRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch { /* schedule anyway; the next gesture will resume it */ }
  }
  return ctx;
}
