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

// iOS plays Web Audio on the "ambient" session, which the ringer switch
// mutes. Safari 16.4+ exposes navigator.audioSession to opt into "playback"
// (not in this TypeScript version's DOM lib, hence the cast).
function requestPlaybackSession(): boolean {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (!session) return false;
  session.type = "playback";
  return true;
}

// Older iOS has no audioSession, but an HTML media element playing switches
// the page's session to playback, taking Web Audio with it. A looping clip of
// silence, started from a gesture, does that without being heard.
function silentWavUrl(): string {
  const samples = 800; // 0.1 s of 8-bit mono at 8 kHz
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) =>
    [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  ascii(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  ascii(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(0x80, 44); // 8-bit PCM silence is the midpoint
  return "data:audio/wav;base64," + btoa(String.fromCharCode(...bytes));
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

let silentAudio: HTMLAudioElement | null = null;

// Mobile browsers (iOS above all) only let resume() start the context when it
// is called synchronously inside a user gesture; a resume reached later - from
// a React effect, or after an await - is refused and Play stays silent. So
// every tap or keypress resumes a non-running context on the spot. Staying
// installed also recovers from interruptions (screen lock, app switch, a
// call), which leave the context "suspended"/"interrupted" until a gesture.
function installGestureUnlock(ctx: AudioContext) {
  const needsSilentAudio = !requestPlaybackSession() && isIOS();
  const unlock = () => {
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    if (needsSilentAudio) {
      if (!silentAudio) {
        silentAudio = new Audio(silentWavUrl());
        silentAudio.loop = true;
      }
      if (silentAudio.paused) silentAudio.play().catch(() => {});
    }
  };
  // touchend/click/keydown are what iOS counts as activation (touchstart and
  // pointerdown are not). Capture phase, so a handler that stops propagation
  // can't swallow the unlock.
  for (const type of ["touchend", "click", "keydown"]) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
}

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    startKeepAlive(audioContext);
    installGestureUnlock(audioContext);
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
