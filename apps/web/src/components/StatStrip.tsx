import { statSummary, type GameState } from '@la66/core';
import { STAT_META } from '../lib/theme';
import { StatEmblem } from './StatEmblem';

export function StatStrip({ state }: { state: GameState }) {
  return (
    <section aria-label="Stats" className="glass grid grid-cols-5 gap-2 p-3">
      {statSummary(state).map((s) => {
        const color = STAT_META[s.key].color;
        return (
          <div key={s.key} className="flex flex-col items-center gap-1 text-center" title={STAT_META[s.key].label}>
            <StatEmblem stat={s.key} size={40} labelled />
            <div className="text-xl font-bold leading-none tabular-nums" style={{ color }}>
              {s.level}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${s.ratio * 100}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
