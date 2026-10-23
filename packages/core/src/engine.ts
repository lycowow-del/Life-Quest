import {
  BALANCED_DAY_MIN_STATS,
  BOSS_CHEST_XP,
  BOSS_END_DAY,
  BOSS_START_DAY,
  BOSS_XP_MULT,
  CYCLE_LENGTH,
  HARD_CYCLE_RESTART_MISSES,
  HARD_MISS_PENALTY_RATIO,
  MILESTONE_DAYS,
  MILESTONE_MIN_ACTIVE_RATIO,
  MILESTONE_RARITY,
  STAT_DECAY_INTERVAL_DAYS,
  STAT_KEYS,
  XP_VALUES,
} from './constants';
import type {
  DayLog,
  Difficulty,
  GameState,
  Habit,
  Milestone,
  Mode,
  Quest,
  QuestTargetInput,
  ScheduleInput,
  RankInfo,
  StatKey,
  StatXp,
  TimeOfDay,
  UserProfile,
} from './types';
import { formatAmount, targetAmount, targetLevel, targetScale } from './progression';
import { missedWhenDayEnds, visibleOn } from './schedule';
import {
  archetype,
  consistencyMultiplier,
  levelFromXp,
  questXp,
  rankInfo,
  statLevel,
  topStat,
  xpForStatLevel,
} from './xp';

export const cycleDay = (p: UserProfile): number => p.dayNumber - p.cycleStartDay + 1;

export const isBossWeek = (p: UserProfile): boolean =>
  !!p.bossStat && cycleDay(p) >= BOSS_START_DAY && cycleDay(p) <= BOSS_END_DAY;

/** True if every boss-stat quest was completed on every boss-week day of the current cycle. */
export function bossCleared(state: GameState): boolean {
  const p = state.profile;
  if (!p.bossStat) return false;
  const first = p.cycleStartDay + BOSS_START_DAY - 1;
  const last = p.cycleStartDay + BOSS_END_DAY - 1;
  let any = false;
  for (let d = first; d <= last; d++) {
    const done = new Set((state.logs[d]?.completions ?? []).map((c) => c.habitId));
    for (const h of visibleOn(state, d)) {
      if (h.stat !== p.bossStat || h.createdOnDay > first) continue;
      if (!done.has(h.id)) return false;
      any = true;
    }
  }
  return any;
}

export const getLog = (state: GameState, day: number): DayLog =>
  state.logs[day] ?? { day, completions: [], penalty: 0, decayed: [], closed: false };

export function createInitialState(
  opts: { name?: string; mode?: Mode; startDay?: number; startWeekday?: number } = {},
): GameState {
  const startDay = opts.startDay ?? 1;
  const zero = (): StatXp => ({ STR: 0, INT: 0, FOC: 0, DIS: 0, WIS: 0 });
  const lastStatDay = zero();
  for (const k of STAT_KEYS) lastStatDay[k] = startDay;
  return {
    profile: {
      name: opts.name ?? 'Hunter',
      mode: opts.mode ?? 'standard',
      totalXp: 0,
      statXp: zero(),
      streak: 0,
      bestStreak: 0,
      dayNumber: startDay,
      cycle: 1,
      cycleStartDay: startDay,
      completedCycles: 0,
      consecutiveMissedDays: 0,
      lastStatDay,
      bossStat: null,
      bossChestClaimedCycle: 0,
      startWeekday: opts.startWeekday ?? 0,
    },
    habits: [],
    logs: {},
    milestones: [],
  };
}

export function addHabit(
  state: GameState,
  input: { name: string; stat: StatKey; difficulty: Difficulty; timeOfDay: TimeOfDay; id?: string; activeFromDay?: number; target?: QuestTargetInput; schedule?: ScheduleInput },
): GameState {
  const createdOn = input.activeFromDay ?? state.profile.dayNumber;
  const sched = input.schedule;
  const habit: Habit = {
    id: input.id ?? `h${state.habits.length + 1}`,
    name: input.name,
    stat: input.stat,
    difficulty: input.difficulty,
    timeOfDay: input.timeOfDay,
    createdOnDay: createdOn,
    archived: false,
    ...(input.target ? { target: { ...input.target, completions: 0 } } : {}),
    ...(sched?.kind === 'every'
      ? { schedule: { kind: 'every' as const, n: Math.max(2, Math.round(sched.n)), anchor: sched.anchor ?? createdOn } }
      : sched?.kind === 'weekdays' && sched.days.length > 0
        ? { schedule: { kind: 'weekdays' as const, days: [...new Set(sched.days)].sort((a, b) => a - b) } }
        : {}),
  };
  return { ...state, habits: [...state.habits, habit] };
}

export const archiveHabit = (state: GameState, id: string): GameState => ({
  ...state,
  habits: state.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
});

export const setMode = (state: GameState, mode: Mode): GameState => ({
  ...state,
  profile: { ...state.profile, mode },
});

export interface CompleteResult {
  state: GameState;
  ok: boolean;
  reason?: 'unknown_habit' | 'already_completed' | 'not_due';
  xpGained: number;
  multiplier: number;
  balancedDay: boolean;
  leveledUp: boolean;
  newLevel: number;
  /** True on any promotion, including a division. */
  rankedUp: boolean;
  /** True when the promotion enters a new tier. */
  tierUp: boolean;
  newRank: RankInfo;
  newMilestones: Milestone[];
  /** Set when this completion raised a measurable quest to its next level. */
  questLevelUp: { habitId: string; name: string; label: string; level: number } | null;
}

export function completeQuest(state: GameState, habitId: string): CompleteResult {
  const p = state.profile;
  const fail = (reason: CompleteResult['reason']): CompleteResult => ({
    state,
    ok: false,
    reason,
    xpGained: 0,
    multiplier: consistencyMultiplier(p.streak),
    balancedDay: false,
    leveledUp: false,
    newLevel: levelFromXp(p.totalXp),
    rankedUp: false,
    tierUp: false,
    newRank: rankInfo(p.totalXp),
    newMilestones: [],
    questLevelUp: null,
  });

  const habit = state.habits.find((h) => h.id === habitId && !h.archived && h.createdOnDay <= p.dayNumber);
  if (!habit) return fail('unknown_habit');
  if (!visibleOn(state, p.dayNumber).some((h) => h.id === habitId)) return fail('not_due');
  const day = p.dayNumber;
  const log = getLog(state, day);
  if (log.completions.some((c) => c.habitId === habitId)) return fail('already_completed');

  // First completion of the day extends the streak, and that new streak sets the multiplier.
  const streak = log.completions.length === 0 ? p.streak + 1 : p.streak;
  const stats = new Set<StatKey>([...log.completions.map((c) => c.stat), habit.stat]);
  const balanced = stats.size >= BALANCED_DAY_MIN_STATS;
  const boss = isBossWeek(p) && p.bossStat === habit.stat;
  const scale = habit.target ? targetScale(habit.target) : 1;
  const xp = questXp(habit.difficulty, streak, balanced, boss ? BOSS_XP_MULT : 1, scale);
  let updatedHabit = habit;
  let questLevelUp: CompleteResult['questLevelUp'] = null;
  if (habit.target && !habit.target.frozen) {
    const t = { ...habit.target, completions: habit.target.completions + 1 };
    updatedHabit = { ...habit, target: t };
    if (targetLevel(t) > targetLevel(habit.target)) {
      questLevelUp = { habitId, name: habit.name, label: formatAmount(targetAmount(t), t.unit), level: targetLevel(t) };
    }
  }
  const receipt: Quest = {
    habitId,
    day,
    stat: habit.stat,
    xp,
    multiplier: consistencyMultiplier(streak),
    balancedBonus: balanced,
    boss,
    ...(scale !== 1 ? { scale } : {}),
  };

  const next: GameState = {
    ...state,
    habits: state.habits.map((h) => (h.id === habitId ? updatedHabit : h)),
    profile: {
      ...p,
      totalXp: p.totalXp + xp,
      statXp: { ...p.statXp, [habit.stat]: p.statXp[habit.stat] + xp },
      streak,
      bestStreak: Math.max(p.bestStreak, streak),
      consecutiveMissedDays: 0,
      lastStatDay: { ...p.lastStatDay, [habit.stat]: day },
    },
    logs: { ...state.logs, [day]: { ...log, completions: [...log.completions, receipt] } },
  };
  const { state: finalState, unlocked } = checkMilestones(next);
  const oldLevel = levelFromXp(p.totalXp);
  const newLevel = levelFromXp(finalState.profile.totalXp);
  const oldRank = rankInfo(p.totalXp);
  const newRank = rankInfo(finalState.profile.totalXp);
  return {
    state: finalState,
    ok: true,
    xpGained: xp,
    multiplier: receipt.multiplier,
    balancedDay: balanced,
    leveledUp: newLevel > oldLevel,
    newLevel,
    rankedUp: newRank.step > oldRank.step,
    tierUp: newRank.tierIndex > oldRank.tierIndex,
    newRank,
    newMilestones: unlocked,
    questLevelUp,
  };
}

/** Unlocks skill cards once the cycle day is reached and enough days were active. */
export function checkMilestones(state: GameState): { state: GameState; unlocked: Milestone[] } {
  const p = state.profile;
  const cd = cycleDay(p);
  let active = 0;
  for (let d = p.cycleStartDay; d <= p.dayNumber; d++) {
    if ((state.logs[d]?.completions.length ?? 0) > 0 || state.logs[d]?.rest) active++;
  }
  const unlocked: Milestone[] = [];
  for (const day of MILESTONE_DAYS) {
    const id = `c${p.cycle}-d${day}`;
    if (state.milestones.some((m) => m.id === id)) continue;
    if (cd >= day && active >= Math.ceil(day * MILESTONE_MIN_ACTIVE_RATIO)) {
      unlocked.push({
        id,
        day,
        cycle: p.cycle,
        rarity: MILESTONE_RARITY[day],
        unlockedOnDay: p.dayNumber,
        archetype: archetype(p.statXp),
        topStat: topStat(p.statXp),
      });
    }
  }
  return unlocked.length
    ? { state: { ...state, milestones: [...state.milestones, ...unlocked] }, unlocked }
    : { state, unlocked };
}

/** Hard Mode: a stat untouched for 5, 10, 15... days loses one level. */
export function applyStatDecay(
  statXp: StatXp,
  lastStatDay: Record<StatKey, number>,
  day: number,
): { statXp: StatXp; decayed: StatKey[] } {
  const out = { ...statXp };
  const decayed: StatKey[] = [];
  for (const k of STAT_KEYS) {
    const gap = day - lastStatDay[k];
    const lvl = statLevel(out[k]);
    if (gap > 0 && gap % STAT_DECAY_INTERVAL_DAYS === 0 && lvl > 0) {
      out[k] = xpForStatLevel(lvl - 1);
      decayed.push(k);
    }
  }
  return { statXp: out, decayed };
}

/** Closes the current day: penalties, streak, decay, milestones, then rolls to the next day. */
export function endDay(state: GameState): GameState {
  const p0 = state.profile;
  const day = p0.dayNumber;
  const log = getLog(state, day);
  const hard = p0.mode === 'hard';
  const doneIds = new Set(log.completions.map((c) => c.habitId));
  let statXp: StatXp = { ...p0.statXp };
  let totalXp = p0.totalXp;
  let penalty = 0;

  if (hard) {
    for (const h of state.habits) {
      if (!missedWhenDayEnds(state, h, day, doneIds.has(h.id))) continue;
      const pen = Math.round(XP_VALUES[h.difficulty] * HARD_MISS_PENALTY_RATIO);
      const taken = Math.min(pen, totalXp);
      totalXp -= taken;
      penalty += taken;
      statXp[h.stat] = Math.max(0, statXp[h.stat] - pen);
    }
  }
  let decayed: StatKey[] = [];
  if (hard) {
    const r = applyStatDecay(statXp, p0.lastStatDay, day);
    statXp = r.statXp;
    decayed = r.decayed;
  }

  // Boss chest: paid when the last boss-week day closes, once per cycle.
  let chest = 0;
  if (
    p0.bossStat &&
    cycleDay(p0) === BOSS_END_DAY &&
    p0.bossChestClaimedCycle !== p0.cycle &&
    bossCleared(state)
  ) {
    chest = BOSS_CHEST_XP;
    totalXp += chest;
    statXp[p0.bossStat] += chest;
  }

  // A day with quests but none due is a rest day: it never breaks the streak or counts as missed.
  const rest = visibleOn(state, day).length === 0 && state.habits.some((h) => !h.archived && h.createdOnDay <= day);
  const active = log.completions.length > 0;
  const missed = active ? 0 : rest ? p0.consecutiveMissedDays : p0.consecutiveMissedDays + 1;
  const closed: GameState = {
    ...state,
    profile: {
      ...p0,
      totalXp,
      statXp,
      streak: active || rest ? p0.streak : 0,
      consecutiveMissedDays: missed,
      bossChestClaimedCycle: chest ? p0.cycle : (p0.bossChestClaimedCycle ?? 0),
    },
    logs: { ...state.logs, [day]: { ...log, penalty, decayed, ...(chest ? { chest } : {}), ...(rest ? { rest: true } : {}), closed: true } },
  };
  const next = checkMilestones(closed).state;
  const np = next.profile;

  let { cycle, cycleStartDay, completedCycles, streak, consecutiveMissedDays } = np;
  if (hard && missed >= HARD_CYCLE_RESTART_MISSES) {
    cycle += 1;
    cycleStartDay = day + 1;
    streak = 0;
    consecutiveMissedDays = 0;
  } else if (cycleDay(np) >= CYCLE_LENGTH) {
    completedCycles += 1;
    cycle += 1;
    cycleStartDay = day + 1;
  }
  return {
    ...next,
    profile: { ...np, dayNumber: day + 1, cycle, cycleStartDay, completedCycles, streak, consecutiveMissedDays },
  };
}

export function advanceDays(state: GameState, days: number): GameState {
  let s = state;
  for (let i = 0; i < days; i++) s = endDay(s);
  return s;
}
