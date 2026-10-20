import { AnimatePresence } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STARTER_HABITS, activeHabits, type GameState, type Habit } from '@la66/core';
import { RANK_COLOR, STAT_META } from '../lib/theme';
import { useGame } from '../store/gameStore';
import { AddQuestSheet } from './AddQuestSheet';
import { Burst } from './Burst';
import { PlayerHeader } from './PlayerHeader';
import { QuestList } from './QuestList';
import type { Origin } from './QuestRow';
import { SettingsSheet } from './SettingsSheet';
import { StatStrip } from './StatStrip';
import { Toast, type ToastData } from './Toast';

interface BurstItem extends Origin {
  id: number;
  color: string;
  label: string;
}

export function Hub({ state }: { state: GameState }) {
  const complete = useGame((s) => s.complete);
  const addHabits = useGame((s) => s.addHabits);
  const [bursts, setBursts] = useState<BurstItem[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [sheet, setSheet] = useState<'add' | 'settings' | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const removeBurst = useCallback((id: number) => setBursts((b) => b.filter((x) => x.id !== id)), []);

  const onComplete = (habit: Habit, origin: Origin) => {
    const r = complete(habit.id);
    if (!r || !r.ok) return;
    const id = ++seq.current;
    setBursts((b) => [...b, { id, ...origin, color: STAT_META[habit.stat].color, label: `+${r.xpGained} XP` }]);
    navigator.vibrate?.(15);

    const card = r.newMilestones[0];
    if (card) setToast({ id, title: 'Skill card unlocked', sub: `Day ${card.day} · ${card.rarity}`, color: '#06B6D4' });
    else if (r.rankedUp) setToast({ id, title: `Rank ${r.newRank}`, sub: 'You ascended a rank', color: RANK_COLOR[r.newRank] });
    else if (r.leveledUp) setToast({ id, title: `Level ${r.newLevel}`, sub: 'Level up', color: '#8B5CF6' });
  };

  const empty = activeHabits(state).length === 0;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-obsidian px-4 font-display" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h1 className="text-sm font-medium tracking-wide text-slate-400">Life Arc 66</h1>
        <div className="flex gap-1">
          <button type="button" aria-label="Add quest" onClick={() => setSheet('add')} className="rounded-xl p-2 text-slate-300 active:bg-slate-800">
            <Plus size={22} />
          </button>
          <button type="button" aria-label="Settings" onClick={() => setSheet('settings')} className="rounded-xl p-2 text-slate-300 active:bg-slate-800">
            <Settings size={22} />
          </button>
        </div>
      </div>

      <main className="space-y-4">
        <PlayerHeader state={state} />
        <StatStrip state={state} />
        {empty ? (
          <section className="glass space-y-3 p-6 text-center">
            <p className="text-lg font-bold">No quests yet</p>
            <p className="text-sm text-slate-400">Load a starter pack or write your own.</p>
            <button type="button" onClick={() => addHabits(STARTER_HABITS)} className="w-full rounded-xl bg-arc-violet py-3 font-bold text-white shadow-glow-violet">
              Add starter quests
            </button>
          </section>
        ) : (
          <QuestList state={state} onComplete={onComplete} />
        )}
      </main>

      <AnimatePresence>
        {bursts.map((b) => (
          <Burst key={b.id} x={b.x} y={b.y} color={b.color} label={b.label} onDone={() => removeBurst(b.id)} />
        ))}
      </AnimatePresence>
      <Toast toast={toast} />
      <AddQuestSheet open={sheet === 'add'} onClose={() => setSheet(null)} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} state={state} />
    </div>
  );
}
