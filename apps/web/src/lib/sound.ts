let ctx: AudioContext | null = null;

function tone(c: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** Impact thud timed to the slam, then a rising arpeggio. Safe to call anywhere; fails silently. */
export function playPromotionSound(kind: 'division' | 'tier'): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const impact = ctx.currentTime + (kind === 'tier' ? 1.5 : 1.25);
    tone(ctx, 90, impact, 0.35, 0.25, 'sine');
    const notes = kind === 'tier' ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [659.25, 880, 1046.5];
    notes.forEach((f, i) => tone(ctx!, f, impact + 0.08 + i * 0.09, 0.4, 0.07, 'square'));
  } catch {
    /* audio is optional */
  }
}
