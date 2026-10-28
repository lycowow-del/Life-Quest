import { describe, expect, it } from 'vitest';
import { addHabit, completeQuest, createInitialState } from './engine';
import { PET_POINTS_PER_STAGE, petGrowth, petLook, petMood } from './pet';
import { stepThreshold } from './xp';
import type { GameState } from './types';

const shape = (look: object, want: Record<string, number>): boolean =>
  Object.entries(want).every(([k, v]) => (look as Record<string, number>)[k] === v);

describe('companion growth', () => {
  it('starts as an egg and hatches on the first division', () => {
    expect(shape(petLook(0), { stage: 0, form: 0, tierIndex: 0, chevrons: 1, apex: 0 })).toBe(true);
    expect(petLook(0).kind).toBe('egg');
    expect(petLook(stepThreshold(1)).kind).toBe('pet');
  });
  it('changes body shape at Iron III, Silver IV, Platinum IV and Master', () => {
    expect(petLook(stepThreshold(1)).form).toBe(0);
    expect(petLook(stepThreshold(7)).form).toBe(0);
    expect(petLook(stepThreshold(8)).form).toBe(1);
    expect(petLook(stepThreshold(15)).form).toBe(1);
    expect(petLook(stepThreshold(16)).form).toBe(2);
    expect(petLook(stepThreshold(27)).form).toBe(2);
    expect(petLook(stepThreshold(28)).form).toBe(3);
  });
  it('grows with every division and takes the tier colours and chevrons', () => {
    expect(shape(petLook(stepThreshold(3)), { stage: 3, tierIndex: 0, chevrons: 4 })).toBe(true);
    expect(shape(petLook(stepThreshold(4)), { stage: 4, tierIndex: 1, chevrons: 1 })).toBe(true);
    expect(shape(petLook(stepThreshold(27)), { stage: 27, tierIndex: 6, chevrons: 4 })).toBe(true);
  });
  it('has a larger stage at every rank step', () => {
    for (let i = 1; i <= 30; i++) expect(petLook(stepThreshold(i)).stage > petLook(stepThreshold(i - 1)).stage).toBe(true);
  });
  it('grows every 100 points from Master up, with no chevrons', () => {
    const m = stepThreshold(28);
    const at = (pts: number) => petLook(m + pts * 10);
    expect(shape(at(0), { stage: 28, tierIndex: 7, chevrons: 0, apex: 0 })).toBe(true);
    expect(at(99).stage).toBe(28);
    expect(at(100).stage).toBe(29);
    expect(shape(at(250), { stage: 30, apex: 2 })).toBe(true);
    expect(at(1000).tierIndex).toBe(9);
    expect(at(1000).stage).toBe(40);
  });
  it('says what it needs to grow next', () => {
    expect(petGrowth(0).text).toBe('Hatches at Iron III (350 XP)');
    expect(petGrowth(stepThreshold(5) + 50).text.startsWith('Grows at Bronze II')).toBe(true);
    const m = stepThreshold(28);
    expect(petGrowth(m + 250 * 10)).toEqual({ text: `Grows in ${PET_POINTS_PER_STAGE - 50} points`, ratio: 0.5 });
  });
});

const game = (streak: number): GameState => {
  let s = createInitialState();
  s = addHabit(s, { name: 'A', stat: 'STR', difficulty: 'easy', timeOfDay: 'morning' });
  s = addHabit(s, { name: 'B', stat: 'INT', difficulty: 'easy', timeOfDay: 'morning' });
  return { ...s, profile: { ...s.profile, streak } };
};

describe('companion mood', () => {
  it('is happy when everything due is done', () => {
    let s = game(0);
    s = completeQuest(completeQuest(s, 'h1').state, 'h2').state;
    expect(petMood(s, 9)).toBe('happy');
  });
  it('is sleepy in the evening when the streak still needs a quest', () => {
    expect(petMood(game(5), 18)).toBe('sleepy');
    expect(petMood(game(5), 17)).toBe('idle');
    expect(petMood(game(0), 21)).toBe('idle'); // no streak to lose
    expect(petMood(completeQuest(game(5), 'h1').state, 21)).toBe('idle'); // started, not finished
  });
  it('stays idle when nothing is due', () => {
    expect(petMood(createInitialState(), 21)).toBe('idle');
  });
});
