import { motion } from 'framer-motion';
import { CalendarDays, Flame, Skull, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  archetype,
  consistencyMultiplier,
  CYCLE_LENGTH,
  cycleDay,
  levelProgress,
  rankProgress,
  type GameState,
} from '@la66/core';
import { RANK_COLOR } from '../lib/theme';
import { RankCrest } from './RankCrest';

function Chip({ icon, value, label, color }: { icon: ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-800/70 px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-xl font-bold tabular-nums" style={{ color }}>
        {icon}
        {value}
      </div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

export function PlayerHeader({ state }: { state: GameState }) {
  const p = state.profile;
  const lp = levelProgress(p.totalXp);
  const rp = rankProgress(p.totalXp);
  const day = Math.min(cycleDay(p), CYCLE_LENGTH);
  const color = RANK_COLOR[rp.rank];

  return (
    <header className="glass relative overflow-hidden p-4" style={{ boxShadow: `0 0 28px ${color}40` }}>
      <div
        className="pointer-events-none absolute -left-12 -top-16 h-52 w-52 rounded-full blur-3xl"
        style={{ background: `${color}33` }}
        aria-hidden
      />
      <div className="relative flex items-center gap-4">
        <RankCrest rank={rp.rank} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-xs text-slate-400">
            <span className="truncate">
              {p.name} · {archetype(p.statXp)}
            </span>
            {p.mode === 'hard' && (
              <span className="flex items-center gap-1 rounded bg-arc-crimson/20 px-1.5 py-0.5 text-[10px] font-bold text-arc-crimson">
                <Skull size={10} /> HARD
              </span>
            )}
          </p>
          <p className="text-4xl font-bold leading-none tabular-nums">
            <span className="mr-1 text-base font-medium text-slate-400">LV</span>
            {lp.level}
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="XP to next level" aria-valuenow={Math.round(lp.ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-arc-violet to-arc-cyan"
              style={{ boxShadow: '0 0 10px #8B5CF6' }}
              initial={false}
              animate={{ width: `${lp.ratio * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-1 text-xs tabular-nums text-slate-400">
            {lp.xpIntoLevel}/{lp.xpForNext} XP · {rp.next ? `${rp.xpToNext} to rank ${rp.next}` : 'max rank'}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <Chip icon={<Flame size={18} />} value={String(p.streak)} label="day streak" color="#F97316" />
        <Chip icon={<CalendarDays size={18} />} value={`${day}/${CYCLE_LENGTH}`} label="cycle" color="#06B6D4" />
        <Chip icon={<Zap size={18} />} value={`${consistencyMultiplier(p.streak).toFixed(2)}x`} label="multiplier" color="#8B5CF6" />
      </div>
      <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-slate-800" aria-hidden>
        <div className="h-full rounded-full bg-arc-cyan/70" style={{ width: `${(day / CYCLE_LENGTH) * 100}%` }} />
      </div>
    </header>
  );
}
