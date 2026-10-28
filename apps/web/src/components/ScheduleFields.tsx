import { WEEKDAY_SHORT } from '@la66/core';
import type { ScheduleDraft } from '../lib/scheduleDraft';

const KINDS: { value: ScheduleDraft['kind']; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'every', label: 'Every few days' },
  { value: 'weekdays', label: 'Set weekdays' },
];

/** How often a quest is due. Quests that are not due today are hidden, and a missed one stays open one extra day. */
export function ScheduleFields({ draft, onChange }: { draft: ScheduleDraft; onChange: (d: ScheduleDraft) => void }) {
  const toggleDay = (d: number): void =>
    onChange({ ...draft, days: draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d].sort((a, b) => a - b) });
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">How often</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How often">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={draft.kind === k.value}
            onClick={() => onChange({ ...draft, kind: k.value })}
            className={`rounded-full border-2 px-3 py-1.5 text-sm ${draft.kind === k.value ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/40 text-slate-400'}`}
          >
            {k.label}
          </button>
        ))}
      </div>
      {draft.kind === 'every' && (
        <div className="flex items-center gap-2 text-sm">
          Every
          <input
            inputMode="numeric"
            value={draft.n}
            onChange={(e) => onChange({ ...draft, n: e.target.value.replace(/\D/g, '').slice(0, 2) })}
            aria-label="Days between repeats"
            className="w-16 rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-3 py-2 text-base text-slate-100"
          />
          days
        </div>
      )}
      {draft.kind === 'weekdays' && (
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_SHORT.map((name, d) => (
            <button
              key={name}
              type="button"
              aria-pressed={draft.days.includes(d)}
              onClick={() => toggleDay(d)}
              className={`h-10 w-12 rounded-xl border-2 text-sm ${draft.days.includes(d) ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/40 text-slate-400'}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {draft.kind !== 'daily' && <p className="text-xs text-slate-400">Not due on other days. If you miss a due day, it stays open for one more day.</p>}
    </div>
  );
}
