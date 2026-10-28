import { PROGRESSION_DAYS, PROGRESSION_GROWTH, PROGRESSION_MAX_LEVEL } from './constants';
import type { GameState, Habit, QuestTarget, QuestTargetInput, TargetUnit } from './types';

const roundTo = (x: number, step: number): number => Math.max(step, Math.round(x / step) * step);

/** Amount at a given level, e.g. 60 min becomes 75, 95, 120. */
export const amountAtLevel = (t: QuestTargetInput, level: number): number =>
  roundTo(t.base * Math.pow(PROGRESSION_GROWTH, level), t.round);

/** Highest level whose amount stays within the quest's max. */
export function maxLevelFor(t: QuestTargetInput): number {
  let level = PROGRESSION_MAX_LEVEL;
  while (level > 0 && t.max !== undefined && amountAtLevel(t, level) > t.max) level--;
  return level;
}

/** Every PROGRESSION_DAYS completed days is one level, up to the cap. Missed days only pause it. */
export const targetLevel = (t: QuestTarget): number =>
  Math.min(maxLevelFor(t), Math.floor(t.completions / PROGRESSION_DAYS));

export const targetAmount = (t: QuestTarget): number => amountAtLevel(t, targetLevel(t));

/** XP multiplier from the target level: 1, 1.25, 1.5625, 1.953. */
export const targetScale = (t: QuestTarget): number => Math.pow(PROGRESSION_GROWTH, targetLevel(t));

/** Completed days until the next level, or null at the cap or when frozen. */
export function daysToNextLevel(t: QuestTarget): number | null {
  const level = targetLevel(t);
  if (t.frozen || level >= maxLevelFor(t)) return null;
  return (level + 1) * PROGRESSION_DAYS - t.completions;
}

const group = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function formatAmount(amount: number, unit: TargetUnit): string {
  if (unit === 'min') {
    if (amount < 60) return `${amount} min`;
    const h = Math.floor(amount / 60);
    const m = amount % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  if (unit === 'steps') return `${group(amount)} steps`;
  return `${amount} ${amount === 1 ? unit.slice(0, -1) : unit}`;
}

/** Quest name with its current target, e.g. "Deep work · 1 h 15 min". */
export const questLabel = (h: Habit): string =>
  h.target ? `${h.name} · ${formatAmount(targetAmount(h.target), h.target.unit)}` : h.name;

/** Builds a target for a player-made quest. Rounds sensibly and caps growth at 2x. */
export function customTarget(amount: number, unit: TargetUnit): QuestTargetInput | undefined {
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const base = Math.round(amount);
  const round = unit === 'steps' ? 500 : unit === 'min' && base >= 20 ? 5 : 1;
  return { base, unit, round, max: base * 2 };
}

/** Stops or resumes a quest's growth. Progress so far is kept. */
export const setProgressionFrozen = (state: GameState, habitId: string, frozen: boolean): GameState => ({
  ...state,
  habits: state.habits.map((h) => (h.id === habitId && h.target ? { ...h, target: { ...h.target, frozen } } : h)),
});
