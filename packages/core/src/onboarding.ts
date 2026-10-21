import {
  QUEST_COUNT_MAX,
  QUEST_COUNT_MIN,
  QUIZ_MAX_STAT_SCORE,
  RAMP_UNLOCK_DAY,
  START_STAT_MAX_LEVEL,
  STAT_KEYS,
} from './constants';
import { addHabit, createInitialState } from './engine';
import type { PlannedHabit } from './starters';
import type { Difficulty, GameState, Mode, StatKey, StatXp, TimeOfDay } from './types';
import { xpForStatLevel } from './xp';

export type StatScores = Record<StatKey, number>;

export interface QuizQuestion {
  id: string;
  stat: StatKey;
  text: string;
  /** Ordered from the lowest score (0) to the highest (3). */
  options: readonly [string, string, string, string];
}

const q = (
  stat: StatKey,
  n: number,
  text: string,
  a: string,
  b: string,
  c: string,
  d: string,
): QuizQuestion => ({ id: `${stat}${n}`, stat, text, options: [a, b, c, d] });

/** 15 questions, 3 per stat, answered about real habits. */
export const QUIZ: readonly QuizQuestion[] = [
  q('STR', 1, 'How often do you exercise in a normal week?', 'Never', 'About 1 day', '2 to 3 days', '4 or more days'),
  q('STR', 2, 'How much sleep do you usually get?', 'Under 5 hours', '5 to 6 hours', '6 to 7 hours', '7 to 9 hours'),
  q('STR', 3, 'How much do you move on an average day?', 'Mostly sitting', 'A few short walks', 'A good walk daily', 'Very active all day'),
  q('INT', 1, 'How often do you read or study something new?', 'Rarely', 'A few times a month', 'Weekly', 'Daily'),
  q('INT', 2, 'When did you last learn a skill on purpose?', 'Over a year ago', 'Within the last year', 'In the last 3 months', 'I am learning one now'),
  q('INT', 3, 'How much of your screen time is learning?', 'None', 'A little', 'About a third', 'Most of it'),
  q('FOC', 1, 'How long can you work without checking your phone?', 'A few minutes', 'About 15 minutes', '30 to 45 minutes', 'An hour or more'),
  q('FOC', 2, 'How often do you finish what you start?', 'Rarely', 'Sometimes', 'Usually', 'Almost always'),
  q('FOC', 3, 'How often do distractions break your focus?', 'Constantly', 'Frequently', 'Occasionally', 'Rarely'),
  q('DIS', 1, 'How consistent is your wake-up time?', 'All over the place', 'Only on weekdays', 'Within an hour', 'The same time daily'),
  q('DIS', 2, 'How often do you keep promises you make to yourself?', 'Rarely', 'Sometimes', 'Usually', 'Almost always'),
  q('DIS', 3, 'Do you follow a daily routine?', 'No routine', 'A loose one', 'Mostly', 'A firm routine'),
  q('WIS', 1, 'How often do you reflect or journal?', 'Never', 'Rarely', 'Weekly', 'Daily'),
  q('WIS', 2, 'How do you usually handle stress?', 'I bottle it up', 'I react quickly', 'I take breaks', 'I use a routine that works'),
  q('WIS', 3, 'How often do you plan your day or week?', 'Never', 'Sometimes', 'Weekly', 'Daily'),
];
export const QUIZ_LENGTH = QUIZ.length;

/** Sums each stat's questions. Unanswered questions count as 0. Result is 0-9 per stat. */
export function scoreQuiz(answers: readonly (number | undefined)[]): StatScores {
  const scores: StatScores = { STR: 0, INT: 0, FOC: 0, DIS: 0, WIS: 0 };
  QUIZ.forEach((question, i) => {
    const a = answers[i];
    if (a !== undefined && a >= 0 && a <= 3) scores[question.stat] += Math.round(a);
  });
  return scores;
}

/** Quiz score 0-9 becomes a starting stat level 0-4. Total XP and rank are not affected. */
export function startingStatXp(scores: StatScores): StatXp {
  const out: StatXp = { STR: 0, INT: 0, FOC: 0, DIS: 0, WIS: 0 };
  for (const k of STAT_KEYS) {
    const level = Math.round((Math.min(scores[k], QUIZ_MAX_STAT_SCORE) / QUIZ_MAX_STAT_SCORE) * START_STAT_MAX_LEVEL);
    out[k] = xpForStatLevel(level);
  }
  return out;
}

const ascending = (scores: StatScores): StatKey[] =>
  [...STAT_KEYS].sort((a, b) => scores[a] - scores[b] || STAT_KEYS.indexOf(a) - STAT_KEYS.indexOf(b));

/** Lowest score wins; ties go to the earlier stat in STR, INT, FOC, DIS, WIS order. */
export const weakestStat = (scores: StatScores): StatKey => ascending(scores)[0]!;

export interface LibraryQuest {
  name: string;
  difficulty: Difficulty;
  timeOfDay: TimeOfDay;
}
const lq = (name: string, difficulty: Difficulty, timeOfDay: TimeOfDay): LibraryQuest => ({ name, difficulty, timeOfDay });

/** Three quests per stat per difficulty. */
export const QUEST_LIBRARY: Record<StatKey, readonly LibraryQuest[]> = {
  STR: [
    lq('Stretch for 5 minutes', 'easy', 'morning'),
    lq('Walk for 10 minutes', 'easy', 'afternoon'),
    lq('Do 10 push-ups', 'easy', 'evening'),
    lq('Workout for 20 minutes', 'medium', 'morning'),
    lq('Walk 8,000 steps', 'medium', 'afternoon'),
    lq('Bodyweight circuit', 'medium', 'evening'),
    lq('Workout for 45 minutes', 'hard', 'morning'),
    lq('Run or cycle for 30 minutes', 'hard', 'afternoon'),
    lq('Strength session', 'hard', 'evening'),
  ],
  INT: [
    lq('Read 5 pages', 'easy', 'evening'),
    lq('Learn one new fact', 'easy', 'afternoon'),
    lq('Watch one short lesson', 'easy', 'morning'),
    lq('Read 20 pages', 'medium', 'evening'),
    lq('Practice a skill for 20 minutes', 'medium', 'afternoon'),
    lq('Take notes on something new', 'medium', 'morning'),
    lq('Study for 1 hour', 'hard', 'afternoon'),
    lq('Finish a lesson and summarize it', 'hard', 'evening'),
    lq('Build or write something new', 'hard', 'morning'),
  ],
  FOC: [
    lq('Phone away for 15 minutes', 'easy', 'morning'),
    lq('Clear your desk for 5 minutes', 'easy', 'afternoon'),
    lq('Write down your top task', 'easy', 'morning'),
    lq('One 25-minute focus session', 'medium', 'afternoon'),
    lq('Single-task for 45 minutes', 'medium', 'morning'),
    lq('Finish one task you have delayed', 'medium', 'evening'),
    lq('Two focus sessions, no phone', 'hard', 'afternoon'),
    lq('Deep work for 90 minutes', 'hard', 'morning'),
    lq('Zero distractions for 2 hours', 'hard', 'afternoon'),
  ],
  DIS: [
    lq('Make your bed', 'easy', 'morning'),
    lq('Wake at your set time', 'easy', 'morning'),
    lq('Tidy one small space', 'easy', 'evening'),
    lq('Plan tomorrow tonight', 'medium', 'evening'),
    lq('Cold shower', 'medium', 'morning'),
    lq('Follow your full routine', 'medium', 'morning'),
    lq('Phone off an hour before bed', 'hard', 'evening'),
    lq('Skip one habit you want to quit', 'hard', 'afternoon'),
    lq('Finish everything on your list', 'hard', 'evening'),
  ],
  WIS: [
    lq('Write one line in a journal', 'easy', 'evening'),
    lq('Take 5 deep breaths', 'easy', 'morning'),
    lq('Note one thing you are grateful for', 'easy', 'evening'),
    lq('Meditate for 10 minutes', 'medium', 'morning'),
    lq('Journal three lines', 'medium', 'evening'),
    lq('Review your day', 'medium', 'evening'),
    lq('Meditate for 20 minutes', 'hard', 'morning'),
    lq('Reflect for 15 minutes', 'hard', 'evening'),
    lq('Plan your week and your goals', 'hard', 'afternoon'),
  ],
};

export const alternatives = (stat: StatKey, difficulty: Difficulty): LibraryQuest[] =>
  QUEST_LIBRARY[stat].filter((x) => x.difficulty === difficulty);

export interface Roadmap {
  bossStat: StatKey;
  habits: PlannedHabit[];
}

/**
 * Builds the starting quests. The weakest stat gets at least two quests (they power boss week),
 * the remaining slots cycle through stats from weakest to strongest, and harder quests go to
 * stronger stats. Easy quests unlock on day 1, medium on day 8, hard on day 15.
 */
export function buildRoadmap(scores: StatScores, questCount: number, times: readonly TimeOfDay[]): Roadmap {
  const n = Math.max(QUEST_COUNT_MIN, Math.min(QUEST_COUNT_MAX, Math.round(questCount)));
  const order = ascending(scores);
  const boss = order[0]!;
  const stats: StatKey[] = [boss, boss];
  for (let i = 1; stats.length < n; i++) stats.push(order[i % order.length]!);

  const easy = Math.round(n * 0.4);
  const hard = Math.round(n * 0.25);
  const medium = n - easy - hard;
  const diffs: Difficulty[] = [
    ...Array<Difficulty>(hard).fill('hard'),
    ...Array<Difficulty>(medium).fill('medium'),
    ...Array<Difficulty>(easy).fill('easy'),
  ];

  const slots = stats
    .map((stat, idx) => ({ stat, idx }))
    .sort((a, b) => scores[b.stat] - scores[a.stat] || a.idx - b.idx);

  const used = new Set<string>();
  let t = 0;
  const habits: PlannedHabit[] = slots.map((slot, j) => {
    const difficulty = diffs[j]!;
    const pick = alternatives(slot.stat, difficulty).find((x) => !used.has(x.name))!;
    used.add(pick.name);
    const timeOfDay = times.length === 0 || times.includes(pick.timeOfDay) ? pick.timeOfDay : times[t++ % times.length]!;
    return { name: pick.name, stat: slot.stat, difficulty, timeOfDay, activeFromDay: RAMP_UNLOCK_DAY[difficulty] };
  });
  return { bossStat: boss, habits };
}

/** Unlock days with how many quests unlock on each, for the roadmap timeline. */
export function phaseSummary(habits: readonly PlannedHabit[]): { day: number; count: number }[] {
  const byDay = new Map<number, number>();
  for (const h of habits) byDay.set(h.activeFromDay, (byDay.get(h.activeFromDay) ?? 0) + 1);
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, count]) => ({ day, count }));
}

export interface OnboardingPlan {
  name: string;
  scores: StatScores;
  bossStat: StatKey | null;
  habits: readonly PlannedHabit[];
  mode?: Mode;
}

/** Creates the starting game. If the earliest quest unlocks after day 1, everything shifts to day 1. */
export function createGameFromPlan(plan: OnboardingPlan): GameState {
  let s = createInitialState({ name: plan.name, mode: plan.mode });
  s = { ...s, profile: { ...s.profile, statXp: startingStatXp(plan.scores), bossStat: plan.bossStat } };
  const earliest = plan.habits.reduce((m, h) => Math.min(m, h.activeFromDay), Infinity);
  const shift = Number.isFinite(earliest) ? Math.max(0, earliest - 1) : 0;
  for (const h of plan.habits) s = addHabit(s, { ...h, activeFromDay: h.activeFromDay - shift });
  return s;
}
