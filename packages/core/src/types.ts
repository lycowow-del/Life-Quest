export type StatKey = 'STR' | 'INT' | 'FOC' | 'DIS' | 'WIS';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type Mode = 'standard' | 'hard';
export type Tier =
  | 'Iron'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Emerald'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Challenger';
/** 4 is the entry division of a tier, 1 is the top. */
export type Division = 1 | 2 | 3 | 4;
export type Rarity = 'common' | 'rare' | 'epic' | 'mythic';
export type MilestoneDay = 7 | 21 | 30 | 66;
export type StatXp = Record<StatKey, number>;

export type TargetUnit = 'min' | 'pages' | 'steps' | 'reps' | 'lines';

/** Starting amount for a measurable quest, e.g. 60 min. */
export interface QuestTargetInput {
  base: number;
  unit: TargetUnit;
  /** Amounts are rounded to a multiple of this (5 for minutes, 500 for steps). */
  round: number;
  /** Largest amount the quest may grow to. */
  max?: number;
}

export interface QuestTarget extends QuestTargetInput {
  /** Completed days on this quest. Every 5 raise the target by 25%. */
  completions: number;
  /** When true the target stays where it is. */
  frozen?: boolean;
}

/** A recurring habit definition, shown to the player as a daily quest. */
export interface Habit {
  id: string;
  name: string;
  stat: StatKey;
  difficulty: Difficulty;
  timeOfDay: TimeOfDay;
  createdOnDay: number;
  archived: boolean;
  /** Present on measurable quests, which grow as they are completed. */
  target?: QuestTarget;
}

/** One completed quest on one day (the XP receipt). */
export interface Quest {
  habitId: string;
  day: number;
  stat: StatKey;
  xp: number;
  multiplier: number;
  balancedBonus: boolean;
  /** True when boss week doubled this completion. */
  boss?: boolean;
  /** XP multiplier from the quest's target level (1.25 per level). Omitted when 1. */
  scale?: number;
}

export interface DayLog {
  day: number;
  completions: Quest[];
  /** XP actually deducted by Hard Mode when the day closed. */
  penalty: number;
  /** Stats that lost a level to neglect decay when the day closed. */
  decayed: StatKey[];
  /** Boss chest XP paid out when this day closed. */
  chest?: number;
  closed: boolean;
}

export interface Milestone {
  id: string;
  day: MilestoneDay;
  cycle: number;
  rarity: Rarity;
  unlockedOnDay: number;
  archetype: string;
  topStat: StatKey;
}

export interface UserProfile {
  name: string;
  mode: Mode;
  totalXp: number;
  statXp: StatXp;
  streak: number;
  bestStreak: number;
  /** Absolute day counter since the account started. */
  dayNumber: number;
  cycle: number;
  cycleStartDay: number;
  completedCycles: number;
  consecutiveMissedDays: number;
  lastStatDay: Record<StatKey, number>;
  /** Weakest stat from the onboarding quiz. Its quests get 2x XP during boss week. */
  bossStat?: StatKey | null;
  bossChestClaimedCycle?: number;
}

export interface GameState {
  profile: UserProfile;
  habits: Habit[];
  logs: Record<number, DayLog>;
  milestones: Milestone[];
}

export interface RankInfo {
  /** 0 to 30: Iron IV up to Challenger. */
  step: number;
  tierIndex: number;
  tier: Tier;
  division: Division | null;
  /** Master and above: the running point total since reaching Master. Null below Master. */
  points: number | null;
  /** e.g. "Gold II", "Master · 120 pts", "Challenger · 1200 pts". */
  label: string;
  /** Label without points, e.g. "Gold II" or "Master". */
  shortLabel: string;
  /** Progress toward the next step (or next point at the ceiling), 0 to 1. */
  ratio: number;
  xpToNext: number;
  /** Points still needed for the next apex tier (Master and Grandmaster only). */
  pointsToNext: number | null;
  nextLabel: string | null;
}
