import { Moon, Sun, Sunrise, Trophy } from 'lucide-react';
import {
  activeHabits,
  dueNote,
  bossWeekStatus,
  groupByTimeOfDay,
  questXp,
  targetScale,
  todayProgress,
  upcomingRoutine,
  upcomingUnlocks,
  type GameState,
  type Habit,
  type TimeOfDay,
} from '@la66/core';
import { STAT_META, TIME_LABEL } from '../lib/theme';
import { HardModePanel } from './HardModePanel';
import { QuestRow, type Origin } from './QuestRow';
import { YesterdayReport } from './YesterdayReport';

const ICON = { morning: Sunrise, afternoon: Sun, evening: Moon } as const;
const ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

export function QuestList({ state, onComplete }: { state: GameState; onComplete: (h: Habit, o: Origin) => void }) {
  const p = state.profile;
  const today = state.logs[p.dayNumber]?.completions ?? [];
  const earned = new Map(today.map((c) => [c.habitId, c.xp]));
  const groups = groupByTimeOfDay(activeHabits(state));
  const progress = todayProgress(state);
  const projectedStreak = today.length === 0 ? p.streak + 1 : p.streak;
  const cleared = progress.total > 0 && progress.done === progress.total;
  const balanced = today.some((c) => c.balancedBonus);
  const boss = bossWeekStatus(state);
  const bossName = boss.stat ? STAT_META[boss.stat].label : '';
  const upcoming = upcomingUnlocks(state);
  const routine = upcomingRoutine(state);

  return (
    <section className="space-y-5" aria-label="Daily quests">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-lg font-bold">Daily quests</h2>
        <span className="text-sm tabular-nums text-slate-400">
          {progress.done}/{progress.total} done
        </span>
      </div>

      <YesterdayReport state={state} />
      <HardModePanel state={state} />

      {boss.active && (
        <div className="glass border-arc-violet/70 p-3 text-sm shadow-glow-violet">
          <p className="font-bold text-arc-violet">
            Boss week: {bossName} ({boss.daysLeft} {boss.daysLeft === 1 ? 'day' : 'days'} left)
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {bossName} quests give {boss.multiplier}x XP. Clear every one of them each day to win a {boss.chestXp} XP chest.
          </p>
        </div>
      )}
      {!boss.active && boss.startsIn > 0 && boss.startsIn <= 7 && (
        <p className="px-1 text-xs text-arc-violet">
          Boss week on {bossName} starts in {boss.startsIn} {boss.startsIn === 1 ? 'day' : 'days'}.
        </p>
      )}
      {boss.chestClaimed && (
        <p className="px-1 text-xs text-arc-emerald">Boss chest claimed: +{boss.chestXp} XP</p>
      )}
      {cleared && (
        <div className="glass border-arc-emerald/60 p-3 text-center shadow-glow-emerald">
          <Trophy className="mx-auto mb-1 text-arc-emerald" size={22} />
          <p className="font-bold text-arc-emerald">All quests cleared</p>
          <p className="text-xs text-slate-400">Your streak is safe. See you tomorrow.</p>
        </div>
      )}
      {balanced && !cleared && (
        <p className="px-1 text-xs text-arc-cyan">Balanced day: +15% XP on your completions</p>
      )}

      {progress.total === 0 && (
        <div className="glass p-4 text-center">
          <p className="font-bold text-arc-cyan">Rest day</p>
          <p className="mt-1 text-xs text-slate-400">Nothing is due today. Your streak is safe.</p>
        </div>
      )}

      {ORDER.map((t) => {
        const list = groups[t];
        if (!list.length) return null;
        const Icon = ICON[t];
        const doneCount = list.filter((h) => earned.has(h.id)).length;
        return (
          <div key={t} className="space-y-2">
            <h3 className="flex items-center gap-2 px-1 text-sm font-medium text-arc-cyan">
              <Icon size={16} /> {TIME_LABEL[t]}
              <span className="ml-auto text-xs tabular-nums text-slate-500">
                {doneCount}/{list.length}
              </span>
            </h3>
            {list.map((h) => (
              <QuestRow
                key={h.id}
                habit={h}
                done={earned.has(h.id)}
                xp={earned.get(h.id) ?? questXp(h.difficulty, projectedStreak, false, boss.active && boss.stat === h.stat ? boss.multiplier : 1, h.target ? targetScale(h.target) : 1)}
                note={dueNote(state, h) ?? undefined}
                onComplete={onComplete}
              />
            ))}
          </div>
        );
      })}

      {routine.length > 0 && (
        <p className="px-1 text-center text-xs text-slate-400">
          Coming up: {routine.slice(0, 3).map((r) => `${r.habit.name} in ${r.inDays} ${r.inDays === 1 ? 'day' : 'days'}`).join(', ')}.
        </p>
      )}

      {upcoming.length > 0 && (
        <p className="px-1 text-center text-xs text-slate-400">
          More quests unlock: {upcoming.map((u) => `${u.count} on day ${u.day}`).join(', ')}.
        </p>
      )}

    </section>
  );
}
