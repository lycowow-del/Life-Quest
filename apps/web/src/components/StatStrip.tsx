import { statSummary, type GameState } from '@la66/core';
import { STAT_META } from '../lib/theme';

export function StatStrip({ state }: { state: GameState }) {
  return (
    <section aria-label="Stats" className="glass grid grid-cols-5 gap-2 p-3">
      {statSummary(state).map((s) => {
        const color = STAT_META[s.key].color;
        return (
          <div key={s.key} className="text-center" title={STAT_META[s.key].label}>
            <div className="text-[11px] font-medium" style={{ color }}>
              {s.key}
            </div>
            <div className="text-xl font-bold tabular-nums">{s.level}</div>
            <div className="mx-auto mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${s.ratio * 100}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
