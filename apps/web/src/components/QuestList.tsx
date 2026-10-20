import { Moon, Sun, Sunrise, Trophy } from 'lucide-react';
import {
  activeHabits,
  groupByTimeOfDay,
  penaltyAtRisk,
  questXp,
  todayProgress,
  type GameState,
  type Habit,
  type TimeOfDay,
} from '@la66/core';
import { TIME_LABEL } from '../lib/theme';
import { QuestRow, type Origin } from './QuestRow';

const ICON = { morning: Sunrise, afternoon: Sun, evening: Moon } as const;
const ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

export function QuestList({ state, onComplete }: { state: GameState; onComplete: (h: Habit, o: Origin) => void }) {
  const p = state.profile;
  const today = state.logs[p.dayNumber]?.completions ?? [];
  const earned = new Map(today.map((c) => [c.habitId, c.xp]));
  const groups = groupByTimeOfDay(activeHabits(state));
  const progress = todayProgress(state);
  const risk = penaltyAtRisk(state);
  const projectedStreak = today.length === 0 ? p.streak + 1 : p.streak;
  const cleared = progress.total > 0 && progress.done === progress.total;
  const balanced = today.some((c) => c.balancedBonus);

  return (
    <section className="space-y-5" aria-label="Daily quests">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-lg font-bold">Daily quests</h2>
        <span className="text-sm tabular-nums text-slate-400">
          {progress.done}/{progress.total} done
        </span>
      </div>

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
                xp={earned.get(h.id) ?? questXp(h.difficulty, projectedStreak, false)}
                onComplete={onComplete}
              />
            ))}
          </div>
        );
      })}

      {risk > 0 && (
        <p className="rounded-xl border border-arc-crimson/40 bg-arc-crimson/10 p-3 text-center text-sm text-arc-crimson">
          Hard Mode: finishing the day now costs you {risk} XP
        </p>
      )}
    </section>
  );
}
