import { describe, expect, it } from 'vitest';
import { addHabit, completeQuest, createInitialState, cycleDay } from './engine';
import { syncToDate } from './sync';

const start = () =>
  addHabit(createInitialState(), { name: 'Stretch', stat: 'DIS', difficulty: 'easy', timeOfDay: 'morning' });

describe('syncToDate', () => {
  it('returns the same object on the same day', () => {
    const s = start();
    expect(syncToDate(s, '2026-10-20', '2026-10-20')).toBe(s);
  });
  it('ignores a clock that moved backwards', () => {
    const s = start();
    expect(syncToDate(s, '2026-10-20', '2026-10-10')).toBe(s);
  });
  it('closes each elapsed day, resetting the streak after a missed one', () => {
    const done = completeQuest(start(), 'h1').state; // day 1 completed
    const s = syncToDate(done, '2026-10-20', '2026-10-23'); // now day 4
    expect(s.profile.dayNumber).toBe(4);
    expect(s.profile.streak).toBe(0);
    expect(s.profile.bestStreak).toBe(1);
    expect(cycleDay(s.profile)).toBe(4);
  });
  it('keeps the streak when every day was completed before syncing', () => {
    let s = completeQuest(start(), 'h1').state;
    s = syncToDate(s, '2026-10-20', '2026-10-21');
    expect(s.profile.streak).toBe(1);
    expect(s.profile.dayNumber).toBe(2);
  });
});
