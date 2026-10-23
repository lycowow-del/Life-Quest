import { useState } from 'react';
import { focusQuest, questLabel, suggestedFocusMinutes, targetAmount, todayFocus, type GameState, type Habit } from '@la66/core';
import { playChime } from '../lib/focusAudio';
import { useFocusTimer } from '../store/focusTimer';
import { useSettings } from '../store/settingsStore';
import type { Origin } from './QuestRow';

const R = 104;
const C = 2 * Math.PI * R;
const fmt = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const primary = 'w-full rounded-xl bg-arc-violet py-3 font-bold text-obsidian shadow-glow-violet';
const ghost = 'w-full rounded-xl border-2 border-arc-cyan/40 bg-slate-800 py-3 text-sm';

/** Focus Forge: a timer that pays Focus XP, with a one-tap way to finish your focus quest. */
export function FocusScreen({ state, onCompleteQuest }: { state: GameState; onCompleteQuest: (h: Habit, o: Origin) => void }) {
  const t = useFocusTimer();
  const soundOn = useSettings((s) => s.sound);
  const suggested = suggestedFocusMinutes(state);
  const quest = focusQuest(state);
  const [minutes, setMinutes] = useState(suggested);
  const today = todayFocus(state);
  const busy = t.status === 'running' || t.status === 'paused';
  const presets = Array.from(new Set([15, 25, 45, 60, suggested])).sort((a, b) => a - b);

  const shown = t.status === 'idle' ? minutes * 60 : t.remainingSec;
  const total = t.status === 'idle' ? minutes * 60 : t.durationSec;
  const progress = t.status === 'idle' ? 0 : total ? 1 - shown / total : 1;
  const begin = (m: number, mode: 'focus' | 'break' = 'focus'): void => {
    useFocusTimer.getState().start(m, mode);
    playChime('start');
  };
  const doneFocus = t.status === 'finished' && t.mode === 'focus' && t.result;
  const canCompleteQuest = !!(doneFocus && quest?.target && t.result!.minutes >= targetAmount(quest.target));

  return (
    <section className="space-y-5" aria-label="Focus Forge">
      <h2 className="text-lg font-bold">Focus Forge</h2>

      <div className="glass flex flex-col items-center gap-4 p-5">
        <div className="relative h-[240px] w-[240px]">
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="120" cy="120" r={R} fill="none" stroke="#26305f" strokeWidth="12" />
            <circle
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke={t.mode === 'break' ? '#B8F5C8' : '#C9B6FF'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ transition: 'stroke-dashoffset .5s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-pixel text-3xl tabular-nums" role="timer" aria-live="off">
              {fmt(shown)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {t.status === 'idle' && 'Ready'}
              {t.status === 'running' && (t.mode === 'focus' ? 'Focus' : 'Break')}
              {t.status === 'paused' && 'Paused'}
              {t.status === 'finished' && 'Done'}
            </p>
          </div>
        </div>

        {!busy && (
          <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Session length">
            {presets.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={minutes === m}
                onClick={() => setMinutes(m)}
                className={`rounded-full border-2 px-3 py-1.5 text-sm ${minutes === m ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/40 text-slate-400'}`}
              >
                {m} min{quest?.target && m === suggested && suggested !== 25 ? ' · quest' : ''}
              </button>
            ))}
          </div>
        )}

        <div className="w-full space-y-2">
          {!busy && <button type="button" className={primary} onClick={() => begin(minutes)}>Start focus</button>}
          {t.status === 'running' && <button type="button" className={ghost} onClick={() => useFocusTimer.getState().pause()}>Pause</button>}
          {t.status === 'paused' && (
            <>
              <button type="button" className={primary} onClick={() => useFocusTimer.getState().resume()}>Resume</button>
              <button type="button" className={ghost} onClick={() => useFocusTimer.getState().reset()}>Reset</button>
            </>
          )}
          {t.status === 'running' && <button type="button" className="w-full py-1 text-xs text-slate-400 underline" onClick={() => useFocusTimer.getState().reset()}>Stop and discard</button>}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={t.ambient} onChange={(e) => t.setAmbient(e.target.checked)} />
          Ambient sound
        </label>
        {t.ambient && !soundOn && <p className="text-xs text-slate-400">Turn on Sound effects in Settings to hear it.</p>}
      </div>

      {doneFocus && (
        <div className="glass space-y-3 border-arc-emerald/60 p-4 text-center shadow-glow-emerald">
          <p className="font-bold text-arc-emerald">Session complete</p>
          <p className="text-sm text-slate-300">
            {t.result!.minutes} min logged.{' '}
            {t.result!.xp > 0 ? `+${t.result!.xp} Focus XP.` : 'You have reached today’s timer XP limit, but the time still counts.'}
          </p>
          {canCompleteQuest && quest && (
            <button
              type="button"
              className={primary}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                onCompleteQuest(quest, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
              }}
            >
              Complete “{questLabel(quest)}”
            </button>
          )}
          <button type="button" className={ghost} onClick={() => begin(5, 'break')}>Start a 5 minute break</button>
        </div>
      )}
      {t.status === 'finished' && t.mode === 'break' && <p className="text-center text-sm text-slate-300">Break over. Ready for another round?</p>}

      <p className="text-center text-xs text-slate-400">
        Today: {today.sessions} {today.sessions === 1 ? 'session' : 'sessions'} · {today.minutes} min. Sessions of 10 minutes or more earn 1.2 XP a minute, up to 120 base XP a day.
      </p>
    </section>
  );
}
