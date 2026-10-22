import { describe, expect, it } from 'vitest';
import { addHabit, advanceDays, completeQuest, createInitialState } from './engine';
import { QUEST_LIBRARY } from './onboarding';
import {
  amountAtLevel,
  customTarget,
  daysToNextLevel,
  formatAmount,
  maxLevelFor,
  questLabel,
  setProgressionFrozen,
  targetAmount,
  targetLevel,
  targetScale,
} from './progression';
import { exportSave, parseSave } from './serialize';
import type { GameState, QuestTarget } from './types';
import { questXp } from './xp';

const t = (over: Partial<QuestTarget> = {}): QuestTarget => ({ base: 60, unit: 'min', round: 5, completions: 0, ...over });

describe('target levels', () => {
  it('grows 25% a level and rounds to tidy numbers', () => {
    expect([0, 1, 2, 3].map((l) => amountAtLevel(t(), l))).toEqual([60, 75, 95, 115]);
    expect([0, 1, 2, 3].map((l) => amountAtLevel({ base: 8000, unit: 'steps', round: 500 }, l))).toEqual([8000, 10000, 12500, 15500]);
  });
  it('levels up every 5 completed days and stops at the cap', () => {
    expect(targetLevel(t({ completions: 4 }))).toBe(0);
    expect(targetLevel(t({ completions: 5 }))).toBe(1);
    expect(targetLevel(t({ completions: 14 }))).toBe(2);
    expect(targetLevel(t({ completions: 500 }))).toBe(3);
    expect(targetAmount(t({ completions: 5 }))).toBe(75);
    expect(targetScale(t({ completions: 5 }))).toBe(1.25);
  });
  it('respects a per-quest maximum', () => {
    expect(maxLevelFor({ base: 90, unit: 'min', round: 5, max: 120 })).toBe(1);
    expect(targetAmount({ base: 90, unit: 'min', round: 5, max: 120, completions: 500 })).toBe(115);
  });
  it('reports days to the next level', () => {
    expect(daysToNextLevel(t({ completions: 3 }))).toBe(2);
    expect(daysToNextLevel(t({ completions: 500 }))).toBeNull();
    expect(daysToNextLevel(t({ completions: 3, frozen: true }))).toBeNull();
  });
});

describe('labels', () => {
  it('formats amounts', () => {
    expect(formatAmount(75, 'min')).toBe('1 h 15 min');
    expect(formatAmount(120, 'min')).toBe('2 h');
    expect(formatAmount(45, 'min')).toBe('45 min');
    expect(formatAmount(10000, 'steps')).toBe('10,000 steps');
    expect(formatAmount(1, 'pages')).toBe('1 page');
    expect(formatAmount(20, 'pages')).toBe('20 pages');
  });
  it('builds custom targets', () => {
    expect(customTarget(30, 'min')).toEqual({ base: 30, unit: 'min', round: 5, max: 60 });
    expect(customTarget(10, 'min')?.round).toBe(1);
    expect(customTarget(0, 'min')).toBeUndefined();
  });
  it('ships measurable quests in the library', () => {
    const measurable = Object.values(QUEST_LIBRARY).flat().filter((q) => q.target);
    expect(measurable.length > 15).toBe(true);
  });
});

const game = (): GameState => {
  let s = createInitialState();
  s = addHabit(s, { name: 'Deep work', stat: 'FOC', difficulty: 'hard', timeOfDay: 'morning', target: { base: 60, unit: 'min', round: 5, max: 150 } });
  return s;
};
const doDays = (s: GameState, days: number, skipAfter = 0): GameState => {
  let g = s;
  for (let d = 0; d < days; d++) g = advanceDays(completeQuest(g, 'h1').state, 1 + (d === skipAfter - 1 ? 3 : 0));
  return g;
};

describe('progression in the game', () => {
  it('levels up on the 5th completion and pays more XP afterwards', () => {
    let s = game();
    expect(questLabel(s.habits[0]!)).toBe('Deep work · 1 h');
    for (let d = 1; d <= 4; d++) {
      const r = completeQuest(s, 'h1');
      expect(r.questLevelUp).toBeNull();
      s = advanceDays(r.state, 1);
    }
    const fifth = completeQuest(s, 'h1');
    expect(fifth.xpGained).toBe(questXp('hard', 5, false)); // the 5th still pays level 0
    expect(fifth.questLevelUp?.label).toBe('1 h 15 min');
    expect(fifth.questLevelUp?.level).toBe(1);
    s = advanceDays(fifth.state, 1);
    const sixth = completeQuest(s, 'h1');
    expect(sixth.xpGained).toBe(questXp('hard', 6, false, 1, 1.25));
    expect(questLabel(sixth.state.habits[0]!)).toBe('Deep work · 1 h 15 min');
  });
  it('only completed days count, so missed days just pause it', () => {
    const s = doDays(game(), 5, 3); // skips 3 days after the 3rd completion
    expect(s.habits[0]!.target!.completions).toBe(5);
    expect(targetLevel(s.habits[0]!.target!)).toBe(1);
  });
  it('can be frozen, keeping progress', () => {
    let s = doDays(game(), 6);
    s = setProgressionFrozen(s, 'h1', true);
    s = doDays(s, 10);
    expect(s.habits[0]!.target!.completions).toBe(6);
    expect(targetLevel(s.habits[0]!.target!)).toBe(1);
  });
  it('leaves quests without a target alone', () => {
    let s = createInitialState();
    s = addHabit(s, { name: 'Make your bed', stat: 'DIS', difficulty: 'easy', timeOfDay: 'morning' });
    const r = completeQuest(s, 'h1');
    expect(r.state.habits[0]!.target).toBeUndefined();
    expect(r.questLevelUp).toBeNull();
    expect(r.xpGained).toBe(questXp('easy', 1, false));
  });
  it('survives save and load', () => {
    const s = doDays(game(), 7);
    const parsed = parseSave(exportSave(s, '2026-10-20'));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.save.state).toEqual(s);
  });
});
