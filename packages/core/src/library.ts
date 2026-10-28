import { addDaysToKey } from './dates';
import type { GameState, Mood } from './types';

export interface LibraryEntry {
  day: number;
  /** Calendar date, YYYY-MM-DD. */
  dateKey: string;
  mood?: Mood;
  text?: string;
  photoIds: string[];
}

export type LibraryFilter = 'all' | 'written' | 'photos';

/** Every day with a mood, a journal entry or a photo, newest first, optionally filtered and searched. */
export function libraryEntries(
  s: GameState,
  startDateKey: string,
  opts: { filter?: LibraryFilter; query?: string } = {},
): LibraryEntry[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  return Object.values(s.journal ?? {})
    .map((e): LibraryEntry => ({
      day: e.day,
      dateKey: addDaysToKey(startDateKey, e.day - 1),
      ...(e.mood !== undefined ? { mood: e.mood } : {}),
      ...(e.text && e.text.trim() ? { text: e.text } : {}),
      photoIds: e.photoIds ?? [],
    }))
    .filter((e) => e.mood !== undefined || e.text !== undefined || e.photoIds.length > 0)
    .filter((e) => (opts.filter === 'written' ? e.text !== undefined : opts.filter === 'photos' ? e.photoIds.length > 0 : true))
    .filter((e) => !q || (e.text ?? '').toLowerCase().includes(q))
    .sort((a, b) => b.day - a.day);
}

/** Mood for each of the last `days` days, oldest first, ending today. Null where none was logged. */
export function moodStrip(s: GameState, days = 30): (Mood | null)[] {
  const out: (Mood | null)[] = [];
  for (let d = s.profile.dayNumber - days + 1; d <= s.profile.dayNumber; d++) out.push(d >= 1 ? (s.journal?.[d]?.mood ?? null) : null);
  return out;
}

export function moodAverage(strip: readonly (Mood | null)[]): number | null {
  const m = strip.filter((x): x is Mood => x !== null);
  return m.length ? m.reduce((t, x) => t + x, 0) / m.length : null;
}

export function libraryCounts(s: GameState): { entries: number; written: number; photos: number; moods: number } {
  const all = Object.values(s.journal ?? {});
  return {
    entries: all.filter((e) => e.mood !== undefined || (e.text && e.text.trim()) || e.photoIds?.length).length,
    written: all.filter((e) => e.text && e.text.trim()).length,
    photos: all.reduce((t, e) => t + (e.photoIds?.length ?? 0), 0),
    moods: all.filter((e) => e.mood !== undefined).length,
  };
}
