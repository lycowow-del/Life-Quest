import { describe, expect, it } from 'vitest';
import { STAT_KEYS } from './constants';
import { addHabit, advanceDays, completeQuest, createInitialState, getLog } from './engine';
import {
  QUIZ,
  QUIZ_LENGTH,
  alternatives,
  buildRoadmap,
  createGameFromPlan,
  phaseSummary,
  scoreQuiz,
  startingStatXp,
  weakestStat,
} from './onboarding';
import { activeHabits, bossWeekStatus, upcomingUnlocks } from './selectors';
import { archetype, questXp, statLevel } from './xp';
import type { GameState } from './types';

const flat = (n: number) => ({ STR: n, INT: n, FOC: n, DIS: n, WIS: n });

describe('quiz', () => {
  it('has 15 questions, 3 per stat, 4 options each', () => {
    expect(QUIZ_LENGTH).toBe(15);
    for (const k of STAT_KEYS) expect(QUIZ.filter((x) => x.stat === k)).toHaveLength(3);
    for (const x of QUIZ) expect(x.options).toHaveLength(4);
  });
  it('scores 0 to 9 per stat', () => {
    expect(scoreQuiz(new Array(15).fill(3))).toEqual(flat(9));
    expect(scoreQuiz(new Array(15).fill(0))).toEqual(flat(0));
    expect(scoreQuiz([])).toEqual(flat(0));
    expect(scoreQuiz([3, 3, 3]).STR).toBe(9);
  });
  it('maps scores to starting stat levels 0 to 4', () => {
    const xp = startingStatXp({ STR: 9, INT: 0, FOC: 5, DIS: 3, WIS: 1 });
    expect(statLevel(xp.STR)).toBe(4);
    expect(statLevel(xp.INT)).toBe(0);
    expect(statLevel(xp.FOC)).toBe(2);
    expect(statLevel(xp.DIS)).toBe(1);
  });
  it('picks the weakest stat, ties by stat order', () => {
    expect(weakestStat({ STR: 5, INT: 2, FOC: 6, DIS: 2, WIS: 4 })).toBe('INT');
    expect(weakestStat(flat(4))).toBe('STR');
  });
});

describe('roadmap', () => {
  const scores = { STR: 6, INT: 2, FOC: 7, DIS: 4, WIS: 5 };
  it('builds the chosen number of quests with a ramp', () => {
    for (let n = 3; n <= 8; n++) {
      const r = buildRoadmap(scores, n, ['morning', 'afternoon', 'evening']);
      expect(r.habits).toHaveLength(n);
      expect(new Set(r.habits.map((h) => h.name)).size).toBe(n);
      expect(r.habits.some((h) => h.difficulty === 'easy' && h.activeFromDay === 1)).toBe(true);
      expect(r.habits.filter((h) => h.difficulty === 'hard').every((h) => h.activeFromDay === 15)).toBe(true);
      expect(r.habits.filter((h) => h.difficulty === 'medium').every((h) => h.activeFromDay === 8)).toBe(true);
    }
  });
  it('gives the weakest stat at least two quests and makes it the boss stat', () => {
    for (let n = 3; n <= 8; n++) {
      const r = buildRoadmap(scores, n, []);
      expect(r.bossStat).toBe('INT');
      expect(r.habits.filter((h) => h.stat === 'INT').length >= 2).toBe(true);
    }
  });
  it('clamps the quest count', () => {
    expect(buildRoadmap(scores, 1, []).habits).toHaveLength(3);
    expect(buildRoadmap(scores, 20, []).habits).toHaveLength(8);
  });
  it('respects preferred times of day', () => {
    const r = buildRoadmap(scores, 8, ['evening']);
    expect(r.habits.every((h) => h.timeOfDay === 'evening')).toBe(true);
  });
  it('summarises unlock phases and offers alternatives', () => {
    const r = buildRoadmap(scores, 5, []);
    expect(phaseSummary(r.habits)).toEqual([{ day: 1, count: 2 }, { day: 8, count: 2 }, { day: 15, count: 1 }]);
    expect(alternatives('STR', 'easy')).toHaveLength(3);
  });
});

describe('createGameFromPlan', () => {
  const scores = { STR: 6, INT: 2, FOC: 7, DIS: 4, WIS: 5 };
  it('starts at Iron with quiz stat levels and only day-1 quests unlocked', () => {
    const r = buildRoadmap(scores, 5, []);
    const s = createGameFromPlan({ name: 'Ada', scores, bossStat: r.bossStat, habits: r.habits });
    expect(s.profile.totalXp).toBe(0);
    expect(s.profile.name).toBe('Ada');
    expect(s.profile.bossStat).toBe('INT');
    expect(archetype(s.profile.statXp) === 'Novice').toBe(false);
    expect(activeHabits(s)).toHaveLength(2);
    expect(upcomingUnlocks(s)).toEqual([{ day: 8, count: 2 }, { day: 15, count: 1 }]);
  });
  it('shifts the plan so something is unlocked on day 1', () => {
    const habits = [{ name: 'Only hard', stat: 'STR' as const, difficulty: 'hard' as const, timeOfDay: 'morning' as const, activeFromDay: 15 }];
    const s = createGameFromPlan({ name: 'x', scores, bossStat: null, habits });
    expect(activeHabits(s)).toHaveLength(1);
  });
  it('unlocks quests on their day and blocks locked ones', () => {
    const r = buildRoadmap(scores, 5, []);
    let s = createGameFromPlan({ name: 'x', scores, bossStat: r.bossStat, habits: r.habits });
    const locked = s.habits.find((h) => h.createdOnDay === 8)!;
    expect(completeQuest(s, locked.id).ok).toBe(false);
    s = advanceDays(s, 7);
    expect(activeHabits(s)).toHaveLength(4);
    expect(completeQuest(s, locked.id).ok).toBe(true);
  });
});

describe('boss week', () => {
  const setup = (): GameState => {
    let s = createInitialState();
    s = addHabit(s, { name: 'Boss quest', stat: 'INT', difficulty: 'easy', timeOfDay: 'morning' }); // h1
    s = addHabit(s, { name: 'Other quest', stat: 'STR', difficulty: 'easy', timeOfDay: 'morning' }); // h2
    return { ...s, profile: { ...s.profile, bossStat: 'INT' } };
  };
  /** Plays days 1..last, completing the boss quest unless the day is in `skip`. */
  const play = (last: number, skip: number[] = []) => {
    let s = setup();
    for (let d = 1; d <= last; d++) {
      if (!skip.includes(d)) s = completeQuest(s, 'h1').state;
      if (d < last) s = advanceDays(s, 1);
    }
    return s;
  };

  it('doubles XP for the boss stat only on days 15 to 21', () => {
    const s14 = play(14);
    expect(getLog(s14, 14).completions[0]!.boss).toBe(false);
    const s15 = play(15);
    const c = getLog(s15, 15).completions[0]!;
    expect(c.boss).toBe(true);
    expect(c.xp).toBe(questXp('easy', 15, false, 2));
    expect(c.xp).toBe(28);
    const off = completeQuest(s15, 'h2'); // a non-boss quest on the same day
    expect(getLog(off.state, 15).completions[1]!.boss).toBe(false);
  });
  it('reports boss week status', () => {
    expect(bossWeekStatus(play(1)).startsIn).toBe(14);
    const s = play(15);
    expect(bossWeekStatus(s).active).toBe(true);
    expect(bossWeekStatus(s).daysLeft).toBe(7);
    expect(bossWeekStatus(advanceDays(play(21), 1)).active).toBe(false);
  });
  it('pays the chest once after a perfect boss week', () => {
    const s21 = play(21);
    const before = s21.profile.totalXp;
    const after = advanceDays(s21, 1);
    expect(after.profile.totalXp - before).toBe(250);
    expect(after.profile.bossChestClaimedCycle).toBe(1);
    expect(getLog(after, 21).chest).toBe(250);
    expect(bossWeekStatus(after).chestClaimed).toBe(true);
  });
  it('pays nothing if a boss-week day was missed', () => {
    const s21 = play(21, [17]);
    const after = advanceDays(s21, 1);
    expect(after.profile.totalXp).toBe(s21.profile.totalXp);
    expect(after.profile.bossChestClaimedCycle).toBe(0);
  });
});
