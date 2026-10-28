import { X } from 'lucide-react';
import { yesterdayReport, type GameState } from '@la66/core';
import { STAT_META } from '../lib/theme';
import { useSettings } from '../store/settingsStore';

/** Explains anything Hard Mode took when the previous day closed. Shown once, then dismissed. */
export function YesterdayReport({ state }: { state: GameState }) {
  const report = yesterdayReport(state);
  const dismissedDay = useSettings((s) => s.reportDay);
  const dismiss = useSettings((s) => s.dismissReport);
  if (!report || dismissedDay === report.day) return null;

  return (
    <section aria-label="Hard Mode report" className="glass space-y-1 border-arc-crimson/50 p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold text-arc-crimson">Hard Mode report: yesterday</p>
        <button type="button" aria-label="Dismiss report" onClick={() => dismiss(report.day)} className="p-1 text-slate-400">
          <X size={16} />
        </button>
      </div>
      {report.lost > 0 && (
        <p className="text-slate-200">
          You lost <span className="font-bold text-arc-crimson">{report.lost} XP</span>
          {report.missed.length > 0 ? ` for missing: ${report.missed.join(', ')}.` : '.'}
        </p>
      )}
      {report.decayed.length > 0 && (
        <p className="text-slate-300">
          {report.decayed.map((s) => STAT_META[s].label).join(' and ')} lost a level from being idle.
        </p>
      )}
      {report.restarted && <p className="text-arc-crimson">Three empty days in a row restarted your 66-day cycle. Your rank, XP and skill cards are kept.</p>}
    </section>
  );
}
