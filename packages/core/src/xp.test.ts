import { describe, expect, it } from 'vitest';
import {
  archetype,
  consistencyMultiplier,
  levelFromXp,
  levelProgress,
  nextRank,
  questXp,
  rankFromXp,
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
  it('promotes ranks at thresholds', () => {
    expect(rankFromXp(499)).toBe('E');
    expect(rankFromXp(500)).toBe('D');
    expect(rankFromXp(12000)).toBe('S');
    expect(nextRank(0)?.rank).toBe('D');
    expect(nextRank(12000)).toBeNull();
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
