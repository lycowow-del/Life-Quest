import type { Difficulty, StatKey, TimeOfDay } from './types';

export interface HabitInput {
  name: string;
  stat: StatKey;
  difficulty: Difficulty;
  timeOfDay: TimeOfDay;
  id?: string;
}

/** Placeholder starter pack until the S4 roadmap generator tailors quests to the player. */
export const STARTER_HABITS: readonly HabitInput[] = [
  { name: 'Wake at 6:30', stat: 'DIS', difficulty: 'easy', timeOfDay: 'morning' },
  { name: 'Cold shower', stat: 'DIS', difficulty: 'medium', timeOfDay: 'morning' },
  { name: 'Workout 20 min', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning' },
  { name: 'Read 20 pages', stat: 'INT', difficulty: 'medium', timeOfDay: 'afternoon' },
  { name: 'Deep work, 1 hour', stat: 'FOC', difficulty: 'hard', timeOfDay: 'afternoon' },
  { name: 'Journal three lines', stat: 'WIS', difficulty: 'easy', timeOfDay: 'evening' },
  { name: 'Meditate 10 min', stat: 'WIS', difficulty: 'medium', timeOfDay: 'evening' },
  { name: 'Phone off at 10 pm', stat: 'DIS', difficulty: 'easy', timeOfDay: 'evening' },
];
