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

/** Routine quests are only due on some days. Weekdays use 0 = Sunday to 6 = Saturday. */
export type Schedule =
  | { kind: 'every'; n: number; anchor: number }
  | { kind: 'weekdays'; days: number[] };
export type ScheduleInput =
  | { kind: 'every'; n: number; anchor?: number }
  | { kind: 'weekdays'; days: number[] };

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
  /** Absent means the quest is due every day. */
  schedule?: Schedule;
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
  /** True when quests exist but none was due, so the streak was left alone. */
  rest?: boolean;
  /** Hard Mode: ids of the quests that cost XP when this day closed. */
  missed?: string[];
  /** Hard Mode: this day's close restarted the 66-day cycle. */
  restart?: boolean;
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
  /** Weekday (0 = Sunday) of game day 1, so weekday schedules can be worked out. */
  startWeekday?: number;
  /** Hard Mode switched off by the player: it ends when today closes, so penalties cannot be dodged. */
  pendingMode?: Mode;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  day: number;
  mood?: Mood;
  text?: string;
  /** Ids of photos of paper journal pages. The images live in device storage, not in the save file. */
  photoIds?: string[];
  moodPaid?: boolean;
  journalPaid?: boolean;
}

/** Focus timer totals for one day. baseXp is the XP before the streak multiplier, for the daily cap. */
export interface FocusDay {
  sessions: number;
  minutes: number;
  baseXp: number;
}

export interface GameState {
  profile: UserProfile;
  habits: Habit[];
  logs: Record<number, DayLog>;
  milestones: Milestone[];
  journal?: Record<number, JournalEntry>;
  focus?: Record<number, FocusDay>;
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
