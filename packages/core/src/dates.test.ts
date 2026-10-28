import { describe, expect, it } from 'vitest';
import { addDaysToKey, dayNumberForDate, daysBetween, isDateKey, toDateKey } from './dates';

describe('dates', () => {
  it('formats local dates', () => {
    expect(toDateKey(new Date(2026, 9, 20))).toBe('2026-10-20');
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('counts days across month and leap boundaries', () => {
    expect(daysBetween('2026-10-20', '2026-10-20')).toBe(0);
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-10-20', '2026-10-18')).toBe(-2);
  });
  it('adds days to a key', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('maps dates to day numbers', () => {
    expect(dayNumberForDate('2026-10-20', '2026-10-20')).toBe(1);
    expect(dayNumberForDate('2026-10-20', '2026-10-26')).toBe(7);
  });
  it('validates keys', () => {
    expect(isDateKey('2026-10-20')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('20/10/2026')).toBe(false);
    expect(isDateKey(5)).toBe(false);
  });
});
