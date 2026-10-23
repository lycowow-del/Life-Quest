import { JOURNAL_MAX_CHARS, JOURNAL_MAX_PHOTOS, MILESTONE_DAYS, STAT_KEYS } from './constants';
import { isDateKey } from './dates';
import type { GameState } from './types';

export const SAVE_APP = 'life-arc-66';
export const SAVE_VERSION = 1;

export interface SaveFile {
  app: typeof SAVE_APP;
  version: number;
  exportedAt: string;
  startDateKey: string;
  state: GameState;
}

export type ParseResult = { ok: true; save: SaveFile } | { ok: false; error: string };

export const exportSave = (state: GameState, startDateKey: string, now: Date = new Date()): string =>
  JSON.stringify(
    { app: SAVE_APP, version: SAVE_VERSION, exportedAt: now.toISOString(), startDateKey, state },
    null,
    2,
  );

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const oneOf = (v: unknown, list: readonly unknown[]): boolean => list.includes(v);
const statMap = (v: unknown): boolean =>
  isObj(v) && STAT_KEYS.every((k) => isNum(v[k]) && (v[k] as number) >= 0);

function validateState(s: unknown): string | null {
  if (!isObj(s)) return 'Missing game state.';
  const p = s.profile;
  if (!isObj(p)) return 'Missing profile.';
  if (!isStr(p.name)) return 'Profile name is invalid.';
  if (!oneOf(p.mode, ['standard', 'hard'])) return 'Profile mode is invalid.';
  for (const f of ['totalXp', 'streak', 'bestStreak', 'dayNumber', 'cycle', 'cycleStartDay', 'completedCycles', 'consecutiveMissedDays']) {
    if (!isNum(p[f]) || (p[f] as number) < 0) return `Profile field "${f}" is invalid.`;
  }
  if ((p.dayNumber as number) < 1 || (p.cycle as number) < 1) return 'Profile day or cycle is invalid.';
  if (!statMap(p.statXp)) return 'Stat XP is invalid.';
  if (!statMap(p.lastStatDay)) return 'Stat history is invalid.';
  if (p.bossStat !== undefined && p.bossStat !== null && !oneOf(p.bossStat, STAT_KEYS)) return 'Boss stat is invalid.';
  if (p.bossChestClaimedCycle !== undefined && !isNum(p.bossChestClaimedCycle)) return 'Boss chest record is invalid.';

  if (!Array.isArray(s.habits)) return 'Habits are missing.';
  for (const h of s.habits) {
    if (!isObj(h) || !isStr(h.id) || !isStr(h.name) || !oneOf(h.stat, STAT_KEYS) ||
      !oneOf(h.difficulty, ['easy', 'medium', 'hard']) ||
      !oneOf(h.timeOfDay, ['morning', 'afternoon', 'evening']) ||
      !isNum(h.createdOnDay) || typeof h.archived !== 'boolean') return 'A habit is invalid.';
    if (h.target !== undefined) {
      const t = h.target;
      if (!isObj(t) || !isNum(t.base) || t.base <= 0 || !isNum(t.round) || t.round <= 0 ||
        !oneOf(t.unit, ['min', 'pages', 'steps', 'reps', 'lines']) ||
        !isNum(t.completions) || t.completions < 0 ||
        (t.max !== undefined && !isNum(t.max)) ||
        (t.frozen !== undefined && typeof t.frozen !== 'boolean')) return 'A quest target is invalid.';
    }
  }
  if (!isObj(s.logs)) return 'Logs are missing.';
  for (const log of Object.values(s.logs)) {
    if (!isObj(log) || !isNum(log.day) || !isNum(log.penalty) || typeof log.closed !== 'boolean' ||
      !Array.isArray(log.decayed) || !log.decayed.every((k) => oneOf(k, STAT_KEYS)) ||
      !Array.isArray(log.completions)) return 'A day log is invalid.';
    for (const q of log.completions) {
      if (!isObj(q) || !isStr(q.habitId) || !isNum(q.day) || !oneOf(q.stat, STAT_KEYS) ||
        !isNum(q.xp) || !isNum(q.multiplier) || typeof q.balancedBonus !== 'boolean') return 'A quest record is invalid.';
    }
  }
  if (!Array.isArray(s.milestones)) return 'Milestones are missing.';
  for (const m of s.milestones) {
    if (!isObj(m) || !isStr(m.id) || !oneOf(m.day, MILESTONE_DAYS) || !isNum(m.cycle) ||
      !oneOf(m.rarity, ['common', 'rare', 'epic', 'mythic']) || !isNum(m.unlockedOnDay) ||
      !isStr(m.archetype) || !oneOf(m.topStat, STAT_KEYS)) return 'A skill card is invalid.';
  }
  if (s.journal !== undefined) {
    if (!isObj(s.journal)) return 'Journal is invalid.';
    for (const e of Object.values(s.journal)) {
      if (!isObj(e) || !isNum(e.day) || (e.mood !== undefined && !oneOf(e.mood, [1, 2, 3, 4, 5])) ||
        (e.text !== undefined && (!isStr(e.text) || e.text.length > JOURNAL_MAX_CHARS)) ||
        (e.photoIds !== undefined && (!Array.isArray(e.photoIds) || e.photoIds.length > JOURNAL_MAX_PHOTOS || !e.photoIds.every(isStr))) ||
        (e.moodPaid !== undefined && typeof e.moodPaid !== 'boolean') ||
        (e.journalPaid !== undefined && typeof e.journalPaid !== 'boolean')) return 'A journal entry is invalid.';
    }
  }
  if (s.focus !== undefined) {
    if (!isObj(s.focus)) return 'Focus log is invalid.';
    for (const f of Object.values(s.focus)) {
      if (!isObj(f) || !isNum(f.sessions) || !isNum(f.minutes) || !isNum(f.baseXp) || f.sessions < 0 || f.minutes < 0 || f.baseXp < 0) return 'A focus day is invalid.';
    }
  }
  return null;
}

export function parseSave(json: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!isObj(data) || data.app !== SAVE_APP) return { ok: false, error: 'That is not a Life Arc 66 save file.' };
  if (!isNum(data.version) || data.version < 1) return { ok: false, error: 'Save version is missing.' };
  if (data.version > SAVE_VERSION) return { ok: false, error: 'This save is from a newer version of the app.' };
  if (!isDateKey(data.startDateKey)) return { ok: false, error: 'Save start date is invalid.' };
  const bad = validateState(data.state);
  if (bad) return { ok: false, error: bad };
  return {
    ok: true,
    save: {
      app: SAVE_APP,
      version: data.version,
      exportedAt: isStr(data.exportedAt) ? data.exportedAt : '',
      startDateKey: data.startDateKey,
      state: data.state as GameState,
    },
  };
}
