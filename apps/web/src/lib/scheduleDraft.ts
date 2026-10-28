import type { ScheduleInput } from '@la66/core';

export interface ScheduleDraft {
  kind: 'daily' | 'every' | 'weekdays';
  /** Days between repeats, as typed. */
  n: string;
  /** 0 = Sunday to 6 = Saturday. */
  days: number[];
}

export const EMPTY_DRAFT: ScheduleDraft = { kind: 'daily', n: '3', days: [1, 3, 5] };

export function draftToSchedule(d: ScheduleDraft): ScheduleInput | undefined {
  if (d.kind === 'every') {
    const n = Math.round(Number(d.n));
    return n >= 2 ? { kind: 'every', n: Math.min(30, n) } : undefined;
  }
  if (d.kind === 'weekdays') return d.days.length > 0 ? { kind: 'weekdays', days: d.days } : undefined;
  return undefined;
}
