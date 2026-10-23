import {
  FOCUS_DAILY_XP_CAP,
  FOCUS_MIN_MINUTES,
  FOCUS_XP_PER_MIN,
  JOURNAL_MAX_CHARS,
  JOURNAL_MAX_PHOTOS,
  JOURNAL_MIN_CHARS,
  JOURNAL_XP,
  MOOD_XP,
} from './constants';
import { targetAmount } from './progression';
import { grantXp, type Reward } from './reward';
import { activeHabits, completedToday } from './selectors';
import type { FocusDay, GameState, Habit, JournalEntry, Mood } from './types';
import { consistencyMultiplier } from './xp';

export const todayJournal = (s: GameState): JournalEntry | undefined => s.journal?.[s.profile.dayNumber];
export const todayFocus = (s: GameState): FocusDay => s.focus?.[s.profile.dayNumber] ?? { sessions: 0, minutes: 0, baseXp: 0 };

/** Base XP for one session, limited by what is left of today's cap. */
export function focusSessionBaseXp(minutes: number, alreadyToday: number): number {
  if (minutes < FOCUS_MIN_MINUTES) return 0;
  return Math.max(0, Math.min(Math.round(minutes * FOCUS_XP_PER_MIN), FOCUS_DAILY_XP_CAP - alreadyToday));
}

/** Records a finished focus session and pays Focus XP. Sessions under 10 minutes are ignored. */
export function completeFocusSession(state: GameState, minutes: number): { state: GameState; reward: Reward | null } {
  const m = Math.round(minutes);
  if (m < FOCUS_MIN_MINUTES) return { state, reward: null };
  const day = state.profile.dayNumber;
  const f = todayFocus(state);
  const base = focusSessionBaseXp(m, f.baseXp);
  const logged: GameState = {
    ...state,
    focus: { ...(state.focus ?? {}), [day]: { sessions: f.sessions + 1, minutes: f.minutes + m, baseXp: f.baseXp + base } },
  };
  const xp = Math.round(base * consistencyMultiplier(state.profile.streak));
  if (xp <= 0) return { state: logged, reward: null };
  return grantXp(logged, 'FOC', xp);
}

const withEntry = (s: GameState, entry: JournalEntry): GameState => ({
  ...s,
  journal: { ...(s.journal ?? {}), [entry.day]: entry },
});

/** Sets today's mood. The first mood of the day pays a little Wisdom XP. */
export function logMood(state: GameState, mood: Mood): { state: GameState; reward: Reward | null } {
  const day = state.profile.dayNumber;
  const entry: JournalEntry = { ...(todayJournal(state) ?? { day }), day, mood };
  if (entry.moodPaid) return { state: withEntry(state, entry), reward: null };
  const paid = withEntry(state, { ...entry, moodPaid: true });
  return grantXp(paid, 'WIS', Math.round(MOOD_XP * consistencyMultiplier(state.profile.streak)));
}

/**
 * Saves today's journal. An entry of 20 or more characters, or a photo of a paper page, pays Wisdom XP
 * once per day. Later edits are free.
 */
export function saveJournalEntry(
  state: GameState,
  text: string,
  photoIds: readonly string[],
): { state: GameState; reward: Reward | null } {
  const day = state.profile.dayNumber;
  const prev = todayJournal(state) ?? { day };
  const clean = text.slice(0, JOURNAL_MAX_CHARS);
  const photos = photoIds.slice(0, JOURNAL_MAX_PHOTOS);
  const { text: _t, photoIds: _p, ...rest } = prev;
  const entry: JournalEntry = {
    ...rest,
    day,
    ...(clean.trim() ? { text: clean } : {}),
    ...(photos.length ? { photoIds: photos } : {}),
  };
  const qualifies = clean.trim().length >= JOURNAL_MIN_CHARS || photos.length > 0;
  if (!qualifies || entry.journalPaid) return { state: withEntry(state, entry), reward: null };
  const paid = withEntry(state, { ...entry, journalPaid: true });
  return grantXp(paid, 'WIS', Math.round(JOURNAL_XP * consistencyMultiplier(state.profile.streak)));
}

/** The unfinished focus quest measured in minutes, so the timer can offer to complete it. */
export function focusQuest(state: GameState): Habit | null {
  const done = completedToday(state);
  return activeHabits(state).find((h) => h.stat === 'FOC' && h.target?.unit === 'min' && !done.has(h.id)) ?? null;
}

/** Session length suggested by the focus quest's current target, or 25 minutes. */
export function suggestedFocusMinutes(state: GameState): number {
  const h = focusQuest(state);
  return h?.target ? Math.max(FOCUS_MIN_MINUTES, Math.min(120, targetAmount(h.target))) : 25;
}
