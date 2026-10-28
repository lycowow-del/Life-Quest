import type { GameState, Habit, Schedule } from './types';

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const completedOn = (s: GameState, day: number, id: string): boolean =>
  (s.logs[day]?.completions ?? []).some((c) => c.habitId === id);

/** Weekday (0 = Sunday) of a game day, given the weekday of day 1. */
export const weekdayOfDay = (startWeekday: number, day: number): number => (((startWeekday + day - 1) % 7) + 7) % 7;

/** Whether the quest is due on this game day (before any grace day). Quests without a schedule are due daily. */
export function isDueOn(h: Habit, day: number, startWeekday: number): boolean {
  if (h.createdOnDay > day) return false;
  const s = h.schedule;
  if (!s) return true;
  if (s.kind === 'every') return day >= s.anchor && (day - s.anchor) % s.n === 0;
  return s.days.includes(weekdayOfDay(startWeekday, day));
}

/**
 * The one extra day a missed routine quest stays open. It only applies when the next day is not itself
 * a due day, because one completion a day cannot cover two due days.
 */
export function inGraceOn(s: GameState, h: Habit, day: number): boolean {
  if (!h.schedule) return false;
  const sw = s.profile.startWeekday ?? 0;
  return isDueOn(h, day - 1, sw) && !isDueOn(h, day, sw) && !completedOn(s, day - 1, h.id);
}

/** Quests the player can see and do on a day: due, or on their grace day. */
export function visibleOn(s: GameState, day: number): Habit[] {
  const sw = s.profile.startWeekday ?? 0;
  return s.habits.filter((h) => !h.archived && h.createdOnDay <= day && (isDueOn(h, day, sw) || inGraceOn(s, h, day)));
}

/** Whether leaving this quest undone now would make it missed when the day closes. */
export function missedWhenDayEnds(s: GameState, h: Habit, day: number, doneToday: boolean): boolean {
  if (h.archived || h.createdOnDay > day || doneToday) return false;
  if (!h.schedule) return true;
  const sw = s.profile.startWeekday ?? 0;
  if (isDueOn(h, day, sw)) return isDueOn(h, day + 1, sw);
  return inGraceOn(s, h, day);
}

export function describeSchedule(sc: Schedule): string {
  if (sc.kind === 'every') return `Every ${sc.n} days`;
  if (sc.days.length === 7) return 'Every day';
  return sc.days.map((d) => WEEKDAY_SHORT[d]).join(' · ');
}

/** A short note for a routine quest on today's list. */
export function dueNote(s: GameState, h: Habit): string | null {
  if (!h.schedule) return null;
  return inGraceOn(s, h, s.profile.dayNumber) ? 'Due yesterday: last chance today' : describeSchedule(h.schedule);
}

/** Routine quests that are not on today's list, with how many days until each is due. */
export function upcomingRoutine(s: GameState): { habit: Habit; inDays: number }[] {
  const day = s.profile.dayNumber;
  const sw = s.profile.startWeekday ?? 0;
  const out: { habit: Habit; inDays: number }[] = [];
  const shown = new Set(visibleOn(s, day).map((h) => h.id));
  for (const h of s.habits) {
    if (h.archived || !h.schedule || h.createdOnDay > day || shown.has(h.id)) continue;
    for (let d = day + 1; d <= day + 30; d++) {
      if (isDueOn(h, d, sw)) {
        out.push({ habit: h, inDays: d - day });
        break;
      }
    }
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}
