import { describe, expect, it } from 'vitest';
import { addHabit, completeQuest, createInitialState } from './engine';
import { exportSave, parseSave } from './serialize';

const played = () => {
  let s = createInitialState({ name: 'Ada', mode: 'hard' });
  s = addHabit(s, { name: 'Run', stat: 'STR', difficulty: 'hard', timeOfDay: 'morning' });
  return completeQuest(s, 'h1').state;
};
const wrap = (mutate: (o: Record<string, any>) => void): string => {
  const o = JSON.parse(exportSave(played(), '2026-10-20'));
  mutate(o);
  return JSON.stringify(o);
};

describe('save files', () => {
  it('round-trips a played game', () => {
    const state = played();
    const r = parseSave(exportSave(state, '2026-10-20', new Date('2026-10-21T00:00:00Z')));
    if (!r.ok) throw new Error(r.error);
    expect(r.save.state).toEqual(state);
    expect(r.save.startDateKey).toBe('2026-10-20');
    expect(r.save.exportedAt).toBe('2026-10-21T00:00:00.000Z');
  });
  it('rejects non-JSON and foreign files', () => {
    expect(parseSave('not json').ok).toBe(false);
    expect(parseSave('{"hello":1}').ok).toBe(false);
    expect(parseSave('null').ok).toBe(false);
  });
  it('rejects newer versions and bad dates', () => {
    expect(parseSave(wrap((o) => (o.version = 99))).ok).toBe(false);
    expect(parseSave(wrap((o) => (o.startDateKey = '2026-13-40'))).ok).toBe(false);
  });
  it('rejects tampered state', () => {
    expect(parseSave(wrap((o) => (o.state.profile.mode = 'god'))).ok).toBe(false);
    expect(parseSave(wrap((o) => (o.state.profile.totalXp = 'lots'))).ok).toBe(false);
    expect(parseSave(wrap((o) => (o.state.habits[0].stat = 'LUCK'))).ok).toBe(false);
    expect(parseSave(wrap((o) => delete o.state.milestones)).ok).toBe(false);
    expect(parseSave(wrap((o) => (o.state.profile.statXp.STR = -5))).ok).toBe(false);
  });
});
