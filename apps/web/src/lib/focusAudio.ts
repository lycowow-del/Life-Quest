import { useSettings } from '../store/settingsStore';

let ctx: AudioContext | null = null;
let ambient: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

function audio(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Soft brown-noise bed that fades in, for focus sessions. Respects the Sound effects switch. */
export function startAmbient(): void {
  if (!useSettings.getState().sound || ambient) return;
  const c = audio();
  if (!c) return;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lowpass = c.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 500;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, c.currentTime + 2);
  src.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(c.destination);
  src.start();
  ambient = { src, gain };
}

export function stopAmbient(): void {
  if (!ambient || !ctx) return;
  const { src, gain } = ambient;
  ambient = null;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  setTimeout(() => {
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
  }, 700);
}

/** A short rising chime when a session starts, and a longer one when it ends. */
export function playChime(kind: 'start' | 'end'): void {
  if (!useSettings.getState().sound) return;
  const c = audio();
  if (!c) return;
  const notes = kind === 'start' ? [523.25, 783.99] : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.14;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}
