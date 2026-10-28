import type { Difficulty, MilestoneDay, Rarity, StatKey, Tier } from './types';

// All balance knobs live here. Rebalance the economy without touching any logic.
export const STAT_KEYS: readonly StatKey[] = ['STR', 'INT', 'FOC', 'DIS', 'WIS'];
export const XP_VALUES: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };

export const TIER_NAMES: readonly Tier[] = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Emerald',
  'Diamond',
  'Master',
  'Grandmaster',
  'Challenger',
];
/** Steps 0-27 are Iron IV to Diamond I. Steps 28, 29, 30 are Master, Grandmaster, Challenger. */
export const LADDER_LAST_STEP = 30;
export const APEX_FIRST_STEP = 28;
/**
 * The apex tiers have no divisions. Points are one running total that starts at 0 when you reach
 * Master and carries through Grandmaster and Challenger. These are the totals where each tier begins.
 */
export const APEX_TIER_POINTS = [0, 425, 855] as const;
/** XP to reach step n is scale * n^power, rounded. Tuned so 66 perfect days end around Gold II. */
export const RANK_CURVE = { scale: 355, power: 1.6, round: 50 };
/** From Master onward, every POINT_XP of XP is one point. */
export const POINT_XP = 10;

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

// Boss week: cycle days 15-21, the end of the ramp-up. The weakest stat's quests give 2x XP,
// and clearing every one of them on every day pays a chest.
export const BOSS_START_DAY = 15;
export const BOSS_END_DAY = 21;
export const BOSS_XP_MULT = 2;
export const BOSS_CHEST_XP = 250;

// Onboarding ramp: quests unlock by difficulty so the first weeks start easy.
export const RAMP_UNLOCK_DAY: Record<Difficulty, number> = { easy: 1, medium: 8, hard: 15 };
export const QUEST_COUNT_MIN = 3;
export const QUEST_COUNT_MAX = 8;
export const QUEST_COUNT_DEFAULT = 5;
/** Quiz stat score is 0-9 (three questions, 0-3 each). It maps to a starting stat level 0-4. */
export const QUIZ_MAX_STAT_SCORE = 9;
export const START_STAT_MAX_LEVEL = 4;

// Progressive quests: a measurable quest's target grows 25% every 5 completed days.
export const PROGRESSION_DAYS = 5;
export const PROGRESSION_GROWTH = 1.25;
/** Level 3 is about 1.95x the starting target. */
export const PROGRESSION_MAX_LEVEL = 3;

// Focus timer and journal rewards. Base XP is multiplied by the streak multiplier.
export const FOCUS_XP_PER_MIN = 1.2; // a 25-minute session is 30 base XP
export const FOCUS_MIN_MINUTES = 10; // shorter sessions earn nothing
export const FOCUS_DAILY_XP_CAP = 120; // base XP per day from the timer
export const MOOD_XP = 5; // once a day
export const JOURNAL_XP = 15; // once a day, for an entry or a photo of a paper page
export const JOURNAL_MIN_CHARS = 20;
export const JOURNAL_MAX_CHARS = 5000;
export const JOURNAL_MAX_PHOTOS = 6;

/** Hard Mode warns about a stat when it is this many days (or fewer) from losing a level. */
export const DECAY_WARNING_DAYS = 2;
