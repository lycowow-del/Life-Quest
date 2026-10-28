import { describe, expect, it } from 'vitest';
import { cycleHeatmap, cycleStats, lifetimeTotals } from './analytics';
import { completeFocusSession, logMood, saveJournalEntry } from './activity';
import { addHabit, advanceDays, completeQuest, createInitialState } from './engine';
import type { GameState } from './types';

const two = (): GameState => {
  let s = createInitialState({ startWeekday: 1 });
  s = addHabit(s, { name: 'A', stat: 'STR', difficulty: 'easy', timeOfDay: 'morning' });
  s = addHabit(s, { name: 'B', stat: 'INT', difficulty: 'easy', timeOfDay: 'morning' });
  return s;
};
const kinds = (s: GameState, n: number): string[] => cycleHeatmap(s).slice(0, n).map((c) => c.kind);

describe('heatmap', () => {
  it('has 66 cells and marks today and the future', () => {
    const cells = cycleHeatmap(two());
    expect(cells).toHaveLength(66);
    expect(cells[0]!.kind).toBe('today');
    expect(cells[1]!.kind).toBe('future');
    expect(cells[65]!.cycleDay).toBe(66);
  });
  it('tells complete, partial and missed days apart', () => {
    let s = two();
    s = completeQuest(s, 'h1').state;
    s = completeQuest(s, 'h2').state;
    s = advanceDays(s, 1); // day 1: both done
    s = advanceDays(completeQuest(s, 'h1').state, 1); // day 2: one of two
    s = advanceDays(s, 1); // day 3: none
    expect(kinds(s, 5)).toEqual(['complete', 'partial', 'missed', 'today', 'future']);
    const c = cycleHeatmap(s);
    expect([c[1]!.done, c[1]!.due]).toEqual([1, 2]);
  });
  it('shows rest days for routine quests', () => {
    let s = createInitialState({ startWeekday: 1 });
    s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning', schedule: { kind: 'every', n: 3 } });
    s = advanceDays(completeQuest(s, 'h1').state, 3); // day 4, days 2 and 3 were rest
    expect(kinds(s, 4)).toEqual(['complete', 'rest', 'rest', 'today']);
  });
  it('flags boss week and skill card days', () => {
    const c = cycleHeatmap(two());
    expect(c.filter((x) => x.boss).map((x) => x.cycleDay)).toEqual([15, 16, 17, 18, 19, 20, 21]);
    expect(c.filter((x) => x.milestone).map((x) => x.cycleDay)).toEqual([7, 21, 30, 66]);
  });
  it('starts again after a cycle restart', () => {
    let s = createInitialState({ mode: 'hard', startWeekday: 1 });
    s = addHabit(s, { name: 'A', stat: 'STR', difficulty: 'easy', timeOfDay: 'morning' });
    s = advanceDays(s, 3); // three empty days restart the cycle
    expect(cycleHeatmap(s)[0]!.kind).toBe('today');
    expect(cycleHeatmap(s)[0]!.day).toBe(4);
  });
});

describe('cycle stats and totals', () => {
  it('counts finished days and a completion rate', () => {
    let s = two();
    s = completeQuest(completeQuest(s, 'h1').state, 'h2').state;
    s = advanceDays(s, 1);
    s = advanceDays(s, 1); // day 2 missed
    const st = cycleStats(cycleHeatmap(s));
    expect(st).toEqual({ complete: 1, partial: 0, missed: 1, rest: 0, rate: 0.5 });
    expect(cycleStats(cycleHeatmap(two())).rate).toBeNull();
  });
  it('adds up lifetime totals', () => {
    let s = two();
    s = completeQuest(completeQuest(s, 'h1').state, 'h2').state;
    s = completeFocusSession(s, 25).state;
    s = logMood(s, 4).state;
    s = saveJournalEntry(s, 'A proper journal entry for the day.', []).state;
    const t = lifetimeTotals(s);
    expect(t.questsCompleted).toBe(2);
    expect(t.activeDays).toBe(1);
    expect(t.focusMinutes).toBe(25);
    expect(t.focusSessions).toBe(1);
    expect(t.journalDays).toBe(1);
    expect(t.moodDays).toBe(1);
  });
});
