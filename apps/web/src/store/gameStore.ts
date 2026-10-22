import localforage from 'localforage';
import { create } from 'zustand';
import {
  addDaysToKey,
  addHabit as addHabitToState,
  archiveHabit as archiveHabitInState,
  completeQuest,
  createGameFromPlan,
  createInitialState,
  exportSave,
  parseSave,
  setMode as setModeInState,
  setProgressionFrozen,
  syncToDate,
  toDateKey,
  type CompleteResult,
  type Difficulty,
  type GameState,
  type Mode,
  type OnboardingPlan,
  type QuestTargetInput,
  type StatKey,
  type TimeOfDay,
} from '@la66/core';

const db = localforage.createInstance({ name: 'life-arc-66', storeName: 'game' });
const KEY = 'save';
const todayKey = (): string => toDateKey(new Date());

// Writes are queued so they always land in order.
let writes: Promise<unknown> = Promise.resolve();
const persist = (state: GameState, startDateKey: string): void => {
  const json = exportSave(state, startDateKey);
  writes = writes.then(() => db.setItem(KEY, json)).catch(() => undefined);
};

export interface NewHabit {
  name: string;
  stat: StatKey;
  difficulty: Difficulty;
  timeOfDay: TimeOfDay;
  target?: QuestTargetInput;
}

interface GameStore {
  hydrated: boolean;
  state: GameState | null;
  startDateKey: string | null;
  loadError: string | null;
  hydrate: () => Promise<void>;
  startNewGame: (opts: { name?: string; mode?: Mode }) => void;
  startFromOnboarding: (plan: OnboardingPlan) => void;
  complete: (habitId: string) => CompleteResult | null;
  addHabit: (input: NewHabit) => void;
  addHabits: (inputs: readonly NewHabit[]) => void;
  archiveHabit: (id: string) => void;
  toggleGrowth: (id: string) => void;
  setMode: (mode: Mode) => void;
  syncDate: () => void;
  devSkipDay: () => void;
  exportJson: () => string | null;
  importJson: (json: string) => { ok: boolean; error?: string };
  reset: () => Promise<void>;
}

export const useGame = create<GameStore>()((set, get) => {
  const commit = (state: GameState, startDateKey = get().startDateKey): void => {
    if (!startDateKey) return;
    set({ state, startDateKey });
    persist(state, startDateKey);
  };
  const update = (fn: (s: GameState) => GameState): void => {
    const s = get().state;
    if (s) commit(fn(s));
  };

  return {
    hydrated: false,
    state: null,
    startDateKey: null,
    loadError: null,

    async hydrate() {
      if (get().hydrated) return;
      // Ask the browser not to evict our data under storage pressure.
      void navigator.storage?.persist?.().catch(() => undefined);
      try {
        const raw = await db.getItem<string>(KEY);
        if (raw) {
          const r = parseSave(raw);
          if (r.ok) {
            const synced = syncToDate(r.save.state, r.save.startDateKey, todayKey());
            set({ state: synced, startDateKey: r.save.startDateKey, hydrated: true });
            if (synced !== r.save.state) persist(synced, r.save.startDateKey);
            return;
          }
          await db.setItem(`${KEY}:corrupt`, raw); // keep a copy, never silently destroy data
          set({ loadError: r.error });
        }
      } catch (e) {
        set({ loadError: e instanceof Error ? e.message : 'Could not read saved data.' });
      }
      set({ hydrated: true });
    },

    startNewGame(opts) {
      commit(createInitialState(opts), todayKey());
    },

    startFromOnboarding(plan) {
      commit(createGameFromPlan(plan), todayKey());
    },

    complete(habitId) {
      const s = get().state;
      if (!s) return null;
      const r = completeQuest(s, habitId);
      if (r.ok) commit(r.state);
      return r;
    },

    addHabit: (input) => update((s) => addHabitToState(s, input)),
    addHabits: (inputs) => update((s) => inputs.reduce(addHabitToState, s)),
    archiveHabit: (id) => update((s) => archiveHabitInState(s, id)),
    toggleGrowth: (id) =>
      update((s) => {
        const h = s.habits.find((x) => x.id === id);
        return h?.target ? setProgressionFrozen(s, id, !h.target.frozen) : s;
      }),
    setMode: (mode) => update((s) => setModeInState(s, mode)),

    syncDate() {
      const { state, startDateKey } = get();
      if (!state || !startDateKey) return;
      const next = syncToDate(state, startDateKey, todayKey());
      if (next !== state) commit(next);
    },

    // Dev tool: pretend a day passed by moving the start date back one day.
    devSkipDay() {
      const { state, startDateKey } = get();
      if (!state || !startDateKey) return;
      const shifted = addDaysToKey(startDateKey, -1);
      commit(syncToDate(state, shifted, todayKey()), shifted);
    },

    exportJson() {
      const { state, startDateKey } = get();
      return state && startDateKey ? exportSave(state, startDateKey) : null;
    },

    importJson(json) {
      const r = parseSave(json);
      if (!r.ok) return { ok: false, error: r.error };
      const synced = syncToDate(r.save.state, r.save.startDateKey, todayKey());
      commit(synced, r.save.startDateKey);
      return { ok: true };
    },

    async reset() {
      await writes;
      await db.removeItem(KEY);
      set({ state: null, startDateKey: null, loadError: null });
    },
  };
});
