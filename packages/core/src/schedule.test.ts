import { describe, expect, it } from 'vitest';
import { addHabit, advanceDays, completeQuest, createInitialState, getLog } from './engine';
import { applyRetake, buildRoadmap } from './onboarding';
import { activeHabits, penaltyAtRisk } from './selectors';
import { describeSchedule, dueNote, isDueOn, upcomingRoutine, visibleOn, weekdayOfDay } from './schedule';
import { exportSave, parseSave } from './serialize';
import { weekdayOfKey } from './dates';
import type { GameState, Mode } from './types';

// Day 1 is a Monday (weekday 1). h1: daily easy. h2: medium quest due every 3 days (days 1, 4, 7...).
const game = (mode: Mode = 'standard'): GameState => {
  let s = createInitialState({ mode, startWeekday: 1 });
  s = addHabit(s, { name: 'Stretch', stat: 'STR', difficulty: 'easy', timeOfDay: 'morning' });
  s = addHabit(s, { name: 'Cold shower', stat: 'DIS', difficulty: 'medium', timeOfDay: 'morning', schedule: { kind: 'every', n: 3 } });
  return s;
};
const ids = (s: GameState, day: number): string[] => visibleOn(s, day).map((h) => h.id);

describe('schedules', () => {
  it('finds due days for every-N and weekday quests', () => {
    const s = game();
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => isDueOn(s.habits[1]!, d, 1))).toEqual([true, false, false, true, false, false, true]);
    const w = addHabit(createInitialState({ startWeekday: 1 }), { name: 'Gym', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning', schedule: { kind: 'weekdays', days: [1, 3, 5] } });
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((d) => isDueOn(w.habits[0]!, d, 1))).toEqual([true, false, true, false, true, false, false, true]);
  });
  it('maps game days to weekdays', () => {
    expect(weekdayOfDay(1, 1)).toBe(1);
    expect(weekdayOfDay(1, 7)).toBe(0);
    expect(weekdayOfDay(6, 3)).toBe(1);
    expect(weekdayOfKey('2026-10-19')).toBe(1);
  });
  it('shows a routine quest only when due, and blocks it otherwise', () => {
    const s = completeQuest(game(), 'h2').state; // done on its due day
    expect(ids(s, 1)).toEqual(['h1', 'h2']);
    expect(ids(s, 2)).toEqual(['h1']);
    const s2 = advanceDays(s, 1);
    expect(completeQuest(s2, 'h2').reason).toBe('not_due');
    expect(activeHabits(s2)).toHaveLength(1);
  });
  it('keeps a missed quest open for one extra day', () => {
    let s = game();
    s = advanceDays(s, 3); // now day 4, h2 due
    expect(ids(s, 4)).toEqual(['h1', 'h2']);
    s = advanceDays(s, 1); // day 5: grace
    expect(ids(s, 5)).toEqual(['h1', 'h2']);
    expect(dueNote(s, s.habits[1]!)).toBe('Due yesterday: last chance today');
    expect(completeQuest(s, 'h2').ok).toBe(true); // rescued
    expect(ids(advanceDays(s, 1), 6)).toEqual(['h1']);
    expect(ids(advanceDays(completeQuest(s, 'h2').state, 1), 6)).toEqual(['h1']);
  });
  it('closes the grace day on day 6 if still not done', () => {
    let s = advanceDays(game(), 5); // day 6
    expect(ids(s, 6)).toEqual(['h1']);
    s = advanceDays(s, 1);
    expect(ids(s, 7)).toEqual(['h1', 'h2']); // next planned due day
  });
});

describe('missed quests in Hard Mode', () => {
  const play = (): GameState => {
    let s = game('hard');
    for (let d = 1; d <= 5; d++) {
      s = completeQuest(s, 'h1').state; // daily quest done every day
      if (d === 1) s = completeQuest(s, 'h2').state; // routine quest done only on day 1
      s = advanceDays(s, 1);
    }
    return s;
  };
  it('does not penalise the due day, only after the grace day', () => {
    const s = play();
    expect(getLog(s, 4).penalty).toBe(0); // due, still open tomorrow
    expect(getLog(s, 5).penalty).toBe(13); // grace day ended undone: half of 25, rounded
  });
  it('previews the penalty correctly', () => {
    let s = game('hard');
    s = completeQuest(s, 'h1').state;
    s = completeQuest(s, 'h2').state;
    s = advanceDays(s, 3); // day 4, h2 due, h1 not done
    expect(penaltyAtRisk(s)).toBe(5); // only the daily quest; h2 has a grace day left
    s = advanceDays(completeQuest(s, 'h1').state, 1); // day 5, h2 in grace, h1 not done
    expect(penaltyAtRisk(s)).toBe(18); // 5 + 13
  });
  it('gives no grace when the next day is also due', () => {
    let s = createInitialState({ mode: 'hard', startWeekday: 1 });
    s = addHabit(s, { name: 'Daily', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning' });
    s = addHabit(s, { name: 'Mon Tue', stat: 'INT', difficulty: 'medium', timeOfDay: 'morning', schedule: { kind: 'weekdays', days: [1, 2] } });
    s = completeQuest(s, 'h1').state; // earn some XP
    const after = advanceDays(s, 1); // Monday ends with the Mon/Tue quest undone
    expect(getLog(after, 1).penalty).toBe(13);
  });
});

describe('rest days', () => {
  it('keep the streak and do not count as missed', () => {
    let s = createInitialState({ startWeekday: 1 });
    s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning', schedule: { kind: 'every', n: 3 } });
    s = advanceDays(completeQuest(s, 'h1').state, 1); // day 1 done
    expect(s.profile.streak).toBe(1);
    s = advanceDays(s, 2); // days 2 and 3 are rest days
    expect(getLog(s, 2).rest).toBe(true);
    expect(getLog(s, 3).rest).toBe(true);
    expect(s.profile.streak).toBe(1);
    expect(s.profile.consecutiveMissedDays).toBe(0);
    s = completeQuest(s, 'h1').state; // day 4, due again
    expect(s.profile.streak).toBe(2);
  });
  it('still reset the streak on a normal missed day', () => {
    const s = advanceDays(completeQuest(game(), 'h1').state, 2); // day 2 missed daily quest
    expect(s.profile.streak).toBe(0);
  });
  it('does not make a game with no quests a rest day', () => {
    expect(getLog(advanceDays(createInitialState(), 1), 1).rest).toBeUndefined();
  });
});

describe('boss week with routine quests', () => {
  const run = (skip: number[]): GameState => {
    let s = createInitialState({ startWeekday: 1 });
    s = addHabit(s, { name: 'Study', stat: 'INT', difficulty: 'easy', timeOfDay: 'morning', schedule: { kind: 'every', n: 2 } });
    s = { ...s, profile: { ...s.profile, bossStat: 'INT' } };
    for (let d = 1; d <= 21; d++) {
      if (d % 2 === 1 && !skip.includes(d)) s = completeQuest(s, 'h1').state;
      if (d < 21) s = advanceDays(s, 1);
    }
    return s;
  };
  it('pays the chest when every due boss quest was done', () => {
    const s = run([]);
    expect(advanceDays(s, 1).profile.totalXp - s.profile.totalXp).toBe(250);
  });
  it('pays nothing if a due boss quest was missed', () => {
    const s = run([17]);
    expect(advanceDays(s, 1).profile.totalXp - s.profile.totalXp).toBe(0);
  });
});

describe('labels, upcoming and saving', () => {
  it('describes schedules', () => {
    expect(describeSchedule({ kind: 'every', n: 3, anchor: 1 })).toBe('Every 3 days');
    expect(describeSchedule({ kind: 'weekdays', days: [1, 3, 5] })).toBe('Mon · Wed · Fri');
  });
  it('lists routine quests that are not due today', () => {
    const s = advanceDays(completeQuest(game(), 'h2').state, 1);
    expect(upcomingRoutine(s).map((u) => [u.habit.name, u.inDays])).toEqual([['Cold shower', 2]]);
  });
  it('survives save and load and rejects bad schedules', () => {
    const s = advanceDays(completeQuest(game(), 'h2').state, 2);
    const parsed = parseSave(exportSave(s, '2026-10-19'));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.save.state).toEqual(s);
    const o = JSON.parse(exportSave(s, '2026-10-19'));
    o.state.habits[1].schedule = { kind: 'every', n: 1, anchor: 1 };
    expect(parseSave(JSON.stringify(o)).ok).toBe(false);
  });
});

describe('quiz retake', () => {
  const scores = { STR: 9, INT: 1, FOC: 5, DIS: 5, WIS: 5 };
  it('only raises stat levels, keeps XP and re-picks the boss stat', () => {
    let s = game();
    s = { ...s, profile: { ...s.profile, totalXp: 500, statXp: { STR: 80, INT: 600, FOC: 0, DIS: 0, WIS: 0 } } };
    const r = applyRetake(s, { scores, bossStat: 'INT', habits: [], replaceQuests: false });
    expect(r.profile.totalXp).toBe(500);
    expect(r.profile.statXp.STR).toBe(320); // raised from 80 to level 4
    expect(r.profile.statXp.INT).toBe(600); // earned XP kept
    expect(r.profile.bossStat).toBe('INT');
    expect(r.habits).toHaveLength(2);
  });
  it('can replace quests, starting the ramp today', () => {
    let s = advanceDays(game(), 9); // day 10
    const plan = buildRoadmap(scores, 4, []);
    s = applyRetake(s, { scores, bossStat: plan.bossStat, habits: plan.habits, replaceQuests: true });
    expect(s.habits.filter((h) => h.archived)).toHaveLength(2);
    const fresh = s.habits.filter((h) => !h.archived);
    expect(fresh).toHaveLength(4);
    expect(Math.min(...fresh.map((h) => h.createdOnDay))).toBe(10);
    expect(Math.max(...fresh.map((h) => h.createdOnDay))).toBe(24); // hard quests: 14 days after the first
    expect(activeHabits(s).length > 0).toBe(true);
  });
});
