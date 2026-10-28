import type { StatKey } from '@la66/core';
import { mix } from './palette';
import { SIZE, paint } from './paint';

type Ic = '' | 'i' | 'j' | 'h';
const sparks = (x: number, y: number, ax: number, ay: number): boolean =>
  (Math.abs(x - ax) <= 0.7 && Math.abs(y - ay) <= 5) || (Math.abs(y - ay) <= 0.7 && Math.abs(x - ax) <= 5);

const ICON: Record<StatKey, (x: number, y: number) => Ic> = {
  STR(x, y) {
    const dx = x - 31.5;
    const dy = y - 31.5;
    const u = (dx + dy) * 0.7071;
    const v = (dy - dx) * 0.7071;
    if (v >= -22 && v <= 6 && Math.abs(u) <= (v < -18 ? (v + 22) * 0.6 : 2.4)) return u > 0.4 ? 'j' : 'i';
    if (v > 6 && v <= 9 && Math.abs(u) <= 8) return v > 8 ? 'j' : 'i';
    if (v > 9 && v <= 17 && Math.abs(u) <= 1.8) return Math.floor(v) % 3 === 0 ? 'i' : 'j';
    if (Math.hypot(u, v - 19.5) <= 2.6) return 'i';
    return '';
  },
  INT(x, y) {
    const dx = Math.abs(x - 31.5);
    const top = 24 + (dx - 1.5) * 0.4;
    const bot = 43 + (dx - 1.5) * 0.1;
    if (dx < 1.5 && y >= 23 && y <= 44) return 'j';
    if (dx >= 1.5 && dx <= 16.5 && y >= top && y <= bot) {
      if (dx >= 4 && dx <= 14 && y > top + 3 && y < bot - 2 && [29, 33, 37].includes(y)) return 'j';
      return 'i';
    }
    if (dx <= 18 && y > bot && y <= bot + 2.5 && dx >= 1.5) return 'j';
    if (sparks(x, y, 31.5, 15) && y >= 10 && y <= 20 && Math.abs(x - 31.5) <= 5) return 'h';
    return '';
  },
  FOC(x, y) {
    const dx = x - 31.5;
    const dy = y - 31.5;
    const r = Math.hypot(dx, dy);
    const sh: Ic = dx + dy > 0 ? 'j' : 'i';
    if ((r >= 15 && r <= 17) || (r >= 9 && r <= 11)) return sh;
    if (r <= 4.5) return dx < 0 && dy < 0 ? 'h' : 'i';
    if (Math.abs(dx) <= 0.8 && Math.abs(dy) >= 18 && Math.abs(dy) <= 21) return 'i';
    if (Math.abs(dy) <= 0.8 && Math.abs(dx) >= 18 && Math.abs(dx) <= 21) return 'i';
    return '';
  },
  DIS(x, y) {
    // stone pillar
    const dx = Math.abs(x - 31.5);
    let t: Ic = '';
    if (y >= 17 && y < 21 && dx <= 11) t = y === 17 ? 'h' : 'i';
    else if (y >= 21 && y < 24 && dx <= 8) t = 'j';
    else if (y >= 24 && y < 42 && dx <= 6.5) t = Math.floor(dx) % 3 === 2 ? 'j' : 'i';
    else if (y >= 42 && y < 46 && dx <= 9) t = 'i';
    else if (y >= 46 && y < 50 && dx <= 11) t = 'j';
    if (t === 'i' && x >= 34) t = 'j';
    return t;
  },
  WIS(x, y) {
    const inMoon = Math.hypot(x - 30, y - 32) <= 15.5;
    const cut = Math.hypot(x - 38, y - 28);
    if (inMoon && cut > 12.5) return cut < 15 ? 'j' : 'i';
    if (sparks(x, y, 44, 22) && Math.abs(x - 44) <= 5 && Math.abs(y - 22) <= 5) return 'h';
    return '';
  },
};

/** Round medallion with a pixel icon for one of the five stats, 64x64. */
export function emblemPixels(stat: StatKey, color: string): Uint8ClampedArray {
  const L = mix(color, '#ffffff', 0.45);
  const D = mix(color, '#000000', 0.5);
  const ic: Record<string, string> = {
    i: mix(color, '#ffffff', 0.3),
    j: mix(color, '#000000', 0.25),
    h: '#ffffff',
  };
  const grid: string[] = new Array<string>(SIZE * SIZE).fill('');
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const r = Math.hypot(x - 31.5, y - 31.5);
      let t = r <= 23.5 ? 'd' : r <= 28.5 ? 'r' : '';
      if (t === 'd') {
        const i = ICON[stat](x, y);
        if (i) t = i;
      }
      grid[y * SIZE + x] = t;
    }
  }
  return paint(
    grid,
    (t, x, y) => {
      if (t === 'r') {
        const f = (y - 3) / 58;
        return f < 0.3 ? L : f < 0.7 ? color : D;
      }
      if (t === 'd') return (x - 22) ** 2 + (y - 20) ** 2 < 130 ? '#34408a' : y < 36 ? '#2a3470' : '#212a5c';
      return ic[t] ?? color;
    },
    (t, u, x, y) =>
      (t === 'r' && u === 'd' && Math.hypot(x - 31.5, y - 31.5) < 24.5) ||
      ((t === 'i' || t === 'j' || t === 'h') && u === 'd'),
  );
}
