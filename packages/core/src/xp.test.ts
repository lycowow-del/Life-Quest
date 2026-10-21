import { describe, expect, it } from 'vitest';
import {
  archetype,
  consistencyMultiplier,
  levelFromXp,
  levelProgress,
  questXp,
  rankInfo,
  stepThreshold,
  statLevel,
} from './xp';

const stats = (o: Partial<Record<'STR' | 'INT' | 'FOC' | 'DIS' | 'WIS', number>>) => ({
  STR: 0,
  INT: 0,
  FOC: 0,
  DIS: 0,
  WIS: 0,
  ...o,
});

describe('multiplier', () => {
  it('grows 0.025 per streak day and caps at 2.5x on day 60', () => {
    expect(consistencyMultiplier(0)).toBe(1);
    expect(consistencyMultiplier(10)).toBe(1.25);
    expect(consistencyMultiplier(60)).toBe(2.5);
    expect(consistencyMultiplier(500)).toBe(2.5);
  });
});

describe('questXp', () => {
  it('scales base XP by multiplier and balanced bonus, rounded', () => {
    expect(questXp('easy', 0, false)).toBe(10);
    expect(questXp('hard', 60, false)).toBe(125);
    expect(questXp('medium', 0, true)).toBe(29);
  });
});

describe('levels and ranks', () => {
  it('computes levels and progress', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(200)).toBe(3);
    const lp = levelProgress(200);
    expect(lp.level).toBe(3);
    expect(lp.xpForNext).toBe(250);
    expect(lp.ratio).toBe(0);
  });
  it('walks the 31-step ladder', () => {
    expect(rankInfo(0).label).toBe('Iron IV');
    expect(rankInfo(stepThreshold(4) - 1).label).toBe('Iron I');
    expect(rankInfo(stepThreshold(4)).label).toBe('Bronze IV');
    expect(rankInfo(26954).label).toBe('Gold II');
    expect(rankInfo(stepThreshold(27)).label).toBe('Diamond I');
    expect(rankInfo(stepThreshold(28) - 1).label).toBe('Diamond I');
  });
  it('has strictly increasing thresholds', () => {
    for (let i = 1; i <= 30; i++) expect(stepThreshold(i) > stepThreshold(i - 1)).toBe(true);
  });
  it('carries one running point total through Master, Grandmaster and Challenger', () => {
    const m = stepThreshold(28);
    expect(rankInfo(m).label).toBe('Master · 0 pts');
    expect(rankInfo(m + 250).label).toBe('Master · 25 pts');
    expect(rankInfo(m + 4249).label).toBe('Master · 424 pts');
    expect(rankInfo(m + 4250).label).toBe('Grandmaster · 425 pts');
    expect(rankInfo(m + 8549).label).toBe('Grandmaster · 854 pts');
    expect(rankInfo(m + 8550).label).toBe('Challenger · 855 pts');
    expect(rankInfo(m + 20000).label).toBe('Challenger · 2000 pts');
    expect(rankInfo(m + 20000).nextLabel).toBeNull();
    expect(rankInfo(10_000_000).step).toBe(30);
  });
  it('reports points to the next apex tier', () => {
    const m = stepThreshold(28);
    expect(rankInfo(m + 250).pointsToNext).toBe(400);
    expect(rankInfo(m + 250).nextLabel).toBe('Grandmaster');
    expect(rankInfo(0).pointsToNext).toBeNull();
    expect(rankInfo(m + 8550).pointsToNext).toBeNull();
  });
  it('reports progress to the next step', () => {
    const mid = (stepThreshold(5) + stepThreshold(6)) / 2;
    expect(Math.round(rankInfo(mid).ratio * 100)).toBe(50);
    expect(rankInfo(mid).nextLabel).toBe('Bronze II');
  });
  it('computes stat levels', () => {
    expect(statLevel(0)).toBe(0);
    expect(statLevel(80)).toBe(2);
    expect(statLevel(500)).toBe(5);
  });
});

describe('archetype', () => {
  it('is Novice with no XP', () => expect(archetype(stats({}))).toBe('Novice'));
  it('uses a single title for a lopsided build', () => {
    expect(archetype(stats({ STR: 100 }))).toBe('Warrior');
    expect(archetype(stats({ STR: 100, INT: 60 }))).toBe('Warrior');
  });
  it('uses a pair title when the second stat is within 70%', () => {
    expect(archetype(stats({ WIS: 100, DIS: 80 }))).toBe('Monk');
    expect(archetype(stats({ INT: 100, STR: 90 }))).toBe('Scholar-Knight');
  });
});
