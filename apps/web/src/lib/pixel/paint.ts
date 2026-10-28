import { OUTLINE, hexToRgb } from './palette';

export const SIZE = 64;
const NEIGHBOURS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Turns a grid of cell types into RGBA pixels. Cells next to empty space get a dark outline;
 * extraEdge adds outlines between specific cell types, noOutline lists types that never get one.
 */
export function paint(
  grid: string[],
  color: (t: string, x: number, y: number) => string,
  extraEdge: (t: string, neighbour: string, x: number, y: number) => boolean = () => false,
  noOutline = '',
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = grid[y * SIZE + x]!;
      if (!t) continue;
      let edge = false;
      for (const [a, b] of NEIGHBOURS) {
        const nx = x + a;
        const ny = y + b;
        const u = nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE ? '' : grid[ny * SIZE + nx]!;
        if (!u || extraEdge(t, u, x, y)) edge = true;
      }
      if (noOutline.includes(t)) edge = false;
      const [r, g, bl] = hexToRgb(edge ? OUTLINE : color(t, x, y));
      const i = (y * SIZE + x) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = bl;
      out[i + 3] = 255;
    }
  }
  return out;
}
