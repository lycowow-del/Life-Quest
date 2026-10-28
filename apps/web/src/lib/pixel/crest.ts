import { OUTLINE, TIER_COLORS, hexToRgb, mix } from './palette';
import { SIZE, paint } from './paint';

/**
 * Winged-shield rank crest, 64x64. Higher tiers get wider wings with more feathers, trim, gems,
 * engraving inside the shield and crowns. `chevrons` (0 to 4) are the division marks below.
 */
export function crestPixels(tierIndex: number, chevrons: number): Uint8ClampedArray {
  const ti = Math.max(0, Math.min(9, Math.round(tierIndex)));
  const { light: L, base: B, dark: D, gem: G } = TIER_COLORS[ti]!;
  const bands = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6][ti]!;
  const sw = 11 + ti * 0.33;
  const top = 14 - ti * 0.2;
  const span = 10 + ti * 1.1;
  const wk = 0.95 + ti * 0.04;
  const gr = ti < 2 ? 0 : 2.4 + ti * 0.38;
  const wy = (u: number): [number, number] => [
    30 - u * wk,
    42 - u * 0.55 + (bands >= 3 && Math.floor(u) % 3 === 0 ? 1.2 : 0),
  ];
  const hw = (y: number) => (y <= 32 ? sw : sw * Math.pow(Math.max(0, 1 - (y - 32) / 20), 0.7));
  const h2 = (y: number) =>
    y <= 32 ? sw - 3.3 : (sw - 3.3) * Math.pow(Math.max(0, 1 - (y - 32) / 18), 0.7);
  const sparks: [number, number][] = [[8, 6], [55, 6]];
  if (ti === 9) sparks.push([4, 22], [59, 22]);

  const grid: string[] = new Array<string>(SIZE * SIZE).fill('');
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = Math.abs(x - 31.5);
      const u = dx - (sw - 2.5);
      let t = '';
      if (u >= 0 && u <= span) {
        const [yt, yb] = wy(u);
        if (y >= yt && y <= yb) t = 'w';
      }
      if (y >= top && y <= 52 && dx <= hw(y)) {
        t = 'r';
        if (y >= top + 3 && y <= 50 && dx <= h2(y)) t = 'f';
        else if (ti >= 3 && dx > hw(y) - 2.2 && dx <= hw(y) - 1.2) t = 'm';
      }
      if (t === 'f' && ti < 3 && y >= 30 && y <= 41 && Math.abs(dx - (y - 30) * 0.65) < 1.1) t = 'v';
      if (t === 'f' && gr && dx + Math.abs(y - 25) * 0.85 <= gr) t = 'g';
      if (t === 'f' && ti >= 6 && Math.hypot(dx - (sw - 5.5), y - 35) <= 1.6) t = 'g';
      if (t === 'f') {
        const hd = h2(y) - dx;
        const yy = y - (top + 3);
        const ang = (Math.atan2(y - 25, dx) * 180) / Math.PI;
        const rr = Math.hypot(dx, y - 25);
        const band = ti < 2 && y >= 33 && y <= 34;
        const bar = ti >= 1 && ti < 4 && dx < 0.8 && y >= 31;
        const chev =
          ti >= 2 &&
          [0, 1, 2, 3].some(
            (j) =>
              j < Math.floor(ti / 2) &&
              Math.abs(dx - (y - 33 - j * 3.5) * 0.7) < 0.65 &&
              y >= 33 + j * 3.5 &&
              y <= 48,
          );
        const frame = ti >= 4 && ((hd >= 1.6 && hd < 2.5) || (yy >= 1.6 && yy < 2.5 && dx < h2(y) - 1.6));
        const rays = ti >= 5 && rr > gr + 1.5 && rr < 11 && (((ang + 90) % 30) + 30) % 30 < 3.2;
        const lat = ti >= 6 && y >= 36 && ((dx + y) % 5 === 0 || (y - dx + 50) % 5 === 0);
        if (band || bar || chev || frame || rays || lat) t = 'n';
      }
      if (ti >= 6 && y < top) {
        const c = 4 + (ti - 6) * 2;
        const h =
          dx < 1.6 ? c : dx >= 4.5 && dx < 6.5 ? 3 + (ti - 6) : ti >= 8 && dx >= 8.5 && dx < 10.5 ? 3 : 0;
        if (h && y >= top - h) t = 'k';
      }
      for (let k = 0; k < chevrons; k++) {
        if (dx <= 6 && Math.abs(y - (chevronY(k) + dx * 0.38)) < 0.85) t = 'c';
      }
      if (ti >= 8 && !t) {
        for (const [a, b] of sparks) {
          if ((x === a && Math.abs(y - b) <= 2) || (y === b && Math.abs(x - a) <= 2)) t = 's';
        }
      }
      grid[y * SIZE + x] = t;
    }
  }

  return paint(
    grid,
    (t, x, y) => {
      const dx = Math.abs(x - 31.5);
      if (t === 'w') {
        const [yt, yb] = wy(dx - (sw - 2.5));
        const tt = ((y - yt) / (yb - yt)) * bands;
        const b = Math.min(bands - 1, Math.floor(tt));
        if (tt % 1 < 0.14 && b > 0) return OUTLINE;
        return b === 0 ? L : b === bands - 1 && bands > 2 ? D : B;
      }
      if (t === 'r' || t === 'k') {
        if (ti < 2 && Math.abs(dx - sw + 1.5) < 1 && (y === 21 || y === 35)) return G;
        const s = (y - top) / (52 - top);
        return s < 0.25 ? L : s < 0.7 ? B : D;
      }
      if (t === 'm') return mix(L, '#ffffff', 0.5);
      if (t === 'v' || t === 'c') return L;
      if (t === 'n') return mix(L, '#2f3a7a', 0.5);
      if (t === 's') return '#ffffff';
      if (t === 'g') return y < 25 ? (x < 32 ? G : L) : x < 32 ? B : D;
      const sh = x - y * 0.5;
      return sh > 14 && sh < 18 ? '#3d4a96' : y < 34 ? '#2f3a7a' : '#232c62';
    },
    (t, u) => (t === 'w' && u !== 'w') || (t === 'g' && u === 'f'),
    'sc', // sparkles and division chevrons stay unoutlined so thin lines remain visible
  );
}

/** Y position (0-63) where division chevron k (0 = first) sits at the centre line. */
export const chevronY = (k: number): number => 54 + k * 2.2;

/**
 * Only division chevron k, on a transparent 64x64 layer aligned with crestPixels, so the
 * promotion scene can animate the new chevron slamming into place.
 */
export function chevronPixels(tierIndex: number, k: number): Uint8ClampedArray {
  const ti = Math.max(0, Math.min(9, Math.round(tierIndex)));
  const [r, g, b] = hexToRgb(TIER_COLORS[ti]!.light);
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = Math.abs(x - 31.5);
      if (dx <= 6 && Math.abs(y - (chevronY(k) + dx * 0.38)) < 0.85) {
        const i = (y * SIZE + x) * 4;
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }
    }
  }
  return out;
}
