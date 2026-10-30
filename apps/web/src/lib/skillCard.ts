import type { Milestone, Rarity } from '@la66/core';
import { crestPixels } from './pixel/crest';
import { emblemPixels } from './pixel/emblem';
import { STAT_META } from './theme';

export const CARD_W = 480;
export const CARD_H = 680;
const SCALE = 2;

const RARITY: Record<Rarity, { label: string; main: string; glow: string; sparkles: number }> = {
  common: { label: 'COMMON', main: '#A9B4C8', glow: 'rgba(169,180,200,.35)', sparkles: 0 },
  rare: { label: 'RARE', main: '#A8E6FF', glow: 'rgba(168,230,255,.45)', sparkles: 7 },
  epic: { label: 'EPIC', main: '#C9B6FF', glow: 'rgba(201,182,255,.5)', sparkles: 14 },
  mythic: { label: 'MYTHIC', main: '#FFE08A', glow: 'rgba(255,224,138,.6)', sparkles: 24 },
};

function sprite(px: Uint8ClampedArray): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(64, 64);
  img.data.set(px);
  ctx.putImageData(img, 0, 0);
  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Small deterministic pseudo-random numbers, so a card always draws the same sparkles. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Draws a collectible skill card at 960x1360 (2x), original pixel-crest artwork on a rarity-coloured frame. */
export async function renderSkillCard(m: Milestone, info: { player: string; dateLabel: string }): Promise<HTMLCanvasElement> {
  try {
    await document.fonts.load('16px "Press Start 2P"');
  } catch {
    /* falls back to the system monospace font */
  }
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W * SCALE;
  canvas.height = CARD_H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  const R = RARITY[m.rarity];
  const pixel = (size: number): string => `${size}px "Press Start 2P", ui-monospace, monospace`;
  const text = (s: string, y: number, size: number, color: string, x = CARD_W / 2): void => {
    ctx.font = pixel(size);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(s, x, y);
  };

  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, '#1d2656');
  bg.addColorStop(1, '#0f1530');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const glow = ctx.createRadialGradient(CARD_W / 2, 330, 20, CARD_W / 2, 330, 270);
  glow.addColorStop(0, R.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.lineWidth = 6;
  ctx.strokeStyle = R.main;
  roundRect(ctx, 10, 10, CARD_W - 20, CARD_H - 20, 22);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,.3)';
  roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, 16);
  ctx.stroke();
  ctx.fillStyle = R.main;
  for (const [cx, cy] of [[34, 34], [CARD_W - 34, 34], [34, CARD_H - 34], [CARD_W - 34, CARD_H - 34]]) {
    ctx.save();
    ctx.translate(cx!, cy!);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  const rnd = seeded(m.id);
  for (let i = 0; i < R.sparkles; i++) {
    const x = 40 + rnd() * (CARD_W - 80);
    const y = 60 + rnd() * (CARD_H - 120);
    ctx.fillStyle = i % 2 ? '#ffffff' : R.main;
    ctx.fillRect(x - 1, y - 5, 2, 10);
    ctx.fillRect(x - 5, y - 1, 10, 2);
  }

  text('SKILL CARD', 74, 14, R.main);
  text(`DAY ${m.day}`, 130, 36, '#FFFFFF');
  text(R.label, 160, 13, R.main);

  ctx.imageSmoothingEnabled = false;
  if (m.rank) {
    ctx.drawImage(sprite(crestPixels(m.rank.tierIndex, m.rank.chevrons)), (CARD_W - 320) / 2, 182, 320, 320);
    text(m.rank.label.toUpperCase(), 536, 15, '#FFFFFF');
  } else {
    ctx.drawImage(sprite(emblemPixels(m.topStat, STAT_META[m.topStat].color)), (CARD_W - 256) / 2, 206, 256, 256);
  }
  const meta = STAT_META[m.topStat];
  text(m.archetype.toUpperCase(), 580, 20, meta.color);
  text(`TOP STAT: ${meta.label.toUpperCase()}`, 606, 10, '#A9B1D6');
  text(`${info.player} · CYCLE ${m.cycle}`.toUpperCase(), 640, 10, '#FFFFFF');
  text(info.dateLabel, 658, 9, '#A9B1D6');
  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
