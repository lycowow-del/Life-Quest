import {
  BOSS_CHEST_XP,
  BOSS_END_DAY,
  BOSS_START_DAY,
  BOSS_XP_MULT,
  HARD_MISS_PENALTY_RATIO,
  STAT_KEYS,
  XP_VALUES,
} from './constants';
import { cycleDay } from './engine';
import type { GameState, Habit, StatKey, TimeOfDay } from './types';
import { statLevel, xpForStatLevel } from './xp';

/** Quests that are unlocked today (not archived, and past their unlock day). */
export const activeHabits = (s: GameState): Habit[] =>
  s.habits.filter((h) => !h.archived && h.createdOnDay <= s.profile.dayNumber);

/** Quests still locked by the onboarding ramp, grouped by the day they unlock. */
export function upcomingUnlocks(s: GameState): { day: number; count: number }[] {
  const byDay = new Map<number, number>();
  for (const h of s.habits) {
    if (h.archived || h.createdOnDay <= s.profile.dayNumber) continue;
    byDay.set(h.createdOnDay, (byDay.get(h.createdOnDay) ?? 0) + 1);
  }
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, count]) => ({ day, count }));
}

export interface BossWeekStatus {
  stat: StatKey | null;
  active: boolean;
  /** Days until boss week starts (0 once it has started). */
  startsIn: number;
  daysLeft: number;
  chestClaimed: boolean;
  chestXp: number;
  multiplier: number;
}

export function bossWeekStatus(s: GameState): BossWeekStatus {
  const p = s.profile;
  const cd = cycleDay(p);
  const stat = p.bossStat ?? null;
  const active = !!stat && cd >= BOSS_START_DAY && cd <= BOSS_END_DAY;
  return {
    stat,
    active,
    startsIn: stat && cd < BOSS_START_DAY ? BOSS_START_DAY - cd : 0,
    daysLeft: active ? BOSS_END_DAY - cd + 1 : 0,
    chestClaimed: !!stat && p.bossChestClaimedCycle === p.cycle,
    chestXp: BOSS_CHEST_XP,
    multiplier: BOSS_XP_MULT,
  };
}

export function groupByTimeOfDay(habits: Habit[]): Record<TimeOfDay, Habit[]> {
  const out: Record<TimeOfDay, Habit[]> = { morning: [], afternoon: [], evening: [] };
  for (const h of habits) out[h.timeOfDay].push(h);
  return out;
}

export const completedToday = (s: GameState): Set<string> =>
  new Set((s.logs[s.profile.dayNumber]?.completions ?? []).map((c) => c.habitId));

export function todayProgress(s: GameState): { done: number; total: number } {
  const done = completedToday(s);
  const act = activeHabits(s);
  return { done: act.filter((h) => done.has(h.id)).length, total: act.length };
}

export interface StatSummary {
  key: StatKey;
  level: number;
  xp: number;
  /** Progress toward the next stat level, 0 to 1. */
  ratio: number;
}

export function statSummary(s: GameState): StatSummary[] {
  return STAT_KEYS.map((key) => {
    const xp = s.profile.statXp[key];
    const level = statLevel(xp);
    const floor = xpForStatLevel(level);
    const span = xpForStatLevel(level + 1) - floor;
    return { key, level, xp, ratio: Math.min(1, Math.max(0, (xp - floor) / span)) };
  });
}

/** XP Hard Mode would take if the day ended now (mirrors endDay). 0 in standard mode. */
export function penaltyAtRisk(s: GameState): number {
  if (s.profile.mode !== 'hard') return 0;
  const done = completedToday(s);
  let total = 0;
  for (const h of s.habits) {
    if (h.archived || h.createdOnDay > s.profile.dayNumber || done.has(h.id)) continue;
    total += Math.round(XP_VALUES[h.difficulty] * HARD_MISS_PENALTY_RATIO);
  }
  return Math.min(total, s.profile.totalXp);
}
