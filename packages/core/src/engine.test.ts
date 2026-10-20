import { describe, expect, it } from 'vitest';
import {
  addHabit,
  advanceDays,
  applyStatDecay,
  completeQuest,
  createInitialState,
  cycleDay,
  endDay,
  getLog,
  setMode,
} from './engine';
import type { GameState, Mode } from './types';

const withHabits = (mode: Mode = 'standard'): GameState => {
  let s = createInitialState({ mode });
  s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning' }); // h1
  s = addHabit(s, { name: 'Read', stat: 'INT', difficulty: 'medium', timeOfDay: 'afternoon' }); // h2
  s = addHabit(s, { name: 'Journal', stat: 'WIS', difficulty: 'easy', timeOfDay: 'evening' }); // h3
  return s;
};
const oneEasy = (mode: Mode = 'standard'): GameState =>
  addHabit(createInitialState({ mode }), { name: 'Stretch', stat: 'DIS', difficulty: 'easy', timeOfDay: 'morning' });

describe('completeQuest', () => {
  it('awards XP with the multiplier and feeds the stat', () => {
    const r = completeQuest(withHabits(), 'h1');
    expect(r.ok).toBe(true);
    expect(r.xpGained).toBe(51); // 50 * 1.025
    expect(r.state.profile.totalXp).toBe(51);
    expect(r.state.profile.statXp.STR).toBe(51);
    expect(r.state.profile.streak).toBe(1);
    expect(r.leveledUp).toBe(true);
  });
  it('extends the streak once per day only', () => {
    let s = completeQuest(withHabits(), 'h1').state;
    s = completeQuest(s, 'h2').state;
    expect(s.profile.streak).toBe(1);
    expect(getLog(s, 1).completions).toHaveLength(2);
  });
  it('ignores duplicates and unknown habits', () => {
    const s = completeQuest(withHabits(), 'h1').state;
    expect(completeQuest(s, 'h1').reason).toBe('already_completed');
    expect(completeQuest(s, 'nope').reason).toBe('unknown_habit');
    expect(completeQuest(s, 'h1').state).toBe(s);
  });
  it('applies the Balanced Day bonus at 3 different stats', () => {
    let s = completeQuest(withHabits(), 'h1').state;
    s = completeQuest(s, 'h2').state;
    const r = completeQuest(s, 'h3');
    expect(r.balancedDay).toBe(true);
    expect(r.xpGained).toBe(12); // 10 * 1.025 * 1.15
  });
  it('does not mutate the input state', () => {
    const s = withHabits();
    const snap = JSON.stringify(s);
    completeQuest(s, 'h1');
    endDay(s);
    expect(JSON.stringify(s)).toBe(snap);
  });
});

describe('streaks (standard mode)', () => {
  it('builds across days', () => {
    let s = oneEasy();
    for (let i = 0; i < 3; i++) s = advanceDays(completeQuest(s, 'h1').state, 1);
    expect(s.profile.streak).toBe(3);
    expect(s.profile.bestStreak).toBe(3);
  });
  it('resets the streak on a missed day but the cycle continues', () => {
    let s = advanceDays(completeQuest(oneEasy(), 'h1').state, 1);
    expect(s.profile.streak).toBe(1);
    s = advanceDays(s, 1);
    expect(s.profile.streak).toBe(0);
    expect(s.profile.bestStreak).toBe(1);
    expect(cycleDay(s.profile)).toBe(3);
  });
  it('never restarts the cycle after 3 misses', () => {
    const s = advanceDays(oneEasy(), 3);
    expect(s.profile.cycle).toBe(1);
    expect(cycleDay(s.profile)).toBe(4);
  });
});

describe('Hard Mode', () => {
  it('deducts half the XP of each missed quest', () => {
    let s = completeQuest(withHabits('hard'), 'h1').state; // 51 XP
    s = endDay(s); // missed: Read 25 -> 13, Journal 10 -> 5
    expect(getLog(s, 1).penalty).toBe(18);
    expect(s.profile.totalXp).toBe(33);
    expect(s.profile.statXp.INT).toBe(0);
  });
  it('never drops XP below zero', () => {
    const s = endDay(withHabits('hard'));
    expect(s.profile.totalXp).toBe(0);
    expect(getLog(s, 1).penalty).toBe(0);
  });
  it('restarts the cycle after 3 consecutive missed days', () => {
    const s = advanceDays(oneEasy('hard'), 3);
    expect(s.profile.cycle).toBe(2);
    expect(cycleDay(s.profile)).toBe(1);
    expect(s.profile.streak).toBe(0);
  });
  it('decays a neglected stat by one level every 5 days', () => {
    const r = applyStatDecay(
      { STR: 500, INT: 0, FOC: 0, DIS: 0, WIS: 0 },
      { STR: 1, INT: 1, FOC: 1, DIS: 1, WIS: 1 },
      6,
    );
    expect(r.decayed).toContain('STR');
    expect(r.statXp.STR).toBe(320);
    expect(applyStatDecay({ STR: 500, INT: 0, FOC: 0, DIS: 0, WIS: 0 }, { STR: 1, INT: 1, FOC: 1, DIS: 1, WIS: 1 }, 5).decayed).toHaveLength(0);
  });
  it('applies decay through endDay and records it', () => {
    let s = setMode(createInitialState(), 'hard');
    s = { ...s, profile: { ...s.profile, statXp: { ...s.profile.statXp, STR: 500 } } };
    s = advanceDays(s, 6);
    expect(getLog(s, 6).decayed).toContain('STR');
    expect(s.profile.statXp.STR).toBe(320);
  });
  it('can be toggled', () => {
    expect(setMode(createInitialState(), 'hard').profile.mode).toBe('hard');
  });
});

describe('milestones and cycle', () => {
  it('unlocks the day-7 card with steady play', () => {
    let s = oneEasy();
    for (let d = 1; d <= 6; d++) s = advanceDays(completeQuest(s, 'h1').state, 1);
    expect(s.milestones).toHaveLength(0);
    const r = completeQuest(s, 'h1');
    expect(r.newMilestones).toHaveLength(1);
    expect(r.newMilestones[0]!.rarity).toBe('common');
    expect(r.newMilestones[0]!.day).toBe(7);
  });
  it('does not unlock a card for a barely active week', () => {
    let s = advanceDays(completeQuest(oneEasy(), 'h1').state, 6);
    s = completeQuest(s, 'h1').state;
    expect(s.milestones).toHaveLength(0);
  });
  it('rolls into a new cycle after day 66', () => {
    const s = advanceDays(createInitialState(), 66);
    expect(s.profile.completedCycles).toBe(1);
    expect(s.profile.cycle).toBe(2);
    expect(cycleDay(s.profile)).toBe(1);
  });
});
