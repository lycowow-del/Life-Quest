import { describe, expect, it } from 'vitest';
import { addHabit, advanceDays, completeQuest, createInitialState, getLog, setMode } from './engine';
import { hardModeStatus, yesterdayReport } from './hardmode';
import { exportSave, parseSave } from './serialize';
import type { GameState, Mode } from './types';

// h1 hard (50 XP), h2 medium (25 XP), h3 easy (10 XP). Missing them costs 25, 13 and 5.
const game = (mode: Mode = 'hard'): GameState => {
  let s = createInitialState({ mode });
  s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning' });
  s = addHabit(s, { name: 'Read', stat: 'INT', difficulty: 'medium', timeOfDay: 'afternoon' });
  s = addHabit(s, { name: 'Journal', stat: 'WIS', difficulty: 'easy', timeOfDay: 'evening' });
  return s;
};

describe('turning Hard Mode off', () => {
  it('takes effect after today, so a penalty cannot be dodged', () => {
    let s = completeQuest(game(), 'h1').state; // 51 XP
    s = setMode(s, 'standard');
    expect(s.profile.mode).toBe('hard');
    expect(s.profile.pendingMode).toBe('standard');
    expect(hardModeStatus(s).endsTonight).toBe(true);
    const after = advanceDays(s, 1);
    expect(getLog(after, 1).penalty).toBe(18); // Read 13 + Journal 5 still cost XP
    expect(after.profile.mode).toBe('standard');
    expect(after.profile.pendingMode).toBeUndefined();
    expect(getLog(advanceDays(after, 1), 2).penalty).toBe(0); // standard from now on
  });
  it('can be cancelled before the day closes', () => {
    let s = setMode(game(), 'standard');
    s = setMode(s, 'hard');
    expect(s.profile.mode).toBe('hard');
    expect(s.profile.pendingMode).toBeUndefined();
  });
  it('turning it on is immediate', () => {
    const s = setMode(game('standard'), 'hard');
    expect(s.profile.mode).toBe('hard');
    expect(s.profile.pendingMode).toBeUndefined();
  });
});

describe('hardModeStatus', () => {
  it('lists what would cost XP and the total', () => {
    let s = completeQuest(game(), 'h1').state; // 51 XP earned
    const st = hardModeStatus(s);
    expect(st.active).toBe(true);
    expect(st.atRisk.map((a) => [a.habit.name, a.xp])).toEqual([['Read', 13], ['Journal', 5]]);
    expect(st.totalAtRisk).toBe(18);
    s = completeQuest(s, 'h2').state;
    expect(hardModeStatus(s).atRisk.map((a) => a.habit.name)).toEqual(['Journal']);
  });
  it('never claims more XP than you have', () => {
    expect(hardModeStatus(game()).totalAtRisk).toBe(0);
    expect(hardModeStatus(game()).atRisk).toHaveLength(3);
  });
  it('warns before the 3-empty-day restart', () => {
    let s = game();
    s = advanceDays(s, 2); // two empty days
    let st = hardModeStatus(s);
    expect(st.emptyInARow).toBe(2);
    expect(st.restartTonight).toBe(true);
    s = completeQuest(s, 'h3').state;
    st = hardModeStatus(s);
    expect(st.restartTonight).toBe(false);
  });
  it('warns when a stat is close to losing a level', () => {
    let s = game();
    s = { ...s, profile: { ...s.profile, statXp: { STR: 500, INT: 0, FOC: 0, DIS: 0, WIS: 0 }, dayNumber: 4, cycleStartDay: 1 } };
    expect(hardModeStatus(s).decay).toEqual([{ stat: 'STR', level: 5, idleDays: 3, daysLeft: 2 }]); // first warning
    s = { ...s, profile: { ...s.profile, dayNumber: 3 } };
    expect(hardModeStatus(s).decay).toEqual([]); // 2 idle days: no warning yet
    s = { ...s, profile: { ...s.profile, dayNumber: 4 } };
    s = { ...s, profile: { ...s.profile, dayNumber: 5 } };
    expect(hardModeStatus(s).decay).toEqual([{ stat: 'STR', level: 5, idleDays: 4, daysLeft: 1 }]);
    s = { ...s, profile: { ...s.profile, dayNumber: 6 } };
    expect(hardModeStatus(s).decay[0]!.daysLeft).toBe(0); // loses a level tonight
  });
});

describe('yesterday report and day logs', () => {
  it('reports what a Hard Mode day took', () => {
    const s = advanceDays(completeQuest(game(), 'h1').state, 1);
    const r = yesterdayReport(s);
    expect(r?.lost).toBe(18);
    expect(r?.missed).toEqual(['Read', 'Journal']);
    expect(r?.restarted).toBe(false);
    expect(getLog(s, 1).missed).toEqual(['h2', 'h3']);
  });
  it('reports a cycle restart', () => {
    const s = advanceDays(game(), 3);
    expect(getLog(s, 3).restart).toBe(true);
    expect(yesterdayReport(s)?.restarted).toBe(true);
    expect(s.profile.cycle).toBe(2);
  });
  it('is empty in standard mode and on a clean day', () => {
    expect(yesterdayReport(advanceDays(game('standard'), 1))).toBeNull();
    let s = game();
    for (const id of ['h1', 'h2', 'h3']) s = completeQuest(s, id).state;
    expect(yesterdayReport(advanceDays(s, 1))).toBeNull();
  });
  it('survives save and load, and rejects bad values', () => {
    const s = setMode(advanceDays(completeQuest(game(), 'h1').state, 1), 'standard');
    const parsed = parseSave(exportSave(s, '2026-10-19'));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.save.state).toEqual(s);
    const o = JSON.parse(exportSave(s, '2026-10-19'));
    o.state.profile.pendingMode = 'extreme';
    expect(parseSave(JSON.stringify(o)).ok).toBe(false);
    const o2 = JSON.parse(exportSave(s, '2026-10-19'));
    o2.state.logs['1'].missed = [1, 2];
    expect(parseSave(JSON.stringify(o2)).ok).toBe(false);
  });
});
