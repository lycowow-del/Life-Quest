import { create } from 'zustand';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
export type TimerMode = 'focus' | 'break';
export interface FocusResult {
  minutes: number;
  xp: number;
}

interface FocusTimer {
  status: TimerStatus;
  mode: TimerMode;
  durationSec: number;
  remainingSec: number;
  endsAt: number;
  /** Length of the focus session in minutes, used for the reward. */
  sessionMinutes: number;
  ambient: boolean;
  result: FocusResult | null;
  start: (minutes: number, mode?: TimerMode) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /** Updates the remaining time from the clock. Returns true on the tick that finishes the timer. */
  tick: () => boolean;
  setResult: (r: FocusResult | null) => void;
  setAmbient: (on: boolean) => void;
}

// Time is measured against the clock (endsAt), so a throttled or backgrounded tab still finishes on time.
export const useFocusTimer = create<FocusTimer>()((set, get) => ({
  status: 'idle',
  mode: 'focus',
  durationSec: 25 * 60,
  remainingSec: 25 * 60,
  endsAt: 0,
  sessionMinutes: 25,
  ambient: true,
  result: null,
  start: (minutes, mode = 'focus') =>
    set({
      status: 'running',
      mode,
      durationSec: minutes * 60,
      remainingSec: minutes * 60,
      endsAt: Date.now() + minutes * 60_000,
      sessionMinutes: mode === 'focus' ? minutes : get().sessionMinutes,
      result: null,
    }),
  pause: () => {
    const s = get();
    if (s.status === 'running') set({ status: 'paused', remainingSec: Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000)) });
  },
  resume: () => {
    const s = get();
    if (s.status === 'paused') set({ status: 'running', endsAt: Date.now() + s.remainingSec * 1000 });
  },
  reset: () => set({ status: 'idle', remainingSec: get().durationSec, result: null }),
  tick: () => {
    const s = get();
    if (s.status !== 'running') return false;
    const rem = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000));
    if (rem <= 0) {
      set({ status: 'finished', remainingSec: 0 });
      return true;
    }
    if (rem !== s.remainingSec) set({ remainingSec: rem });
    return false;
  },
  setResult: (r) => set({ result: r }),
  setAmbient: (on) => set({ ambient: on }),
}));
