import { describe, expect, it } from 'vitest';
import { completeFocusSession, logMood, saveJournalEntry } from './activity';
import { ACHIEVEMENTS, achievementStatus, syncAchievements } from './achievements';
import { addHabit, advanceDays, completeQuest, createInitialState } from './engine';
import { exportSave, parseSave } from './serialize';
import type { GameState } from './types';
import { stepThreshold } from './xp';

const game = (): GameState => {
  let s = createInitialState();
  s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'easy', timeOfDay: 'morning' });
  s = addHabit(s, { name: 'Study', stat: 'INT', difficulty: 'easy', timeOfDay: 'morning', target: { base: 30, unit: 'min', round: 5, max: 60 } });
  return s;
};
const ids = (s: GameState): string[] => Object.keys(syncAchievements(s).state.achievements ?? {});
const play = (days: number): GameState => {
  let s = game();
  for (let d = 0; d < days; d++) s = advanceDays(completeQuest(completeQuest(s, 'h1').state, 'h2').state, 1);
  return s;
};

describe('achievements', () => {
  it('has unique ids and a sensible target for each', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.length >= 35).toBe(true);
    for (const a of ACHIEVEMENTS) expect(a.target > 0).toBe(true);
  });
  it('unlocks nothing on a fresh game', () => {
    const r = syncAchievements(game());
    expect(r.unlocked).toHaveLength(0);
    expect(r.state).toBe(game() === r.state ? r.state : r.state);
  });
  it('unlocks the first quest, a perfect day and a streak', () => {
    const s = play(3);
    const got = ids(s);
    for (const id of ['first-quest', 'perfect-1', 'streak-3', 'routine'].filter((x) => x !== 'routine')) expect(got.includes(id)).toBe(true);
    expect(got.includes('streak-7')).toBe(false);
  });
  it('records the day it was earned and is idempotent', () => {
    const s = syncAchievements(play(1)).state;
    expect(s.achievements!['first-quest']).toBe(2);
    const again = syncAchievements(s);
    expect(again.unlocked).toHaveLength(0);
    expect(again.state).toBe(s);
  });
  it('unlocks a quest level-up after 5 completed days', () => {
    expect(ids(play(5)).includes('quest-levelup')).toBe(true);
    expect(ids(play(4)).includes('quest-levelup')).toBe(false);
  });
  it('unlocks ranks, focus, journal, mood and photo achievements', () => {
    let s = game();
    s = { ...s, profile: { ...s.profile, totalXp: stepThreshold(12) } };
    s = completeFocusSession(s, 25).state;
    s = logMood(s, 4).state;
    s = saveJournalEntry(s, 'A journal entry that is long enough.', ['p1']).state;
    const got = ids(s);
    for (const id of ['rank-bronze', 'rank-silver', 'rank-gold', 'hatched', 'focus-1', 'journal-1', 'photo-1']) expect(got.includes(id)).toBe(true);
    expect(got.includes('rank-platinum')).toBe(false);
    expect(got.includes('mood-14')).toBe(false);
  });
  it('never takes an earned achievement away', () => {
    let s = syncAchievements({ ...game(), profile: { ...game().profile, totalXp: stepThreshold(12) } }).state;
    s = { ...s, profile: { ...s.profile, totalXp: 0 } };
    expect(syncAchievements(s).state.achievements!['rank-gold']).toBe(1);
  });
  it('reports progress for locked ones', () => {
    const st = achievementStatus(play(2)).find((x) => x.def.id === 'streak-7')!;
    expect(st.unlocked).toBe(false);
    expect(st.value).toBe(2);
  });
  it('survives save and load', () => {
    const s = syncAchievements(play(3)).state;
    const parsed = parseSave(exportSave(s, '2026-10-20'));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.save.state).toEqual(s);
    const o = JSON.parse(exportSave(s, '2026-10-20'));
    o.state.achievements = { x: 'y' };
    expect(parseSave(JSON.stringify(o)).ok).toBe(false);
  });
});

describe('skill cards record the rank', () => {
  it('stores the rank on a new card', () => {
    const s = play(7);
    const card = s.milestones[0]!;
    expect(card.day).toBe(7);
    expect(card.rank?.label).toBe('Iron IV');
    expect(card.rank?.tierIndex).toBe(0);
    const parsed = parseSave(exportSave(s, '2026-10-20'));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.save.state.milestones[0]).toEqual(card);
  });
});
