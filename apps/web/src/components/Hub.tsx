import { AnimatePresence } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STARTER_HABITS,
  activeHabits,
  rankInfo,
  reminderBanner,
  toDateKey,
  type GameState,
  type Habit,
  type RankInfo,
} from '@la66/core';
import { contextFor, useReminders } from '../lib/useReminders';
import { STAT_META } from '../lib/theme';
import { useGame } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';
import { AddQuestSheet } from './AddQuestSheet';
import { Burst } from './Burst';
import { PlayerHeader } from './PlayerHeader';
import { PromotionScene } from './PromotionScene';
import { QuestList } from './QuestList';
import { ReminderBanner } from './ReminderBanner';
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
  const [promo, setPromo] = useState<{ from: RankInfo; to: RankInfo } | null>(null);
  const [sheet, setSheet] = useState<'add' | 'settings' | null>(null);
  const seq = useRef(0);
  const reminders = useSettings((s) => s.reminders);
  const vibrate = useSettings((s) => s.vibrate);
  const [dismissedDay, setDismissedDay] = useState('');
  const [, setTick] = useState(0);
  useReminders(state);

  // Re-evaluate the reminder banner as the clock moves.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const now = new Date();
  const banner = reminderBanner(reminders, contextFor(state, now, {}));
  const todayKey = toDateKey(now);
  const pending = useRef<ToastData | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const removeBurst = useCallback((id: number) => setBursts((b) => b.filter((x) => x.id !== id)), []);
  const closePromo = useCallback(() => {
    setPromo(null);
    if (pending.current) {
      setToast(pending.current);
      pending.current = null;
    }
  }, []);

  const onComplete = (habit: Habit, origin: Origin) => {
    const before = rankInfo(state.profile.totalXp);
    const r = complete(habit.id);
    if (!r || !r.ok) return;
    const id = ++seq.current;
    setBursts((b) => [...b, { id, ...origin, color: STAT_META[habit.stat].color, label: `+${r.xpGained} XP` }]);
    if (vibrate) navigator.vibrate?.(15);

    const card = r.newMilestones[0];
    let next: ToastData | null = null;
    if (card) next = { id, title: 'Skill card unlocked', sub: `Day ${card.day} · ${card.rarity}`, color: '#A8E6FF' };
    else if (r.leveledUp) next = { id, title: `Level ${r.newLevel}`, sub: 'Level up', color: '#FFB3E6' };

    if (r.rankedUp) {
      pending.current = next; // shown after the promotion scene
      setPromo({ from: before, to: r.newRank });
    } else if (next) {
      setToast(next);
    }
  };

  const empty = activeHabits(state).length === 0;

  return (
    <div
      className="mx-auto min-h-screen max-w-md bg-obsidian px-4 font-display"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h1 className="font-pixel text-[11px] text-arc-violet">Life Quest</h1>
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
        {banner && dismissedDay !== todayKey && (
          <ReminderBanner text={banner.text} onClose={() => setDismissedDay(todayKey)} />
        )}
        <PlayerHeader state={state} />
        <StatStrip state={state} />
        {empty ? (
          <section className="glass space-y-3 p-6 text-center">
            <p className="text-lg font-bold">No quests yet</p>
            <p className="text-sm text-slate-400">Load a starter pack or write your own.</p>
            <button type="button" onClick={() => addHabits(STARTER_HABITS)} className="w-full rounded-xl bg-arc-violet py-3 font-bold text-obsidian shadow-glow-violet">
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
      <AnimatePresence>{promo && <PromotionScene key={promo.to.step} from={promo.from} to={promo.to} onDone={closePromo} />}</AnimatePresence>
      <Toast toast={toast} />
      <AddQuestSheet open={sheet === 'add'} onClose={() => setSheet(null)} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} state={state} />
    </div>
  );
}
