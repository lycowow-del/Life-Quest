import { describe, expect, it } from 'vitest';
import {
  completeFocusSession,
  focusQuest,
  focusSessionBaseXp,
  logMood,
  saveJournalEntry,
  suggestedFocusMinutes,
  todayFocus,
  todayJournal,
} from './activity';
import { addHabit, completeQuest, createInitialState } from './engine';
import { grantXp } from './reward';
import { exportSave, parseSave } from './serialize';
import type { GameState } from './types';

const fresh = (): GameState => createInitialState();

describe('focus timer', () => {
  it('pays 1.2 base XP per minute and ignores short sessions', () => {
    expect(focusSessionBaseXp(25, 0)).toBe(30);
    expect(focusSessionBaseXp(9, 0)).toBe(0);
    expect(completeFocusSession(fresh(), 5).reward).toBeNull();
    expect(completeFocusSession(fresh(), 5).state).toEqual(fresh());
  });
  it('adds Focus XP and records the session', () => {
    const { state, reward } = completeFocusSession(fresh(), 25);
    expect(reward?.xp).toBe(30);
    expect(reward?.stat).toBe('FOC');
    expect(state.profile.totalXp).toBe(30);
    expect(state.profile.statXp.FOC).toBe(30);
    expect(todayFocus(state)).toEqual({ sessions: 1, minutes: 25, baseXp: 30 });
  });
  it('applies the streak multiplier', () => {
    const s = { ...fresh(), profile: { ...fresh().profile, streak: 20 } }; // 1.5x
    expect(completeFocusSession(s, 25).reward?.xp).toBe(45);
  });
  it('caps base XP at 120 a day but still logs the time', () => {
    let s = fresh();
    for (let i = 0; i < 4; i++) s = completeFocusSession(s, 25).state;
    expect(s.profile.totalXp).toBe(120);
    const fifth = completeFocusSession(s, 25);
    expect(fifth.reward).toBeNull();
    expect(todayFocus(fifth.state).sessions).toBe(5);
    expect(todayFocus(fifth.state).minutes).toBe(125);
    expect(fifth.state.profile.totalXp).toBe(120);
  });
  it('suggests a length from the focus quest target', () => {
    expect(suggestedFocusMinutes(fresh())).toBe(25);
    let s = addHabit(fresh(), { name: 'Deep work', stat: 'FOC', difficulty: 'hard', timeOfDay: 'morning', target: { base: 90, unit: 'min', round: 5, max: 150 } });
    expect(focusQuest(s)?.name).toBe('Deep work');
    expect(suggestedFocusMinutes(s)).toBe(90);
    s = completeQuest(s, 'h1').state;
    expect(focusQuest(s)).toBeNull();
  });
});

describe('mood and journal', () => {
  it('pays for the first mood of the day only', () => {
    const a = logMood(fresh(), 4);
    expect(a.reward?.xp).toBe(5);
    expect(a.reward?.stat).toBe('WIS');
    expect(todayJournal(a.state)?.mood).toBe(4);
    const b = logMood(a.state, 2);
    expect(b.reward).toBeNull();
    expect(todayJournal(b.state)?.mood).toBe(2);
    expect(b.state.profile.totalXp).toBe(5);
  });
  it('pays 15 for a real entry once a day', () => {
    expect(saveJournalEntry(fresh(), 'too short', []).reward).toBeNull();
    const a = saveJournalEntry(fresh(), 'Today I finished my workout and read.', []);
    expect(a.reward?.xp).toBe(15);
    const b = saveJournalEntry(a.state, 'Today I finished my workout and read. Felt good.', []);
    expect(b.reward).toBeNull();
    expect(todayJournal(b.state)?.text).toBe('Today I finished my workout and read. Felt good.');
  });
  it('pays for a photo of a paper page, even without text', () => {
    const a = saveJournalEntry(fresh(), '', ['photo-1']);
    expect(a.reward?.xp).toBe(15);
    expect(todayJournal(a.state)?.photoIds).toEqual(['photo-1']);
    const removed = saveJournalEntry(a.state, '', []);
    expect(todayJournal(removed.state)?.photoIds).toBeUndefined();
    expect(removed.reward).toBeNull();
  });
  it('keeps mood and journal XP separate', () => {
    const m = logMood(fresh(), 3).state;
    const j = saveJournalEntry(m, 'A proper journal entry for today.', []);
    expect(j.reward?.xp).toBe(15);
    expect(j.state.profile.totalXp).toBe(20);
    expect(todayJournal(j.state)?.mood).toBe(3);
  });
  it('limits text and photo count', () => {
    const r = saveJournalEntry(fresh(), 'x'.repeat(6000), ['1', '2', '3', '4', '5', '6', '7']);
    expect(todayJournal(r.state)?.text?.length).toBe(5000);
    expect(todayJournal(r.state)?.photoIds).toHaveLength(6);
  });
});

describe('grantXp and saving', () => {
  it('reports a promotion when XP crosses a rank step', () => {
    const s = { ...fresh(), profile: { ...fresh().profile, totalXp: 340 } };
    const { reward } = grantXp(s, 'WIS', 20);
    expect(reward.rankedUp).toBe(true);
    expect(reward.to.label).toBe('Iron III');
    expect(reward.tierUp).toBe(false);
  });
  it('counts the stat as active so Hard Mode decay resets', () => {
    let s = fresh();
    s = { ...s, profile: { ...s.profile, dayNumber: 9 } };
    expect(grantXp(s, 'FOC', 10).state.profile.lastStatDay.FOC).toBe(9);
  });
  it('survives save and load with journal and focus data', () => {
    let s = completeFocusSession(fresh(), 25).state;
    s = logMood(s, 5).state;
    s = saveJournalEntry(s, 'A saved entry with enough words.', ['p1', 'p2']).state;
    const parsed = parseSave(exportSave(s, '2026-10-20'));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.save.state).toEqual(s);
  });
  it('rejects a corrupted journal', () => {
    const s = logMood(fresh(), 5).state;
    const o = JSON.parse(exportSave(s, '2026-10-20'));
    o.state.journal['1'].mood = 9;
    expect(parseSave(JSON.stringify(o)).ok).toBe(false);
  });
});
