import { BOSS_END_DAY, BOSS_START_DAY, CYCLE_LENGTH, MILESTONE_DAYS } from './constants';
import { visibleOn } from './schedule';
import type { GameState } from './types';

export type HeatKind = 'complete' | 'partial' | 'missed' | 'rest' | 'today' | 'future' | 'none';

export interface HeatCell {
  /** Absolute game day. */
  day: number;
  /** 1 to 66 within the current cycle. */
  cycleDay: number;
  kind: HeatKind;
  done: number;
  due: number;
  /** Falls in boss week (cycle days 15 to 21). */
  boss: boolean;
  /** A skill card day (7, 21, 30, 66). */
  milestone: boolean;
}

/** One cell for each of the 66 days of the current cycle. */
export function cycleHeatmap(s: GameState): HeatCell[] {
  const p = s.profile;
  const cells: HeatCell[] = [];
  for (let i = 1; i <= CYCLE_LENGTH; i++) {
    const day = p.cycleStartDay + i - 1;
    const base = {
      day,
      cycleDay: i,
      boss: i >= BOSS_START_DAY && i <= BOSS_END_DAY,
      milestone: (MILESTONE_DAYS as readonly number[]).includes(i),
    };
    if (day > p.dayNumber) {
      cells.push({ ...base, kind: 'future', done: 0, due: 0 });
      continue;
    }
    const log = s.logs[day];
    const done = log?.completions.length ?? 0;
    const due = visibleOn(s, day).length;
    if (day === p.dayNumber) cells.push({ ...base, kind: 'today', done, due });
    else if (!log) cells.push({ ...base, kind: 'none', done: 0, due });
    else if (log.rest) cells.push({ ...base, kind: 'rest', done, due });
    else if (done === 0) cells.push({ ...base, kind: 'missed', done, due });
    else cells.push({ ...base, kind: done >= due ? 'complete' : 'partial', done, due });
  }
  return cells;
}

export interface CycleStats {
  complete: number;
  partial: number;
  missed: number;
  rest: number;
  /** Share of finished non-rest days that were fully completed, 0 to 1, or null before any day has closed. */
  rate: number | null;
}

export function cycleStats(cells: readonly HeatCell[]): CycleStats {
  const count = (k: HeatKind): number => cells.filter((c) => c.kind === k).length;
  const complete = count('complete');
  const partial = count('partial');
  const missed = count('missed');
  const played = complete + partial + missed;
  return { complete, partial, missed, rest: count('rest'), rate: played ? complete / played : null };
}

export interface LifetimeTotals {
  questsCompleted: number;
  activeDays: number;
  focusMinutes: number;
  focusSessions: number;
  journalDays: number;
  moodDays: number;
  bestStreak: number;
  cyclesCompleted: number;
  skillCards: number;
}

export function lifetimeTotals(s: GameState): LifetimeTotals {
  let questsCompleted = 0;
  let activeDays = 0;
  for (const log of Object.values(s.logs)) {
    questsCompleted += log.completions.length;
    if (log.completions.length > 0) activeDays++;
  }
  let focusMinutes = 0;
  let focusSessions = 0;
  for (const f of Object.values(s.focus ?? {})) {
    focusMinutes += f.minutes;
    focusSessions += f.sessions;
  }
  const entries = Object.values(s.journal ?? {});
  return {
    questsCompleted,
    activeDays,
    focusMinutes,
    focusSessions,
    journalDays: entries.filter((e) => (e.text && e.text.trim()) || e.photoIds?.length).length,
    moodDays: entries.filter((e) => e.mood !== undefined).length,
    bestStreak: s.profile.bestStreak,
    cyclesCompleted: s.profile.completedCycles,
    skillCards: s.milestones.length,
  };
}
