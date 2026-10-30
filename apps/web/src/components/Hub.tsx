import { AnimatePresence } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STARTER_HABITS,
  hasHabits,
  rankInfo,
  reminderBanner,
  toDateKey,
  type GameState,
  type Habit,
  type RankInfo,
  type Reward,
} from '@la66/core';
import { playChime, startAmbient, stopAmbient } from '../lib/focusAudio';
import { STAT_META } from '../lib/theme';
import { contextFor, useReminders } from '../lib/useReminders';
import { useFocusTimer } from '../store/focusTimer';
import { useGame } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';
import { AddQuestSheet } from './AddQuestSheet';
import { BottomNav, type Tab } from './BottomNav';
import { Burst } from './Burst';
import { FocusScreen } from './FocusScreen';
import { JournalScreen } from './JournalScreen';
import { LibraryScreen } from './LibraryScreen';
import { Onboarding } from './Onboarding';
import { PetCompanion } from './PetCompanion';
import { PlayerHeader } from './PlayerHeader';
import { PromotionScene } from './PromotionScene';
import { QuestList } from './QuestList';
import type { Origin } from './QuestRow';
import { ReminderBanner } from './ReminderBanner';
import { SettingsSheet } from './SettingsSheet';
import { StatsScreen } from './StatsScreen';
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
  const [tab, setTab] = useState<Tab>('quests');
  const [hops, setHops] = useState(0);
  const [bursts, setBursts] = useState<BurstItem[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [promo, setPromo] = useState<{ from: RankInfo; to: RankInfo } | null>(null);
  const [sheet, setSheet] = useState<'add' | 'settings' | null>(null);
  const [retaking, setRetaking] = useState(false);
  const seq = useRef(0);
  const pending = useRef<ToastData | null>(null);
  const reminders = useSettings((s) => s.reminders);
  const vibrate = useSettings((s) => s.vibrate);
  const [dismissedDay, setDismissedDay] = useState('');
  const [, setTick] = useState(0);
  useReminders(state);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const now = new Date();
  const banner = reminderBanner(reminders, contextFor(state, now, {}));
  const todayKey = toDateKey(now);

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

  /** XP from the timer or the journal: a promotion scene if the rank changed, otherwise a banner. */
  const showReward = useCallback((rw: Reward) => {
    const next: ToastData = {
      id: ++seq.current,
      title: `+${rw.xp} ${STAT_META[rw.stat].label} XP`,
      sub: rw.leveledUp ? `Level ${rw.newLevel}` : rw.to.label,
      color: STAT_META[rw.stat].color,
    };
    if (rw.rankedUp) {
      pending.current = next;
      setPromo({ from: rw.from, to: rw.to });
    } else {
      setToast(next);
    }
  }, []);

  const onComplete = (habit: Habit, origin: Origin) => {
    const before = rankInfo(state.profile.totalXp);
    const r = complete(habit.id);
    if (!r || !r.ok) return;
    setHops((h) => h + 1);
    const id = ++seq.current;
    setBursts((b) => [...b, { id, ...origin, color: STAT_META[habit.stat].color, label: `+${r.xpGained} XP` }]);
    if (vibrate) navigator.vibrate?.(15);

    const card = r.newMilestones[0];
    let next: ToastData | null = null;
    if (card) next = { id, title: 'Skill card unlocked', sub: `Day ${card.day} · ${card.rarity}`, color: '#A8E6FF' };
    else if (r.leveledUp) next = { id, title: `Level ${r.newLevel}`, sub: 'Level up', color: '#FFB3E6' };
    else if (r.questLevelUp)
      next = { id, title: 'Quest level up', sub: `${r.questLevelUp.name} is now ${r.questLevelUp.label}`, color: '#B8F5C8' };

    if (r.rankedUp) {
      pending.current = next;
      setPromo({ from: before, to: r.newRank });
    } else if (next) {
      setToast(next);
    }
  };

  // The focus timer keeps running while you look at other tabs, so it is driven from here.
  const onTimerFinished = useCallback(() => {
    const t = useFocusTimer.getState();
    playChime('end');
    if (useSettings.getState().vibrate) navigator.vibrate?.([200, 100, 200]);
    if (t.mode === 'focus') {
      const rw = useGame.getState().completeFocus(t.sessionMinutes);
      t.setResult({ minutes: t.sessionMinutes, xp: rw?.xp ?? 0 });
      if (rw) showReward(rw);
    }
  }, [showReward]);

  useEffect(() => {
    const run = (): void => {
      if (useFocusTimer.getState().tick()) onTimerFinished();
    };
    const id = window.setInterval(run, 500);
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [onTimerFinished]);

  const timerStatus = useFocusTimer((s) => s.status);
  const timerMode = useFocusTimer((s) => s.mode);
  const ambientOn = useFocusTimer((s) => s.ambient);
  useEffect(() => {
    if (timerStatus === 'running' && timerMode === 'focus' && ambientOn) startAmbient();
    else stopAmbient();
    return () => stopAmbient();
  }, [timerStatus, timerMode, ambientOn]);

  const recent = useGame((s) => s.recentAchievements);
  useEffect(() => {
    if (recent.length === 0) return;
    const t = setTimeout(() => {
      setToast({
        id: ++seq.current,
        title: recent.length === 1 ? 'Achievement unlocked' : `${recent.length} achievements unlocked`,
        sub: recent.slice(0, 2).map((a) => a.name).join(', '),
        color: '#FFE08A',
      });
      useGame.getState().clearRecentAchievements();
    }, 1200);
    return () => clearTimeout(t);
  }, [recent]);

  const empty = !hasHabits(state);

  if (retaking) return <Onboarding mode="retake" onBack={() => setRetaking(false)} onDone={() => setRetaking(false)} />;

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
        {banner && dismissedDay !== todayKey && <ReminderBanner text={banner.text} onClose={() => setDismissedDay(todayKey)} />}
        {tab === 'quests' && (
          <>
            <PlayerHeader state={state} />
            <PetCompanion state={state} hop={hops} hour={now.getHours()} />
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
          </>
        )}
        {tab === 'focus' && <FocusScreen state={state} onCompleteQuest={onComplete} />}
        {tab === 'stats' && <StatsScreen state={state} />}
        {tab === 'journal' && <JournalScreen key={state.profile.dayNumber} state={state} onReward={showReward} onOpenLibrary={() => setTab('library')} />}
        {tab === 'library' && <LibraryScreen state={state} />}
      </main>

      <AnimatePresence>
        {bursts.map((b) => (
          <Burst key={b.id} x={b.x} y={b.y} color={b.color} label={b.label} onDone={() => removeBurst(b.id)} />
        ))}
      </AnimatePresence>
      <AnimatePresence>{promo && <PromotionScene key={promo.to.step} from={promo.from} to={promo.to} onDone={closePromo} />}</AnimatePresence>
      <Toast toast={toast} />
      <BottomNav tab={tab} onTab={setTab} />
      <AddQuestSheet open={sheet === 'add'} onClose={() => setSheet(null)} />
      <SettingsSheet
        open={sheet === 'settings'}
        onClose={() => setSheet(null)}
        state={state}
        onRetake={() => {
          setSheet(null);
          setRetaking(true);
        }}
      />
    </div>
  );
}
