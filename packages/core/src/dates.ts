/** Local calendar date as YYYY-MM-DD (the player's own midnight decides when a day ends). */
const pad = (n: number): string => String(n).padStart(2, '0');
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toUtc = (key: string): number => Date.parse(`${key}T00:00:00Z`);

export const isDateKey = (s: unknown): s is string =>
  typeof s === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(toUtc(s)) &&
  new Date(toUtc(s)).toISOString().slice(0, 10) === s;

export const daysBetween = (fromKey: string, toKey: string): number =>
  Math.round((toUtc(toKey) - toUtc(fromKey)) / 86_400_000);

export const addDaysToKey = (key: string, n: number): string =>
  new Date(toUtc(key) + n * 86_400_000).toISOString().slice(0, 10);

/** Day 1 is the date the game started. */
export const dayNumberForDate = (startDateKey: string, todayKey: string): number =>
  1 + daysBetween(startDateKey, todayKey);
