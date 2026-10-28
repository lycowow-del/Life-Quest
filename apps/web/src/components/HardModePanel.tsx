import { Skull } from 'lucide-react';
import { hardModeStatus, type GameState } from '@la66/core';
import { STAT_META } from '../lib/theme';

const days = (n: number): string => `${n} ${n === 1 ? 'day' : 'days'}`;

/** What Hard Mode would cost right now: XP at risk by quest, the restart warning, and stats about to decay. */
export function HardModePanel({ state }: { state: GameState }) {
  const st = hardModeStatus(state);
  if (!st.active) return null;
  const safe = st.atRisk.length === 0 && !st.restartTonight && st.emptyInARow === 0 && st.decay.length === 0;
  const sum = st.atRisk.reduce((t, a) => t + a.xp, 0);

  return (
    <section aria-label="Hard Mode" className="glass space-y-2 border-arc-crimson/50 p-3 text-sm">
      <p className="flex items-center gap-2 font-bold text-arc-crimson">
        <Skull size={16} /> Hard Mode{st.endsTonight ? ' · ends when today closes' : ''}
      </p>

      {safe && <p className="text-arc-emerald">You are safe today. Nothing is at risk.</p>}

      {st.atRisk.length > 0 && (
        <div>
          <p className="text-slate-200">
            If today closed now you would lose <span className="font-bold text-arc-crimson">{st.totalAtRisk} XP</span>
            {st.totalAtRisk < sum ? ' (you cannot go below 0)' : ''}:
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
            {st.atRisk.map((a) => (
              <li key={a.habit.id} className="flex justify-between gap-3">
                <span className="truncate">{a.habit.name}</span>
                <span className="tabular-nums text-arc-crimson">-{a.xp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {st.restartTonight ? (
        <p className="text-arc-crimson">Finish at least one quest today, or your 66-day cycle restarts tonight.</p>
      ) : (
        st.emptyInARow > 0 && (
          <p className="text-arc-violet">
            {days(st.emptyInARow)} in a row with nothing done. At 3, your cycle restarts.
          </p>
        )
      )}

      {st.decay.map((d) => (
        <p key={d.stat} className="text-xs text-slate-300">
          <span style={{ color: STAT_META[d.stat].color }}>{STAT_META[d.stat].label}</span> has been idle {days(d.idleDays)}:{' '}
          {d.daysLeft === 0
            ? `it loses a level tonight unless you earn ${STAT_META[d.stat].label} XP today.`
            : d.daysLeft === 1
              ? 'it loses a level tomorrow night.'
              : `it loses a level in ${d.daysLeft} nights.`}
        </p>
      ))}
    </section>
  );
}
