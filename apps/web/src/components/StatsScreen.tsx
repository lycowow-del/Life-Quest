import { useState } from 'react';
import {
  archetype,
  cycleHeatmap,
  cycleStats,
  lifetimeTotals,
  rankInfo,
  statSummary,
  type GameState,
  type HeatCell,
  type HeatKind,
} from '@la66/core';
import { STAT_META } from '../lib/theme';
import { AchievementsView } from './AchievementsView';
import { CardsView } from './CardsView';
import { StatEmblem } from './StatEmblem';

const KIND_COLOR: Record<HeatKind, string> = {
  complete: '#B8F5C8',
  partial: 'rgba(255,179,230,.65)',
  missed: 'rgba(255,179,179,.55)',
  rest: 'rgba(168,230,255,.35)',
  today: 'rgba(168,230,255,.12)',
  future: '#1e2748',
  none: '#1e2748',
};

function describe(c: HeatCell): string {
  const base = `Day ${c.cycleDay}`;
  switch (c.kind) {
    case 'complete':
      return `${base}: all ${c.due} ${c.due === 1 ? 'quest' : 'quests'} done`;
    case 'partial':
      return `${base}: ${c.done} of ${c.due} quests done`;
    case 'missed':
      return `${base}: missed`;
    case 'rest':
      return `${base}: rest day, nothing due`;
    case 'today':
      return `${base} (today): ${c.done} of ${c.due} done so far`;
    case 'future':
      return `${base}: still ahead`;
    default:
      return `${base}: no record`;
  }
}

function Radar({ state }: { state: GameState }) {
  const stats = statSummary(state);
  const top = Math.max(5, ...stats.map((s) => s.level));
  const C = 130;
  const R = 80;
  const point = (i: number, f: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [C + Math.cos(a) * R * f, C + Math.sin(a) * R * f];
  };
  const ring = (f: number): string => stats.map((_, i) => point(i, f).join(',')).join(' ');
  const shape = stats.map((s, i) => point(i, s.level / top).join(',')).join(' ');
  return (
    <svg
      viewBox="0 0 260 260"
      className="mx-auto w-full max-w-[300px]"
      role="img"
      aria-label={`Stat radar. ${stats.map((s) => `${STAT_META[s.key].label} level ${s.level}`).join(', ')}.`}
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="#2a3563" />
      ))}
      {stats.map((s, i) => (
        <line key={s.key} x1={C} y1={C} x2={point(i, 1)[0]} y2={point(i, 1)[1]} stroke="#2a3563" />
      ))}
      <polygon points={shape} fill="rgba(255,179,230,.3)" stroke="#FFB3E6" strokeWidth="2" />
      {stats.map((s, i) => {
        const [x, y] = point(i, s.level / top);
        const [lx, ly] = point(i, 1.32);
        return (
          <g key={s.key}>
            <circle cx={x} cy={y} r="3.5" fill={STAT_META[s.key].color} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill={STAT_META[s.key].color}>
              {s.key} {s.level}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Tile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-800/70 p-3 text-center">
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

/** Stats tab: stat radar, 66-day heatmap for the current cycle, and lifetime totals. */
function Overview({ state }: { state: GameState }) {
  const [selected, setSelected] = useState<number | null>(null);
  const p = state.profile;
  const rk = rankInfo(p.totalXp);
  const cells = cycleHeatmap(state);
  const cs = cycleStats(cells);
  const totals = lifetimeTotals(state);
  const stats = statSummary(state);
  const levels = stats.map((s) => s.level);
  const lagging = Math.max(...levels) === Math.min(...levels) ? null : [...stats].sort((a, b) => a.xp - b.xp)[0]!.key;
  const sel = selected ? cells[selected - 1] : undefined;

  return (
    <section className="space-y-5" aria-label="Stats">
      <h2 className="text-lg font-bold">Stats</h2>

      <div className="glass space-y-3 p-4">
        <p className="text-center text-sm text-slate-300">
          <span className="font-bold text-arc-violet">{archetype(p.statXp)}</span> · {rk.label} · {p.totalXp.toLocaleString()} XP
        </p>
        <Radar state={state} />
        <div className="space-y-2">
          {stats.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <StatEmblem stat={s.key} size={32} labelled />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-medium" style={{ color: STAT_META[s.key].color }}>
                    {STAT_META[s.key].label}
                  </span>
                  <span className="tabular-nums text-slate-400">level {s.level}</span>
                  {p.bossStat === s.key && <span className="rounded bg-arc-violet/20 px-1.5 text-[10px] text-arc-violet">boss stat</span>}
                  {lagging === s.key && <span className="rounded bg-arc-crimson/20 px-1.5 text-[10px] text-arc-crimson">lagging</span>}
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${s.ratio * 100}%`, background: STAT_META[s.key].color }} />
                </div>
              </div>
              <span className="text-xs tabular-nums text-slate-400">{s.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass space-y-3 p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-medium">66-day cycle {p.cycle > 1 ? `(cycle ${p.cycle})` : ''}</p>
          <p className="text-xs text-slate-400">{cs.rate === null ? 'No days finished yet' : `${Math.round(cs.rate * 100)}% perfect days`}</p>
        </div>
        <div className="grid grid-cols-11 gap-1">
          {cells.map((c) => (
            <button
              key={c.day}
              type="button"
              aria-label={describe(c)}
              onClick={() => setSelected(selected === c.cycleDay ? null : c.cycleDay)}
              className="relative aspect-square rounded-[4px]"
              style={{
                background: KIND_COLOR[c.kind],
                outline: c.kind === 'today' ? '2px solid #A8E6FF' : selected === c.cycleDay ? '2px solid #fff' : undefined,
                boxShadow: c.boss ? 'inset 0 -3px 0 #C9B6FF' : undefined,
              }}
            >
              {c.milestone && <span className="absolute inset-0 grid place-items-center text-[9px] text-slate-900">◆</span>}
            </button>
          ))}
        </div>
        <p className="min-h-[1.25rem] text-xs text-slate-300" role="status">
          {sel ? `${describe(sel)}${sel.boss ? ' · boss week' : ''}${sel.milestone ? ' · skill card day' : ''}` : 'Tap a day for details.'}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
          {(
            [
              ['complete', 'All done'],
              ['partial', 'Some done'],
              ['missed', 'Missed'],
              ['rest', 'Rest day'],
            ] as [HeatKind, string][]
          ).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: KIND_COLOR[k] }} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: '#1e2748', boxShadow: 'inset 0 -3px 0 #C9B6FF' }} />
            Boss week
          </span>
          <span>◆ Skill card day</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Tile value={String(cs.complete)} label="perfect" color="#B8F5C8" />
          <Tile value={String(cs.partial)} label="partial" color="#FFB3E6" />
          <Tile value={String(cs.missed)} label="missed" color="#FFB3B3" />
          <Tile value={String(cs.rest)} label="rest" color="#A8E6FF" />
        </div>
      </div>

      <div className="glass space-y-2 p-4">
        <p className="font-medium">All time</p>
        <div className="grid grid-cols-2 gap-2">
          <Tile value={totals.questsCompleted.toLocaleString()} label="quests completed" color="#FFB38A" />
          <Tile value={String(totals.bestStreak)} label="best streak" color="#FFB38A" />
          <Tile value={`${totals.focusMinutes.toLocaleString()} min`} label={`focus, ${totals.focusSessions} sessions`} color="#C9B6FF" />
          <Tile value={String(totals.journalDays)} label="journal days" color="#FFB3E6" />
          <Tile value={String(totals.activeDays)} label="active days" color="#B8F5C8" />
          <Tile value={String(totals.skillCards)} label="skill cards" color="#A8E6FF" />
        </div>
      </div>
    </section>
  );
}

const VIEWS = [
  { value: 'overview', label: 'Overview' },
  { value: 'cards', label: 'Cards' },
  { value: 'achievements', label: 'Achievements' },
] as const;

/** Stats tab: overview (radar, heatmap, totals), skill cards, and achievements. */
export function StatsScreen({ state }: { state: GameState }) {
  const [view, setView] = useState<(typeof VIEWS)[number]['value']>('overview');
  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="Stats sections">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="tab"
            aria-selected={view === v.value}
            onClick={() => setView(v.value)}
            className={`flex-1 rounded-full border-2 px-2 py-2 text-sm ${view === v.value ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/40 text-slate-400'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === 'overview' && <Overview state={state} />}
      {view === 'cards' && <CardsView state={state} />}
      {view === 'achievements' && <AchievementsView state={state} />}
    </div>
  );
}
