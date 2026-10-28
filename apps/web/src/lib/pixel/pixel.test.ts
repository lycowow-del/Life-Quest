import { describe, expect, it } from 'vitest';
import { chevronPixels, crestPixels } from './crest';
import { emblemPixels } from './emblem';

const opaque = (p: Uint8ClampedArray): number => {
  let n = 0;
  for (let i = 3; i < p.length; i += 4) if (p[i] !== 0) n++;
  return n;
};
const same = (a: Uint8ClampedArray, b: Uint8ClampedArray): boolean => a.every((v, i) => v === b[i]);

describe('pixel crests', () => {
  it('render 64x64 RGBA for every tier', () => {
    for (let t = 0; t < 10; t++) {
      const p = crestPixels(t, 0);
      expect(p).toHaveLength(64 * 64 * 4);
      expect(opaque(p) > 400).toBe(true);
    }
  });
  it('gain detail as the tier climbs', () => {
    expect(opaque(crestPixels(9, 0)) > opaque(crestPixels(0, 0))).toBe(true);
    expect(opaque(crestPixels(6, 0)) > opaque(crestPixels(2, 0))).toBe(true);
    expect(same(crestPixels(3, 0), crestPixels(4, 0))).toBe(false);
  });
  it('draw division chevrons', () => {
    expect(opaque(crestPixels(3, 4)) > opaque(crestPixels(3, 1))).toBe(true);
    expect(opaque(crestPixels(3, 1)) > opaque(crestPixels(3, 0))).toBe(true);
  });
  it('are deterministic', () => {
    expect(same(crestPixels(5, 2), crestPixels(5, 2))).toBe(true);
  });
});

describe('stat emblems', () => {
  it('render distinct artwork per stat', () => {
    const stats = ['STR', 'INT', 'FOC', 'DIS', 'WIS'] as const;
    const imgs = stats.map((s) => emblemPixels(s, '#FFE08A'));
    for (const p of imgs) {
      expect(p).toHaveLength(64 * 64 * 4);
      expect(opaque(p) > 1500).toBe(true);
    }
    for (let i = 0; i < imgs.length; i++)
      for (let j = i + 1; j < imgs.length; j++) expect(same(imgs[i]!, imgs[j]!)).toBe(false);
  });
});

describe('chevron layer', () => {
  it('lines up exactly with the chevron drawn on the crest', () => {
    const base = crestPixels(3, 2);
    const layer = chevronPixels(3, 1); // the second chevron
    let hits = 0;
    for (let i = 3; i < layer.length; i += 4) {
      if (layer[i] === 0) continue;
      hits++;
      expect(base[i - 3]).toBe(layer[i - 3]);
      expect(base[i - 2]).toBe(layer[i - 2]);
      expect(base[i - 1]).toBe(layer[i - 1]);
    }
    expect(hits > 8).toBe(true);
    expect(opaque(crestPixels(3, 2)) > opaque(crestPixels(3, 1))).toBe(true);
  });
});

import { petPixels } from './pet';

describe('companion', () => {
  const look = (form: number, tierIndex: number, chevrons: number, kind: 'egg' | 'pet' = 'pet', apex = 0) => ({ stage: form + 2, kind, form, tierIndex, chevrons, apex });
  it('draws an egg and four body shapes', () => {
    for (const l of [look(0, 0, 1, 'egg'), look(0, 0, 3), look(1, 2, 2), look(2, 4, 1), look(3, 8, 0)]) {
      const p = petPixels(l, 'open');
      expect(p).toHaveLength(64 * 64 * 4);
      expect(opaque(p) > 300).toBe(true);
    }
  });
  it('changes shape at each form, so it never looks the same', () => {
    const forms = [0, 1, 2, 3].map((f) => petPixels(look(f, 3, 2), 'open'));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(same(forms[i]!, forms[j]!)).toBe(false);
    expect(opaque(forms[3]!) > opaque(forms[0]!)).toBe(true);
  });
  it('changes with the eyes', () => {
    const l = look(1, 2, 2);
    expect(same(petPixels(l, 'open'), petPixels(l, 'blink'))).toBe(false);
    expect(same(petPixels(l, 'open'), petPixels(l, 'sleepy'))).toBe(false);
    expect(same(petPixels(l, 'open'), petPixels(l, 'happy'))).toBe(false);
  });
  it('shows a new chevron for each division and the tier colours', () => {
    expect(same(petPixels(look(2, 3, 1), 'open'), petPixels(look(2, 3, 2), 'open'))).toBe(false);
    expect(same(petPixels(look(2, 3, 1), 'open'), petPixels(look(2, 4, 1), 'open'))).toBe(false);
  });
  it('adds sparkles with points', () => {
    expect(opaque(petPixels(look(3, 9, 0, 'pet', 6), 'open')) > opaque(petPixels(look(3, 9, 0, 'pet', 0), 'open'))).toBe(true);
  });
});
