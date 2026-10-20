import { TIER_NAMES, type StatKey, type Tier, type TimeOfDay } from '@la66/core';
import { TIER_COLORS } from './pixel/palette';

export const STAT_META: Record<StatKey, { label: string; color: string }> = {
  STR: { label: 'Strength', color: '#FFB38A' },
  INT: { label: 'Intel', color: '#A8E6FF' },
  FOC: { label: 'Focus', color: '#C9B6FF' },
  DIS: { label: 'Discipline', color: '#FFE08A' },
  WIS: { label: 'Wisdom', color: '#FFB3E6' },
};

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export const TIER_COLOR = Object.fromEntries(
  TIER_NAMES.map((name, i) => [name, TIER_COLORS[i]!.base]),
) as Record<Tier, string>;
