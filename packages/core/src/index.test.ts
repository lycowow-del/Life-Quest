import { describe, expect, it } from 'vitest';
import * as core from './index';

describe('public API', () => {
  it('exports the engine surface used by the app', () => {
    for (const name of [
      'createInitialState',
      'addHabit',
      'completeQuest',
      'endDay',
      'advanceDays',
      'consistencyMultiplier',
      'levelFromXp',
      'rankInfo',
      'archetype',
    ]) {
      expect(typeof (core as Record<string, unknown>)[name]).toBe('function');
    }
  });
});
