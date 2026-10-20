export const OUTLINE = '#1a1230';

export interface TierColors {
  name: string;
  base: string;
  light: string;
  dark: string;
  gem: string;
}

export const TIER_COLORS: readonly TierColors[] = [
  { name: 'Iron', base: '#7b7b86', light: '#b9b9c4', dark: '#43434d', gem: '#d6c8b8' },
  { name: 'Bronze', base: '#b8743c', light: '#eaa866', dark: '#6f3f1e', gem: '#ffd2a0' },
  { name: 'Silver', base: '#a9b4c8', light: '#eaf0fa', dark: '#5d6a82', gem: '#cfe4ff' },
  { name: 'Gold', base: '#e3b232', light: '#fdea8a', dark: '#8b6411', gem: '#fff3b0' },
  { name: 'Platinum', base: '#46b5ad', light: '#a4f1e8', dark: '#1f6b67', gem: '#d4fff8' },
  { name: 'Emerald', base: '#2fbf71', light: '#93f2b5', dark: '#146a3c', gem: '#d8ffe6' },
  { name: 'Diamond', base: '#5a8cff', light: '#bad2ff', dark: '#2b3f9e', gem: '#e3f0ff' },
  { name: 'Master', base: '#b05cf0', light: '#e3b8ff', dark: '#5b2b8c', gem: '#ffd6ff' },
  { name: 'Grandmaster', base: '#e5534b', light: '#ffa299', dark: '#7c2220', gem: '#ffe0d8' },
  { name: 'Challenger', base: '#3fc5f0', light: '#f4d35e', dark: '#2a6f9e', gem: '#fff7cc' },
];

export const hexToRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

export function mix(from: string, to: string, f: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return (
    '#' +
    a
      .map((v, i) => Math.round(v + (b[i]! - v) * f).toString(16).padStart(2, '0'))
      .join('')
  );
}
