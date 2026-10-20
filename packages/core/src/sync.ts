import { advanceDays } from './engine';
import { dayNumberForDate } from './dates';
import type { GameState } from './types';

export const MAX_CATCHUP_DAYS = 3650;

/**
 * Brings the game up to today. Every elapsed day is closed in order, so missed days
 * reset streaks and trigger Hard Mode penalties. Returns the same object if nothing changed
 * (also when the device clock moved backwards).
 */
export function syncToDate(state: GameState, startDateKey: string, todayKey: string): GameState {
  const gap = dayNumberForDate(startDateKey, todayKey) - state.profile.dayNumber;
  if (gap <= 0) return state;
  return advanceDays(state, Math.min(gap, MAX_CATCHUP_DAYS));
}
