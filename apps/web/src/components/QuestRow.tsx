import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { Habit } from '@la66/core';
import { STAT_META } from '../lib/theme';
import { StatEmblem } from './StatEmblem';

export interface Origin {
  x: number;
  y: number;
}

interface Props {
  habit: Habit;
  done: boolean;
  xp: number; // earned XP if done, projected XP if not
  onComplete: (habit: Habit, origin: Origin) => void;
}

export function QuestRow({ habit, done, xp, onComplete }: Props) {
  const meta = STAT_META[habit.stat];
  const click = (e: MouseEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.querySelector('[data-check]') ?? e.currentTarget;
    const r = box.getBoundingClientRect();
    onComplete(habit, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  return (
    <motion.button
      type="button"
      disabled={done}
      aria-pressed={done}
      aria-label={`${habit.name}, ${done ? `completed, earned ${xp} XP` : `worth about ${xp} XP`}`}
      whileTap={done ? undefined : { scale: 0.97 }}
      onClick={click}
      className={`glass flex w-full items-center gap-3 p-3 text-left transition-colors ${
        done ? 'border-arc-emerald/60 bg-arc-emerald/10' : 'active:border-arc-violet/80'
      }`}
    >
      <span
        data-check
        className={`grid h-9 w-9 flex-none place-items-center rounded-full border-2 ${
          done ? 'border-arc-emerald bg-arc-emerald shadow-glow-emerald' : 'border-arc-violet'
        }`}
      >
        {done && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            <Check size={20} strokeWidth={3} color="#141B3A" />
          </motion.span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-medium ${done ? 'text-slate-400 line-through' : ''}`}>{habit.name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: meta.color }}>
          <StatEmblem stat={habit.stat} size={18} />
          {meta.label}
        </span>
      </span>
      <span className="text-right">
        <span className={`block text-lg font-bold tabular-nums ${done ? 'text-arc-emerald' : ''}`}>+{xp}</span>
        <span className="text-[10px] text-slate-500">{habit.difficulty}</span>
      </span>
    </motion.button>
  );
}
