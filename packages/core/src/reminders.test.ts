import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDERS,
  dueNotifications,
  minutesNow,
  parseTime,
  reminderBanner,
  reminderMessage,
  type ReminderContext,
  type ReminderSettings,
} from './reminders';

const on: ReminderSettings = {
  morning: { enabled: true, time: '08:00' },
  evening: { enabled: true, time: '20:00' },
};
const ctx = (over: Partial<ReminderContext> = {}): ReminderContext => ({
  nowMinutes: 8 * 60,
  todayKey: '2026-10-21',
  done: 0,
  total: 5,
  streak: 3,
  lastFired: {},
  ...over,
});

describe('parseTime', () => {
  it('reads HH:MM and rejects bad input', () => {
    expect(parseTime('08:00')).toBe(480);
    expect(parseTime('8:05')).toBe(485);
    expect(parseTime('23:59')).toBe(1439);
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('noon')).toBeNull();
  });
  it('reads minutes from a Date', () => {
    expect(minutesNow(new Date(2026, 9, 21, 20, 15))).toBe(1215);
  });
});

describe('dueNotifications', () => {
  it('is off by default', () => {
    expect(dueNotifications(DEFAULT_REMINDERS, ctx())).toEqual([]);
  });
  it('fires Morning Kickoff at its time when nothing is done', () => {
    expect(dueNotifications(on, ctx())).toEqual(['morning']);
    expect(dueNotifications(on, ctx({ nowMinutes: 8 * 60 + 15 }))).toEqual(['morning']);
  });
  it('does not fire before the time or after the 15 minute window', () => {
    expect(dueNotifications(on, ctx({ nowMinutes: 7 * 60 + 59 }))).toEqual([]);
    expect(dueNotifications(on, ctx({ nowMinutes: 8 * 60 + 16 }))).toEqual([]);
  });
  it('skips Morning Kickoff once a quest is done', () => {
    expect(dueNotifications(on, ctx({ done: 1 }))).toEqual([]);
  });
  it('fires Evening Review only while quests are unfinished', () => {
    expect(dueNotifications(on, ctx({ nowMinutes: 20 * 60, done: 3 }))).toEqual(['evening']);
    expect(dueNotifications(on, ctx({ nowMinutes: 20 * 60, done: 5 }))).toEqual([]);
  });
  it('fires at most once per day', () => {
    expect(dueNotifications(on, ctx({ lastFired: { morning: '2026-10-21' } }))).toEqual([]);
    expect(dueNotifications(on, ctx({ lastFired: { morning: '2026-10-20' } }))).toEqual(['morning']);
  });
  it('stays quiet with no quests or an invalid time', () => {
    expect(dueNotifications(on, ctx({ total: 0 }))).toEqual([]);
    expect(dueNotifications({ ...on, morning: { enabled: true, time: 'bad' } }, ctx())).toEqual([]);
  });
});

describe('messages and banner', () => {
  it('words the notifications', () => {
    expect(reminderMessage('morning', ctx()).title).toBe('Morning Kickoff');
    expect(reminderMessage('morning', ctx()).body).toBe('5 quests are waiting. Your 3-day streak is on the line.');
    expect(reminderMessage('morning', ctx({ streak: 0, total: 1 })).body).toBe('1 quest is waiting. Start your streak today.');
    expect(reminderMessage('evening', ctx({ done: 3 })).body).toBe('2 of 5 quests left today. Do not lose your 3-day streak.');
  });
  it('shows an evening banner after the time while quests remain', () => {
    const b = reminderBanner(on, ctx({ nowMinutes: 21 * 60, done: 2 }));
    expect(b?.kind).toBe('evening');
    expect(b?.text).toBe('3 of 5 quests left today. Keep your 3-day streak alive.');
    expect(reminderBanner(on, ctx({ nowMinutes: 21 * 60, done: 5 }))).toBeNull();
  });
  it('shows a morning banner mid-day when nothing is done', () => {
    expect(reminderBanner(on, ctx({ nowMinutes: 12 * 60 }))?.kind).toBe('morning');
    expect(reminderBanner(on, ctx({ nowMinutes: 12 * 60, done: 1 }))).toBeNull();
    expect(reminderBanner(on, ctx({ nowMinutes: 7 * 60 }))).toBeNull();
    expect(reminderBanner(DEFAULT_REMINDERS, ctx({ nowMinutes: 21 * 60 }))).toBeNull();
  });
});
