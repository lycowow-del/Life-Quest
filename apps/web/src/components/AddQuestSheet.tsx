import { useState } from 'react';
import { XP_VALUES, type Difficulty, type StatKey, type TimeOfDay } from '@la66/core';
import { useGame } from '../store/gameStore';
import { STAT_META, TIME_LABEL } from '../lib/theme';
import { Sheet } from './Sheet';

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; color?: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="space-y-1.5">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: on ? (o.color ?? '#8B5CF6') : 'rgba(139,92,246,.25)',
                background: on ? `${o.color ?? '#8B5CF6'}26` : 'transparent',
                color: on ? '#fff' : '#94A3B8',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AddQuestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addHabit = useGame((s) => s.addHabit);
  const [name, setName] = useState('');
  const [stat, setStat] = useState<StatKey>('DIS');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    addHabit({ name: n, stat, difficulty, timeOfDay });
    setName('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="New quest">
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={40}
          placeholder="e.g. Read 20 pages"
          aria-label="Quest name"
          enterKeyHint="done"
          className="w-full rounded-xl border border-purple-500/30 bg-slate-800 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500"
        />
        <Choice label="Stat" value={stat} onChange={setStat} options={(Object.keys(STAT_META) as StatKey[]).map((k) => ({ value: k, label: STAT_META[k].label, color: STAT_META[k].color }))} />
        <Choice label="Difficulty" value={difficulty} onChange={setDifficulty} options={(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => ({ value: d, label: `${d[0]!.toUpperCase()}${d.slice(1)} +${XP_VALUES[d]}` }))} />
        <Choice label="When" value={timeOfDay} onChange={setTimeOfDay} options={(Object.keys(TIME_LABEL) as TimeOfDay[]).map((t) => ({ value: t, label: TIME_LABEL[t] }))} />
        <button type="button" disabled={!name.trim()} onClick={submit} className="w-full rounded-xl bg-arc-violet py-3 font-bold text-white shadow-glow-violet disabled:opacity-40">
          Add quest
        </button>
      </div>
    </Sheet>
  );
}
