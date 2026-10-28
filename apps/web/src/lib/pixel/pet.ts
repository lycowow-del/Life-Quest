import type { PetLook } from '@la66/core';
import { TIER_COLORS, hexToRgb } from './palette';
import { SIZE } from './paint';

export type PetEyes = 'open' | 'blink' | 'sleepy' | 'happy';
interface Tone {
  base: string;
  light: string;
  dark: string;
  noOutline?: boolean;
}
type Pal = Record<string, Tone>;
type Pt = [number, number];

const OUT: [number, number, number] = [26, 18, 48];
const tone = (b: string, l: string, d: string): Tone => ({ base: b, light: l, dark: d });
const flat = (c: string): Tone => ({ base: c, light: c, dark: c, noOutline: true });
const BODY = tone('#B8A6E8', '#DCD0FF', '#8470BF');
const SPARKS: Pt[] = [[5, 8], [58, 6], [4, 30], [10, 20], [58, 28], [30, 3], [3, 54], [59, 54]];

/** Interior outlines between body parts. */
const sep = (t: string, u: string): boolean =>
  (t === 'body' && ['sh', 'sf', 'pad', 'belly', 'w', 'acc', 'sl'].includes(u)) ||
  (t === 'pad' && u === 'body') ||
  (t === 'snout' && u === 'body') ||
  (t === 'sh' && u === 'body');

/**
 * The shell-bearing tortoise companion, 64x64, facing right. An egg first; then four body shapes (baby,
 * young, adult, legend) that change the whole silhouette. The shell takes your tier colours and gains a
 * chevron with every division; apex stages add sparkles.
 */
export function petPixels(look: PetLook, eyes: PetEyes): Uint8ClampedArray {
  const g = new Array<string>(SIZE * SIZE).fill('');
  const set = (x: number, y: number, t: string): void => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) g[y * SIZE + x] = t;
  };
  const ell = (t: string, cx: number, cy: number, rx: number, ry: number, clipY?: number): void => {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && (clipY === undefined || y <= clipY)) g[y * SIZE + x] = t;
  };
  const rect = (t: string, x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t);
  };
  const poly = (t: string, pts: Pt[]): void => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i]!;
          const [xj, yj] = pts[j]!;
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) g[y * SIZE + x] = t;
      }
    }
  };

  const ti = Math.max(0, Math.min(9, look.tierIndex));
  const T = TIER_COLORS[ti]!;
  const iron = TIER_COLORS[0]!;
  const pal: Pal = {
    body: BODY,
    belly: tone('#FFEFD0', '#FFFAEB', '#E2C79B'),
    snout: tone(BODY.light, '#FFFFFF', BODY.base),
    sh: tone(T.base, T.light, T.dark),
    sf: tone('#2f3a7a', '#4552a0', '#232c62'),
    pad: tone(T.base, T.light, T.dark),
    acc: tone(T.light, '#ffffff', T.base),
    gem: tone(T.gem, '#ffffff', T.light),
    w: tone(T.dark, T.base, '#232c62'),
    a: tone('#FFEFD0', '#FFFAEB', '#EBCB9E'),
    i: tone(iron.base, iron.light, iron.dark),
    eye: flat('#2B1B3D'),
    glint: flat('#FFFFFF'),
    cheek: flat('#FF9EB8'),
    sp: flat('#FFFFFF'),
    sl: flat(T.light),
    ch: flat(T.light),
    z: flat('#CFE4FF'),
  };

  const sideEye = (x: number, y: number, fierce: boolean): void => {
    if (eyes === 'open') {
      rect('eye', x - 1, y - 1, x, y + 1);
      set(x - 1, y - 1, 'glint');
      if (fierce) {
        rect('eye', x - 2, y - 3, x + 1, y - 3);
        set(x + 1, y - 4, 'eye');
      }
    } else if (eyes === 'happy') {
      set(x - 1, y + 1, 'eye');
      set(x, y, 'eye');
      set(x + 1, y + 1, 'eye');
    } else {
      rect('eye', x - 1, y + 1, x + 1, y + 1);
      if (eyes === 'sleepy') {
        for (const [zx, zy, n] of [[x + 3, y - 13, 4], [x + 8, y - 18, 3]] as [number, number, number][]) {
          for (let k = 0; k < n; k++) {
            set(zx + k, zy, 'z');
            set(zx + n - 1 - k, zy + k, 'z');
            set(zx + k, zy + n - 1, 'z');
          }
        }
      }
    }
  };
  const cheeks = (x: number, y: number): void => {
    set(x, y, 'cheek');
    set(x + 1, y, 'cheek');
  };
  /** Scute lines on the dome, plus one chevron for each division. */
  const shellMarks = (cx: number, cy: number, rx: number, ry: number, clip: number): void => {
    for (const dx of [-rx * 0.5, 0, rx * 0.5])
      for (let y = Math.round(cy - ry); y <= clip; y++) {
        const x = cx + dx;
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.8) set(x, y, 'sl');
      }
    const ringY = cy - ry * 0.35;
    for (let x = Math.round(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((ringY - cy) / ry) ** 2 < 0.85) set(x, ringY, 'sl');
    const w = Math.round(rx * 0.3);
    for (let k = 0; k < look.chevrons; k++)
      for (let dx = -w; dx <= w; dx++) {
        set(cx + dx, cy - ry * 0.7 + k * 3 + Math.abs(dx) * 0.5, 'ch');
        set(cx + dx, cy - ry * 0.7 + k * 3 + Math.abs(dx) * 0.5 + 1, 'ch');
      }
  };

  if (look.kind === 'egg') {
    ell('a', 32, 36, 14, 19);
    for (let v = 0; v < 10; v++) {
      const hw = v < 6 ? 3 : Math.max(0, 3 - (v - 5) * 0.8);
      for (let u = -3; u <= 3; u++) if (Math.abs(u) <= hw) set(32 + u, 31 + v, 'i');
    }
  } else if (look.form === 0) {
    poly('body', [[14, 52], [4, 57], [15, 58]]);
    for (const x of [18, 27, 38, 45]) rect('body', x, 52, x + 4, 59);
    ell('sh', 31, 47, 17, 14, 52);
    ell('sf', 31, 47, 14, 11, 52);
    shellMarks(31, 47, 14, 11, 51);
    ell('body', 50, 51, 9, 7);
    ell('snout', 55, 54, 4, 3);
    sideEye(51, 49, false);
    set(57, 52, 'eye');
    cheeks(49, 54);
  } else if (look.form === 1) {
    poly('body', [[12, 50], [2, 56], [13, 58]]);
    for (const x of [16, 26, 38, 47]) rect('body', x, 52, x + 6, 60);
    ell('sh', 30, 44, 21, 18, 54);
    ell('sf', 30, 44, 18, 15, 54);
    shellMarks(30, 44, 18, 15, 53);
    poly('pad', [[19, 32], [22, 22], [26, 29]]);
    poly('pad', [[27, 28], [31, 17], [35, 27]]);
    poly('pad', [[36, 29], [40, 22], [43, 33]]);
    ell('body', 53, 48, 9, 8);
    ell('snout', 58, 52, 4, 3);
    poly('pad', [[55, 42], [59, 36], [60, 44]]);
    sideEye(54, 46, false);
    set(60, 50, 'eye');
    cheeks(52, 52);
  } else if (look.form === 2) {
    poly('body', [[9, 48], [0, 52], [2, 60], [13, 58]]);
    ell('pad', 4, 55, 4, 4);
    for (const x of [14, 25, 37, 48]) rect('body', x, 52, x + 8, 61);
    ell('sh', 30, 40, 24, 22, 55);
    ell('sf', 30, 40, 21, 19, 55);
    shellMarks(30, 40, 21, 19, 54);
    for (const [x, h] of [[14, 9], [21, 13], [30, 16], [39, 13], [46, 9]] as Pt[]) {
      const base = 30 + (x < 30 ? (30 - x) * 0.6 : (x - 30) * 0.6);
      poly('pad', [[x - 4, base], [x, 28 - h], [x + 4, base]]);
    }
    ell('body', 54, 45, 9, 9);
    ell('snout', 59, 49, 4, 3);
    poly('acc', [[57, 52], [60, 59], [61, 52]]);
    poly('pad', [[55, 37], [60, 29], [61, 40]]);
    sideEye(55, 43, true);
    set(61, 47, 'eye');
    cheeks(53, 49);
  } else {
    poly('body', [[8, 46], [0, 50], [1, 61], [13, 58]]);
    poly('acc', [[0, 50], [0, 44], [4, 50]]);
    ell('pad', 4, 55, 5, 5);
    for (const x of [13, 25, 37, 49]) rect('body', x, 52, x + 9, 62);
    ell('sh', 30, 38, 27, 24, 55);
    ell('sf', 30, 38, 24, 21, 55);
    shellMarks(30, 38, 24, 21, 54);
    for (const [x, h] of [[9, 8], [16, 14], [23, 19], [30, 23], [37, 19], [44, 14], [51, 8]] as Pt[]) {
      const by = 38 - Math.sqrt(Math.max(0, 1 - ((x - 30) / 24) ** 2)) * 21;
      poly('acc', [[x - 3, by + 4], [x, by - h], [x + 3, by + 4]]);
    }
    poly('gem', [[30, 24], [35, 31], [30, 38], [25, 31]]);
    ell('body', 55, 43, 9, 10);
    ell('snout', 60, 48, 4, 3);
    poly('acc', [[56, 33], [60, 22], [62, 35]]);
    poly('acc', [[50, 34], [49, 24], [54, 33]]);
    poly('acc', [[58, 52], [61, 60], [62, 52]]);
    sideEye(56, 41, true);
    set(61, 46, 'eye');
    cheeks(54, 47);
  }
  for (const [x, y] of SPARKS.slice(0, Math.min(look.apex, SPARKS.length))) {
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]) if (!g[(y + dy) * SIZE + x + dx]) set(x + dx, y + dy, 'sp');
  }

  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  const at = (x: number, y: number): string => (x < 0 || y < 0 || x >= SIZE || y >= SIZE ? '' : g[y * SIZE + x]!);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = g[y * SIZE + x]!;
      if (!t) continue;
      const c = pal[t] ?? BODY;
      const nb = [at(x + 1, y), at(x - 1, y), at(x, y + 1), at(x, y - 1)];
      let col: [number, number, number];
      if (nb.some((u) => !u) && !c.noOutline) col = OUT;
      else if (nb.some((u) => u && u !== t && sep(t, u))) col = OUT;
      else if (!at(x, y - 2) || !at(x - 2, y) || (at(x, y - 2) !== t && sep(t, at(x, y - 2)))) col = hexToRgb(c.light);
      else if (!at(x, y + 2) || !at(x + 2, y)) col = hexToRgb(c.dark);
      else col = hexToRgb(c.base);
      const i = (y * SIZE + x) * 4;
      out[i] = col[0];
      out[i + 1] = col[1];
      out[i + 2] = col[2];
      out[i + 3] = 255;
    }
  }
  return out;
}
