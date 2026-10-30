import { lifetimeTotals, type LifetimeTotals } from './analytics';
import { visibleOn } from './schedule';
import { maxLevelFor, targetLevel } from './progression';
import { stepThreshold, levelFromXp, rankInfo, statLevel } from './xp';
import { STAT_KEYS } from './constants';
import type { GameState } from './types';

export type AchievementGroup = 'Quests' | 'Streaks' | 'Ranks' | 'Growth' | 'Focus' | 'Journal' | 'Collection';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  group: AchievementGroup;
  target: number;
  value: (c: AchCtx) => number;
}

export interface AchCtx {
  s: GameState;
  totals: LifetimeTotals;
  level: number;
  step: number;
  statLevels: number[];
  perfectDays: number;
  bestQuestLevel: number;
  anyQuestMaxed: boolean;
  hasRoutine: boolean;
  bossWon: boolean;
  photos: number;
}

function context(s: GameState): AchCtx {
  const totals = lifetimeTotals(s);
  let perfectDays = 0;
  for (const log of Object.values(s.logs)) {
    if (!log.closed || log.rest) continue;
    const due = visibleOn(s, log.day).length;
    if (due > 0 && log.completions.length >= due) perfectDays++;
  }
  const withTarget = s.habits.filter((h) => h.target);
  return {
    s,
    totals,
    level: levelFromXp(s.profile.totalXp),
    step: rankInfo(s.profile.totalXp).step,
    statLevels: STAT_KEYS.map((k) => statLevel(s.profile.statXp[k])),
    perfectDays,
    bestQuestLevel: withTarget.reduce((m, h) => Math.max(m, targetLevel(h.target!)), 0),
    anyQuestMaxed: withTarget.some((h) => targetLevel(h.target!) >= maxLevelFor(h.target!) && maxLevelFor(h.target!) > 0),
    hasRoutine: s.habits.some((h) => !!h.schedule),
    bossWon: (s.profile.bossChestClaimedCycle ?? 0) > 0 || Object.values(s.logs).some((l) => !!l.chest),
    photos: Object.values(s.journal ?? {}).reduce((t, e) => t + (e.photoIds?.length ?? 0), 0),
  };
}

const def = (
  id: string,
  group: AchievementGroup,
  name: string,
  description: string,
  target: number,
  value: (c: AchCtx) => number,
): AchievementDef => ({ id, group, name, description, target, value });

const RANK_STEPS: [string, string, number][] = [
  ['bronze', 'Bronze', 4],
  ['silver', 'Silver', 8],
  ['gold', 'Gold', 12],
  ['platinum', 'Platinum', 16],
  ['emerald', 'Emerald', 20],
  ['diamond', 'Diamond', 24],
  ['master', 'Master', 28],
  ['grandmaster', 'Grandmaster', 29],
  ['challenger', 'Challenger', 30],
];

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  def('first-quest', 'Quests', 'First Step', 'Complete your first quest.', 1, (c) => c.totals.questsCompleted),
  def('quests-25', 'Quests', 'Getting Going', 'Complete 25 quests.', 25, (c) => c.totals.questsCompleted),
  def('quests-100', 'Quests', 'Centurion', 'Complete 100 quests.', 100, (c) => c.totals.questsCompleted),
  def('quests-500', 'Quests', 'Relentless', 'Complete 500 quests.', 500, (c) => c.totals.questsCompleted),
  def('perfect-1', 'Quests', 'Clean Sweep', 'Finish a day with every quest done.', 1, (c) => c.perfectDays),
  def('perfect-10', 'Quests', 'Flawless Ten', 'Have 10 perfect days.', 10, (c) => c.perfectDays),
  def('perfect-30', 'Quests', 'Flawless Thirty', 'Have 30 perfect days.', 30, (c) => c.perfectDays),
  def('routine', 'Quests', 'Routine Builder', 'Add a quest that repeats on a schedule.', 1, (c) => (c.hasRoutine ? 1 : 0)),
  def('streak-3', 'Streaks', 'On a Roll', 'Reach a 3-day streak.', 3, (c) => c.totals.bestStreak),
  def('streak-7', 'Streaks', 'Week Warrior', 'Reach a 7-day streak.', 7, (c) => c.totals.bestStreak),
  def('streak-21', 'Streaks', 'Habit Forming', 'Reach a 21-day streak.', 21, (c) => c.totals.bestStreak),
  def('streak-66', 'Streaks', 'Automatic', 'Reach a 66-day streak.', 66, (c) => c.totals.bestStreak),
  def('hatched', 'Ranks', 'Hatched', 'Hatch your companion by reaching Iron III.', 1, (c) => (c.step >= 1 ? 1 : 0)),
  ...RANK_STEPS.map(([id, name, step]) =>
    def(`rank-${id}`, 'Ranks', `Reached ${name}`, `Climb to ${name}.`, 1, (c) => (c.s.profile.totalXp >= stepThreshold(step) ? 1 : 0)),
  ),
  def('level-10', 'Growth', 'Level 10', 'Reach player level 10.', 10, (c) => c.level),
  def('level-25', 'Growth', 'Level 25', 'Reach player level 25.', 25, (c) => c.level),
  def('stat-balanced', 'Growth', 'Well Rounded', 'Have all five stats at level 3.', 3, (c) => Math.min(...c.statLevels)),
  def('stat-specialist', 'Growth', 'Specialist', 'Take any stat to level 8.', 8, (c) => Math.max(...c.statLevels)),
  def('quest-levelup', 'Growth', 'Leveling Up', 'Level up a measurable quest.', 1, (c) => c.bestQuestLevel),
  def('quest-peak', 'Growth', 'Peak Form', 'Take a quest to its maximum level.', 1, (c) => (c.anyQuestMaxed ? 1 : 0)),
  def('boss', 'Growth', 'Boss Slayer', 'Win a boss week chest.', 1, (c) => (c.bossWon ? 1 : 0)),
  def('cycle', 'Growth', 'Full Cycle', 'Complete a 66-day cycle.', 1, (c) => c.totals.cyclesCompleted),
  def('focus-1', 'Focus', 'Focused', 'Finish a focus session.', 1, (c) => c.totals.focusSessions),
  def('focus-600', 'Focus', 'Deep Focus', 'Focus for 10 hours in total.', 600, (c) => c.totals.focusMinutes),
  def('focus-3000', 'Focus', 'Marathon', 'Focus for 50 hours in total.', 3000, (c) => c.totals.focusMinutes),
  def('journal-1', 'Journal', 'Dear Diary', 'Write your first journal entry.', 1, (c) => c.totals.journalDays),
  def('journal-30', 'Journal', 'Chronicler', 'Journal on 30 different days.', 30, (c) => c.totals.journalDays),
  def('photo-1', 'Journal', 'Paper Trail', 'Save a photo of a paper journal page.', 1, (c) => c.photos),
  def('mood-14', 'Journal', 'Mood Tracker', 'Log your mood on 14 different days.', 14, (c) => c.totals.moodDays),
  def('card-1', 'Collection', 'First Card', 'Earn a skill card.', 1, (c) => c.totals.skillCards),
  def('card-4', 'Collection', 'Collector', 'Earn four skill cards.', 4, (c) => c.totals.skillCards),
];

export interface AchievementStatus {
  def: AchievementDef;
  unlocked: boolean;
  /** Game day it was earned. */
  day?: number;
  value: number;
}

/** Records any newly earned achievements. Earned ones are never removed, even if a value later drops. */
export function syncAchievements(s: GameState): { state: GameState; unlocked: AchievementDef[] } {
  const have = s.achievements ?? {};
  const c = context(s);
  const unlocked = ACHIEVEMENTS.filter((a) => !(a.id in have) && a.value(c) >= a.target);
  if (unlocked.length === 0) return { state: s, unlocked };
  const next = { ...have };
  for (const a of unlocked) next[a.id] = s.profile.dayNumber;
  return { state: { ...s, achievements: next }, unlocked };
}

export function achievementStatus(s: GameState): AchievementStatus[] {
  const have = s.achievements ?? {};
  const c = context(s);
  return ACHIEVEMENTS.map((a) => {
    const got = a.id in have;
    return { def: a, unlocked: got, ...(got ? { day: have[a.id] } : {}), value: got ? a.target : Math.min(a.value(c), a.target) };
  });
}
