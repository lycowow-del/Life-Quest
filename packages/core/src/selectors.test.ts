import { describe, expect, it } from 'vitest';
import { addHabit, archiveHabit, completeQuest, createInitialState, setMode } from './engine';
import { STAT_KEYS } from './constants';
import {
  activeHabits,
  completedToday,
  groupByTimeOfDay,
  penaltyAtRisk,
  rankProgress,
  statSummary,
  todayProgress,
} from './selectors';
import { STARTER_HABITS } from './starters';
import { endDay } from './engine';

const game = (mode: 'standard' | 'hard' = 'standard') => {
  let s = createInitialState({ mode });
  s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning' });
  s = addHabit(s, { name: 'Read', stat: 'INT', difficulty: 'medium', timeOfDay: 'afternoon' });
  s = addHabit(s, { name: 'Journal', stat: 'WIS', difficulty: 'easy', timeOfDay: 'evening' });
  return s;
};

describe('selectors', () => {
  it('groups habits by time of day', () => {
    const g = groupByTimeOfDay(activeHabits(game()));
    expect(g.morning).toHaveLength(1);
    expect(g.afternoon).toHaveLength(1);
    expect(g.evening).toHaveLength(1);
  });
  it('hides archived habits', () => {
    expect(activeHabits(archiveHabit(game(), 'h2'))).toHaveLength(2);
  });
  it('tracks today progress', () => {
    const s = completeQuest(game(), 'h1').state;
    expect(completedToday(s).has('h1')).toBe(true);
    expect(todayProgress(s)).toEqual({ done: 1, total: 3 });
  });
  it('summarises stat levels and progress', () => {
    const s = completeQuest(game(), 'h1').state; // 51 STR XP
    const str = statSummary(s).find((x) => x.key === 'STR')!;
    expect(str.level).toBe(1);
    expect(Math.round(str.ratio * 1000)).toBe(517);
    expect(statSummary(s)).toHaveLength(5);
  });
  it('reports rank progress', () => {
    expect(rankProgress(250)).toEqual({ rank: 'E', next: 'D', ratio: 0.5, xpToNext: 250 });
    expect(rankProgress(12000)).toEqual({ rank: 'S', next: null, ratio: 1, xpToNext: 0 });
  });
  it('previews the Hard Mode penalty and matches endDay', () => {
    expect(penaltyAtRisk(completeQuest(game(), 'h1').state)).toBe(0); // standard mode
    const s = completeQuest(game('hard'), 'h1').state; // 51 XP earned
    expect(penaltyAtRisk(s)).toBe(18); // Read 13 + Journal 5
    expect(51 - endDay(s).profile.totalXp).toBe(penaltyAtRisk(s));
    expect(penaltyAtRisk(setMode(game('hard'), 'hard'))).toBe(0); // nothing to lose at 0 XP
  });
  it('ships valid starter quests', () => {
    expect(STARTER_HABITS).toHaveLength(8);
    for (const h of STARTER_HABITS) expect(STAT_KEYS.includes(h.stat)).toBe(true);
  });
});
