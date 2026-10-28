export type ReminderKind = 'morning' | 'evening';
export interface ReminderSetting {
  enabled: boolean;
  /** 24-hour "HH:MM". */
  time: string;
}
export type ReminderSettings = Record<ReminderKind, ReminderSetting>;

export const DEFAULT_REMINDERS: ReminderSettings = {
  morning: { enabled: false, time: '08:00' },
  evening: { enabled: false, time: '20:00' },
};

/** A system notification is only sent within this many minutes after the set time. Later, the in-app banner takes over. */
export const REMINDER_NOTIFY_WINDOW_MIN = 15;

const KINDS: ReminderKind[] = ['morning', 'evening'];

/** "HH:MM" to minutes since midnight, or null if invalid. */
export function parseTime(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? h * 60 + min : null;
}

export const minutesNow = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export interface ReminderContext {
  nowMinutes: number;
  todayKey: string;
  /** Quests completed today and quests available today. */
  done: number;
  total: number;
  streak: number;
  lastFired: Partial<Record<ReminderKind, string>>;
}

/**
 * Reminders that should be sent as a system notification right now. Morning Kickoff needs nothing
 * done yet today; Evening Review needs unfinished quests. Each fires at most once per day.
 */
export function dueNotifications(s: ReminderSettings, ctx: ReminderContext): ReminderKind[] {
  const out: ReminderKind[] = [];
  for (const kind of KINDS) {
    const cfg = s[kind];
    const t = parseTime(cfg.time);
    if (!cfg.enabled || t === null || ctx.total === 0) continue;
    if (ctx.lastFired[kind] === ctx.todayKey) continue;
    if (ctx.nowMinutes < t || ctx.nowMinutes - t > REMINDER_NOTIFY_WINDOW_MIN) continue;
    const needed = kind === 'morning' ? ctx.done === 0 : ctx.done < ctx.total;
    if (needed) out.push(kind);
  }
  return out;
}

export function reminderMessage(kind: ReminderKind, ctx: ReminderContext): { title: string; body: string } {
  const left = ctx.total - ctx.done;
  if (kind === 'morning') {
    return {
      title: 'Morning Kickoff',
      body: `${ctx.total} ${ctx.total === 1 ? 'quest is' : 'quests are'} waiting. ${
        ctx.streak > 0 ? `Your ${ctx.streak}-day streak is on the line.` : 'Start your streak today.'
      }`,
    };
  }
  return {
    title: 'Evening Review',
    body: `${left} of ${ctx.total} ${ctx.total === 1 ? 'quest' : 'quests'} left today.${
      ctx.streak > 0 ? ` Do not lose your ${ctx.streak}-day streak.` : ''
    }`,
  };
}

/**
 * In-app banner for when the time has passed (for example the app was closed at reminder time).
 * Evening takes priority over morning. Returns null when nothing needs attention.
 */
export function reminderBanner(
  s: ReminderSettings,
  ctx: ReminderContext,
): { kind: ReminderKind; text: string } | null {
  if (ctx.total === 0) return null;
  const evening = parseTime(s.evening.time);
  if (s.evening.enabled && evening !== null && ctx.nowMinutes >= evening && ctx.done < ctx.total) {
    const left = ctx.total - ctx.done;
    return {
      kind: 'evening',
      text: `${left} of ${ctx.total} ${ctx.total === 1 ? 'quest' : 'quests'} left today.${
        ctx.streak > 0 ? ` Keep your ${ctx.streak}-day streak alive.` : ''
      }`,
    };
  }
  const morning = parseTime(s.morning.time);
  if (s.morning.enabled && morning !== null && ctx.nowMinutes >= morning && ctx.done === 0) {
    return { kind: 'morning', text: `${ctx.total} ${ctx.total === 1 ? 'quest is' : 'quests are'} waiting. Start with one.` };
  }
  return null;
}
