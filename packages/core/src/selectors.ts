import { HARD_MISS_PENALTY_RATIO, RANKS, STAT_KEYS, XP_VALUES } from './constants';
import type { GameState, Habit, Rank, StatKey, TimeOfDay } from './types';
import { nextRank, statLevel, xpForStatLevel } from './xp';

export const activeHabits = (s: GameState): Habit[] => s.habits.filter((h) => !h.archived);

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

export function rankProgress(xp: number): { rank: Rank; next: Rank | null; ratio: number; xpToNext: number } {
  const cur = [...RANKS].reverse().find((r) => xp >= r.minXp) ?? RANKS[0]!;
  const next = nextRank(xp);
  return {
    rank: cur.rank,
    next: next?.rank ?? null,
    ratio: next ? (xp - cur.minXp) / (next.minXp - cur.minXp) : 1,
    xpToNext: next ? next.minXp - xp : 0,
  };
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
