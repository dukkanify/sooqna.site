/**
 * Soft two-tone chime for new in-app notifications.
 * Uses Web Audio API so we do not ship a binary sound asset.
 */
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new Ctx();
  }
  return sharedContext;
}

function tone(
  ctx: AudioContext,
  {
    frequency,
    start,
    duration,
    gain = 0.045,
  }: { frequency: number; start: number; duration: number; gain?: number },
) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Play once when unread count rises. Safe to call from React effects. */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const start = () => {
      const t0 = ctx.currentTime + 0.01;
      tone(ctx, { frequency: 880, start: t0, duration: 0.16, gain: 0.05 });
      tone(ctx, {
        frequency: 1174.7,
        start: t0 + 0.12,
        duration: 0.22,
        gain: 0.04,
      });
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(start).catch(() => undefined);
      return;
    }
    start();
  } catch {
    // Autoplay / unsupported — ignore quietly.
  }
}

/** Unlock audio after a user gesture so later chimes are allowed. */
export function unlockNotificationAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
  } catch {
    // ignore
  }
}
