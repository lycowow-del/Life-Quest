import { describe, expect, it } from 'vitest';
import { logMood, saveJournalEntry } from './activity';
import { advanceDays, createInitialState } from './engine';
import { libraryCounts, libraryEntries, moodAverage, moodStrip } from './library';
import type { GameState } from './types';

// Day 1: mood 4 + written entry. Day 2: photo only. Day 3: mood only. Day 4 (today): nothing.
const game = (): GameState => {
  let s = createInitialState();
  s = saveJournalEntry(logMood(s, 4).state, 'Went for a long run and felt great.', []).state;
  s = advanceDays(s, 1);
  s = saveJournalEntry(s, '', ['p1']).state;
  s = advanceDays(s, 1);
  s = logMood(s, 2).state;
  return advanceDays(s, 1);
};

describe('library', () => {
  it('lists entries newest first with calendar dates', () => {
    const e = libraryEntries(game(), '2026-10-20');
    expect(e.map((x) => [x.day, x.dateKey])).toEqual([[3, '2026-10-22'], [2, '2026-10-21'], [1, '2026-10-20']]);
    expect(e[2]!.mood).toBe(4);
    expect(e[1]!.photoIds).toEqual(['p1']);
  });
  it('filters and searches', () => {
    const s = game();
    expect(libraryEntries(s, '2026-10-20', { filter: 'written' }).map((x) => x.day)).toEqual([1]);
    expect(libraryEntries(s, '2026-10-20', { filter: 'photos' }).map((x) => x.day)).toEqual([2]);
    expect(libraryEntries(s, '2026-10-20', { query: 'RUN' }).map((x) => x.day)).toEqual([1]);
    expect(libraryEntries(s, '2026-10-20', { query: 'zebra' })).toHaveLength(0);
  });
  it('builds a mood strip and average', () => {
    const strip = moodStrip(game(), 5);
    expect(strip).toEqual([null, 4, null, 2, null]);
    expect(moodAverage(strip)).toBe(3);
    expect(moodAverage([null, null])).toBeNull();
  });
  it('counts entries', () => {
    expect(libraryCounts(game())).toEqual({ entries: 3, written: 1, photos: 1, moods: 2 });
  });
});
