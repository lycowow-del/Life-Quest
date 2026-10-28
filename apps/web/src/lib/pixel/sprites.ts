import { SIZE } from './paint';

const cache = new Map<string, string>();

/** Renders RGBA pixels to a PNG data URL once per key. */
export function spriteUrl(key: string, make: () => Uint8ClampedArray): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SIZE, SIZE);
  img.data.set(make());
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
