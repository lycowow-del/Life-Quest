import {
  DECAY_WARNING_DAYS,
  HARD_CYCLE_RESTART_MISSES,
  HARD_MISS_PENALTY_RATIO,
  STAT_DECAY_INTERVAL_DAYS,
  STAT_KEYS,
  XP_VALUES,
} from './constants';
import { missedWhenDayEnds } from './schedule';
import { activeHabits, completedToday, penaltyAtRisk } from './selectors';
import type { GameState, Habit, StatKey } from './types';
import { statLevel } from './xp';

export interface DecayWarning {
  stat: StatKey;
  level: number;
  /** Days since the stat last earned XP. */
  idleDays: number;
  /** 0 means it loses a level when today closes unless you earn XP in it today. */
  daysLeft: number;
}

export interface HardModeStatus {
  active: boolean;
  /** The player switched Hard Mode off and it ends when today closes. */
  endsTonight: boolean;
  /** Quests that would cost XP if the day closed now, with the XP each would cost. */
  atRisk: { habit: Habit; xp: number }[];
  /** Total XP that would be taken now (never more than the XP you have). */
  totalAtRisk: number;
  /** Empty days in a row so far (not counting today). */
  emptyInARow: number;
  /** True when closing today with nothing done would restart the 66-day cycle. */
  restartTonight: boolean;
  decay: DecayWarning[];
}

/** Everything the Hard Mode panel needs. Only meaningful while Hard Mode is active (or ending tonight). */
export function hardModeStatus(s: GameState): HardModeStatus {
  const p = s.profile;
  const day = p.dayNumber;
  const done = completedToday(s);
  const atRisk = s.habits
    .filter((h) => missedWhenDayEnds(s, h, day, done.has(h.id)))
    .map((h) => ({ habit: h, xp: Math.round(XP_VALUES[h.difficulty] * HARD_MISS_PENALTY_RATIO) }));

  const visible = activeHabits(s).length > 0;
  const restartTonight = visible && done.size === 0 && p.consecutiveMissedDays + 1 >= HARD_CYCLE_RESTART_MISSES;

  const decay: DecayWarning[] = [];
  for (const stat of STAT_KEYS) {
    const level = statLevel(p.statXp[stat]);
    if (level === 0) continue;
    const gap = day - p.lastStatDay[stat];
    const daysLeft = gap > 0 && gap % STAT_DECAY_INTERVAL_DAYS === 0 ? 0 : STAT_DECAY_INTERVAL_DAYS - (gap % STAT_DECAY_INTERVAL_DAYS);
    if (daysLeft <= DECAY_WARNING_DAYS && gap > 0) decay.push({ stat, level, idleDays: gap, daysLeft });
  }

  return {
    active: p.mode === 'hard',
    endsTonight: p.pendingMode === 'standard',
    atRisk,
    totalAtRisk: penaltyAtRisk(s),
    emptyInARow: p.consecutiveMissedDays,
    restartTonight,
    decay,
  };
}

export interface DayReport {
  day: number;
  lost: number;
  missed: string[];
  decayed: StatKey[];
  restarted: boolean;
}

/** What Hard Mode took when the previous day closed, or null if it took nothing. */
export function yesterdayReport(s: GameState): DayReport | null {
  const day = s.profile.dayNumber - 1;
  const log = s.logs[day];
  if (!log || !log.closed) return null;
  const restarted = !!log.restart;
  if (!(log.penalty > 0) && log.decayed.length === 0 && !restarted) return null;
  return {
    day,
    lost: log.penalty,
    missed: (log.missed ?? []).map((id) => s.habits.find((h) => h.id === id)?.name ?? 'A quest'),
    decayed: log.decayed,
    restarted,
  };
}
