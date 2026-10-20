import type { Rank, StatKey, TimeOfDay } from '@la66/core';

export const STAT_META: Record<StatKey, { label: string; color: string }> = {
  STR: { label: 'Strength', color: '#F97316' },
  INT: { label: 'Intel', color: '#06B6D4' },
  FOC: { label: 'Focus', color: '#8B5CF6' },
  DIS: { label: 'Discipline', color: '#EAB308' },
  WIS: { label: 'Wisdom', color: '#EC4899' },
};

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export const RANK_COLOR: Record<Rank, string> = {
  E: '#64748B',
  D: '#06B6D4',
  C: '#10B981',
  B: '#8B5CF6',
  A: '#F59E0B',
  S: '#F472B6',
};
