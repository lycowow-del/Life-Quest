import type { TargetUnit } from '@la66/core';

const UNITS: { value: TargetUnit; label: string }[] = [
  { value: 'min', label: 'minutes' },
  { value: 'pages', label: 'pages' },
  { value: 'steps', label: 'steps' },
  { value: 'reps', label: 'reps' },
  { value: 'lines', label: 'lines' },
];

interface Props {
  amount: string;
  unit: TargetUnit;
  onAmount: (v: string) => void;
  onUnit: (u: TargetUnit) => void;
}

/** Optional amount for a quest. A quest with an amount grows 25% every 5 completed days. */
export function TargetFields({ amount, unit, onAmount, onUnit }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">Track an amount (optional)</p>
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => onAmount(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="e.g. 30"
          aria-label="Amount"
          className="w-24 rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500"
        />
        <select
          value={unit}
          onChange={(e) => onUnit(e.target.value as TargetUnit)}
          aria-label="Unit"
          className="rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-3 py-2 text-base text-slate-100"
        >
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      {amount && <p className="text-xs text-slate-400">It grows 25% every 5 completed days, and its XP grows with it.</p>}
    </div>
  );
}
