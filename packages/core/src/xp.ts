import {
  ARCHETYPE_PAIR_RATIO,
  BALANCED_DAY_BONUS,
  LEVEL_XP_BASE,
  MULTIPLIER_MAX,
  MULTIPLIER_STEP,
  PAIR_ARCHETYPES,
  RANKS,
  SINGLE_ARCHETYPES,
  STAT_KEYS,
  STAT_XP_BASE,
  XP_VALUES,
} from './constants';
import type { Difficulty, Rank, StatKey, StatXp } from './types';

export const consistencyMultiplier = (streakDays: number): number =>
  Math.round(Math.min(MULTIPLIER_MAX, 1 + MULTIPLIER_STEP * Math.max(0, streakDays)) * 1000) / 1000;

export const questXp = (difficulty: Difficulty, streakDays: number, balancedDay: boolean): number =>
  Math.round(
    XP_VALUES[difficulty] * consistencyMultiplier(streakDays) * (balancedDay ? BALANCED_DAY_BONUS : 1),
  );

export const xpForLevel = (level: number): number => LEVEL_XP_BASE * (level - 1) ** 2;
export const levelFromXp = (xp: number): number =>
  Math.floor(Math.sqrt(Math.max(0, xp) / LEVEL_XP_BASE)) + 1;

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  return { level, xpIntoLevel: xp - floor, xpForNext: span, ratio: (xp - floor) / span };
}

export const rankFromXp = (xp: number): Rank =>
  [...RANKS].reverse().find((r) => xp >= r.minXp)?.rank ?? 'E';

export const nextRank = (xp: number) => RANKS.find((r) => r.minXp > xp) ?? null;

export const statLevel = (statXp: number): number =>
  Math.floor(Math.sqrt(Math.max(0, statXp) / STAT_XP_BASE));
export const xpForStatLevel = (level: number): number => STAT_XP_BASE * level * level;

const ranked = (statXp: StatXp): StatKey[] =>
  [...STAT_KEYS].sort((a, b) => statXp[b] - statXp[a] || STAT_KEYS.indexOf(a) - STAT_KEYS.indexOf(b));

export const topStat = (statXp: StatXp): StatKey => ranked(statXp)[0]!;

export function archetype(statXp: StatXp): string {
  const [a, b] = ranked(statXp) as [StatKey, StatKey];
  if (statXp[a] <= 0) return 'Novice';
  if (statXp[b] > 0 && statXp[b] >= statXp[a] * ARCHETYPE_PAIR_RATIO) {
    const pair = PAIR_ARCHETYPES[[a, b].sort().join('+')];
    if (pair) return pair;
  }
  return SINGLE_ARCHETYPES[a];
}
