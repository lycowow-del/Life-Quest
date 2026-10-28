import { create } from 'zustand';
import {
  DEFAULT_REMINDERS,
  parseTime,
  type ReminderKind,
  type ReminderSetting,
  type ReminderSettings,
} from '@la66/core';

const KEY = 'lq:settings';

interface Persisted {
  reminders: ReminderSettings;
  /** The day (YYYY-MM-DD) each reminder last fired, so it sends once per day. */
  lastFired: Partial<Record<ReminderKind, string>>;
  sound: boolean;
  vibrate: boolean;
  /** Day of the Hard Mode report the player dismissed. */
  reportDay: number;
}

const DEFAULTS: Persisted = { reminders: DEFAULT_REMINDERS, lastFired: {}, sound: true, vibrate: true, reportDay: 0 };

function cleanReminder(v: unknown, fallback: ReminderSetting): ReminderSetting {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  return {
    enabled: typeof o.enabled === 'boolean' ? o.enabled : fallback.enabled,
    time: typeof o.time === 'string' && parseTime(o.time) !== null ? o.time : fallback.time,
  };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const r = (typeof p.reminders === 'object' && p.reminders !== null ? p.reminders : {}) as Record<string, unknown>;
    const lf = (typeof p.lastFired === 'object' && p.lastFired !== null ? p.lastFired : {}) as Record<string, unknown>;
    return {
      reminders: {
        morning: cleanReminder(r.morning, DEFAULT_REMINDERS.morning),
        evening: cleanReminder(r.evening, DEFAULT_REMINDERS.evening),
      },
      lastFired: {
        ...(typeof lf.morning === 'string' ? { morning: lf.morning } : {}),
        ...(typeof lf.evening === 'string' ? { evening: lf.evening } : {}),
      },
      sound: typeof p.sound === 'boolean' ? p.sound : true,
      vibrate: typeof p.vibrate === 'boolean' ? p.vibrate : true,
      reportDay: typeof p.reportDay === 'number' ? p.reportDay : 0,
    };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsStore extends Persisted {
  setReminder: (kind: ReminderKind, patch: Partial<ReminderSetting>) => void;
  markFired: (kind: ReminderKind, dayKey: string) => void;
  setSound: (on: boolean) => void;
  setVibrate: (on: boolean) => void;
  dismissReport: (day: number) => void;
}

export const useSettings = create<SettingsStore>()((set, get) => {
  const commit = (patch: Partial<Persisted>): void => {
    set(patch);
    const { reminders, lastFired, sound, vibrate, reportDay } = get();
    try {
      localStorage.setItem(KEY, JSON.stringify({ reminders, lastFired, sound, vibrate, reportDay }));
    } catch {
      /* storage can be unavailable; settings then last for this session only */
    }
  };
  return {
    ...load(),
    setReminder: (kind, patch) =>
      commit({ reminders: { ...get().reminders, [kind]: { ...get().reminders[kind], ...patch } } }),
    markFired: (kind, dayKey) => commit({ lastFired: { ...get().lastFired, [kind]: dayKey } }),
    setSound: (on) => commit({ sound: on }),
    setVibrate: (on) => commit({ vibrate: on }),
    dismissReport: (day) => commit({ reportDay: day }),
  };
});
