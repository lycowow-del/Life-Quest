import type { Difficulty, MilestoneDay, Rank, Rarity, StatKey } from './types';

// All balance knobs live here. Rebalance the economy without touching any logic.
export const STAT_KEYS: readonly StatKey[] = ['STR', 'INT', 'FOC', 'DIS', 'WIS'];
export const XP_VALUES: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };

export const RANKS: readonly { rank: Rank; minXp: number }[] = [
  { rank: 'E', minXp: 0 },
  { rank: 'D', minXp: 500 },
  { rank: 'C', minXp: 1500 },
  { rank: 'B', minXp: 3500 },
  { rank: 'A', minXp: 7000 },
  { rank: 'S', minXp: 12000 },
];

export const CYCLE_LENGTH = 66;
export const MILESTONE_DAYS: readonly MilestoneDay[] = [7, 21, 30, 66];
export const MILESTONE_RARITY: Record<MilestoneDay, Rarity> = {
  7: 'common',
  21: 'rare',
  30: 'epic',
  66: 'mythic',
};
/** Share of a milestone's days that must have at least one completion. */
export const MILESTONE_MIN_ACTIVE_RATIO = 0.7;

export const MULTIPLIER_STEP = 0.025;
export const MULTIPLIER_MAX = 2.5;
export const BALANCED_DAY_BONUS = 1.15;
export const BALANCED_DAY_MIN_STATS = 3;

export const LEVEL_XP_BASE = 50; // xp to reach level L = 50 * (L-1)^2
export const STAT_XP_BASE = 20; // xp to reach stat level L = 20 * L^2

export const HARD_MISS_PENALTY_RATIO = 0.5;
export const HARD_CYCLE_RESTART_MISSES = 3;
export const STAT_DECAY_INTERVAL_DAYS = 5;

export const ARCHETYPE_PAIR_RATIO = 0.7;
export const SINGLE_ARCHETYPES: Record<StatKey, string> = {
  STR: 'Warrior',
  INT: 'Scholar',
  FOC: 'Ranger',
  DIS: 'Sentinel',
  WIS: 'Sage',
};
// Keys are the two stats sorted alphabetically.
export const PAIR_ARCHETYPES: Record<string, string> = {
  'DIS+FOC': 'Samurai',
  'DIS+INT': 'Strategist',
  'DIS+STR': 'Paladin',
  'DIS+WIS': 'Monk',
  'FOC+INT': 'Artificer',
  'FOC+STR': 'Duelist',
  'FOC+WIS': 'Oracle',
  'INT+STR': 'Scholar-Knight',
  'INT+WIS': 'Archmage',
  'STR+WIS': 'Warden',
};
