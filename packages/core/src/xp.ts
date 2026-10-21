import {
  ARCHETYPE_PAIR_RATIO,
  BALANCED_DAY_BONUS,
  LEVEL_XP_BASE,
  MULTIPLIER_MAX,
  MULTIPLIER_STEP,
  PAIR_ARCHETYPES,
  APEX_FIRST_STEP,
  APEX_TIER_POINTS,
  LADDER_LAST_STEP,
  POINT_XP,
  RANK_CURVE,
  SINGLE_ARCHETYPES,
  STAT_KEYS,
  STAT_XP_BASE,
  TIER_NAMES,
  XP_VALUES,
} from './constants';
import type { Difficulty, Division, RankInfo, StatKey, StatXp } from './types';

export const consistencyMultiplier = (streakDays: number): number =>
  Math.round(Math.min(MULTIPLIER_MAX, 1 + MULTIPLIER_STEP * Math.max(0, streakDays)) * 1000) / 1000;

export const questXp = (
  difficulty: Difficulty,
  streakDays: number,
  balancedDay: boolean,
  bossMultiplier = 1,
): number =>
  Math.round(
    XP_VALUES[difficulty] *
      consistencyMultiplier(streakDays) *
      (balancedDay ? BALANCED_DAY_BONUS : 1) *
      bossMultiplier,
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

const ROMAN: Record<Division, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

const curve = (n: number): number =>
  Math.round((RANK_CURVE.scale * Math.pow(n, RANK_CURVE.power)) / RANK_CURVE.round) * RANK_CURVE.round;

/** XP where a step begins. Steps up to Master follow the curve; Grandmaster and Challenger are point offsets from Master. */
export const stepThreshold = (step: number): number => {
  if (step <= 0) return 0;
  if (step <= APEX_FIRST_STEP) return curve(step);
  return curve(APEX_FIRST_STEP) + APEX_TIER_POINTS[step - APEX_FIRST_STEP]! * POINT_XP;
};

export function stepInfo(step: number): { tierIndex: number; division: Division | null } {
  if (step < APEX_FIRST_STEP) return { tierIndex: Math.floor(step / 4), division: (4 - (step % 4)) as Division };
  return { tierIndex: 7 + (step - APEX_FIRST_STEP), division: null };
}

export function stepLabel(step: number): string {
  const { tierIndex, division } = stepInfo(step);
  const name = TIER_NAMES[tierIndex]!;
  return division ? `${name} ${ROMAN[division]}` : name;
}

/** Where a total XP sits on the ladder. From Master up, XP becomes one running point total. */
export function rankInfo(xp: number): RankInfo {
  const x = Math.max(0, xp);
  let step = 0;
  for (let i = LADDER_LAST_STEP; i >= 0; i--) {
    if (x >= stepThreshold(i)) {
      step = i;
      break;
    }
  }
  const { tierIndex, division } = stepInfo(step);
  const tier = TIER_NAMES[tierIndex]!;
  const base = stepThreshold(step);
  const shortLabel = stepLabel(step);
  const apex = step >= APEX_FIRST_STEP;
  const points = apex ? Math.floor((x - stepThreshold(APEX_FIRST_STEP)) / POINT_XP) : null;
  const label = points !== null ? `${shortLabel} · ${points} pts` : shortLabel;
  if (step === LADDER_LAST_STEP) {
    const into = x - base;
    return {
      step, tierIndex, tier, division, points, label, shortLabel,
      ratio: (into % POINT_XP) / POINT_XP, xpToNext: POINT_XP - (into % POINT_XP), pointsToNext: null, nextLabel: null,
    };
  }
  const top = stepThreshold(step + 1);
  return {
    step, tierIndex, tier, division, points, label, shortLabel,
    ratio: (x - base) / (top - base), xpToNext: top - x,
    pointsToNext: apex ? Math.ceil((top - x) / POINT_XP) : null,
    nextLabel: stepLabel(step + 1),
  };
}

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
