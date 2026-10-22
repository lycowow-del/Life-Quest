import { useEffect, useRef } from 'react';
import {
  dueNotifications,
  minutesNow,
  reminderMessage,
  toDateKey,
  todayProgress,
  type GameState,
  type ReminderContext,
} from '@la66/core';
import { useSettings } from '../store/settingsStore';
import { showNotification } from './notify';

export function contextFor(state: GameState, now: Date, lastFired: ReminderContext['lastFired']): ReminderContext {
  const progress = todayProgress(state);
  return {
    nowMinutes: minutesNow(now),
    todayKey: toDateKey(now),
    done: progress.done,
    total: progress.total,
    streak: state.profile.streak,
    lastFired,
  };
}

/**
 * Sends Morning Kickoff and Evening Review while the app is running. A phone cannot wake a closed
 * web app, so a reminder whose time passed while the app was closed shows as an in-app banner instead.
 */
export function useReminders(state: GameState): void {
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    const check = (): void => {
      const { reminders, lastFired, markFired } = useSettings.getState();
      const ctx = contextFor(latest.current, new Date(), lastFired);
      for (const kind of dueNotifications(reminders, ctx)) {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') continue;
        markFired(kind, ctx.todayKey);
        const m = reminderMessage(kind, ctx);
        void showNotification(m.title, m.body, kind);
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
