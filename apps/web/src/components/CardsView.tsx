import { useEffect, useState } from 'react';
import { MILESTONE_DAYS, MILESTONE_MIN_ACTIVE_RATIO, addDaysToKey, cycleDay, cycleHeatmap, type GameState, type Milestone } from '@la66/core';
import { downloadCanvas, renderSkillCard } from '../lib/skillCard';
import { useGame } from '../store/gameStore';

const cache = new Map<string, { canvas: HTMLCanvasElement; url: string }>();

function useCard(m: Milestone, player: string, dateLabel: string) {
  const [card, setCard] = useState(cache.get(m.id) ?? null);
  useEffect(() => {
    if (cache.has(m.id)) {
      setCard(cache.get(m.id)!);
      return;
    }
    let alive = true;
    void renderSkillCard(m, { player, dateLabel }).then((canvas) => {
      const entry = { canvas, url: canvas.toDataURL('image/png') };
      cache.set(m.id, entry);
      if (alive) setCard(entry);
    });
    return () => {
      alive = false;
    };
  }, [m, player, dateLabel]);
  return card;
}

function Thumb({ m, player, dateLabel, onOpen }: { m: Milestone; player: string; dateLabel: string; onOpen: () => void }) {
  const card = useCard(m, player, dateLabel);
  return (
    <button type="button" onClick={onOpen} aria-label={`Open the day ${m.day} ${m.rarity} skill card`} className="aspect-[480/680] overflow-hidden rounded-xl bg-slate-800">
      {card ? <img src={card.url} alt={`Day ${m.day} ${m.rarity} skill card`} className="h-full w-full object-contain" /> : <span className="text-xs text-slate-500">Drawing…</span>}
    </button>
  );
}

function Viewer({ m, player, dateLabel, onClose }: { m: Milestone; player: string; dateLabel: string; onClose: () => void }) {
  const card = useCard(m, player, dateLabel);
  return (
    <div role="dialog" aria-modal="true" aria-label="Skill card" className="fixed inset-0 z-[65] flex flex-col items-center justify-center gap-4 bg-black/90 p-4" onClick={onClose}>
      {card && <img src={card.url} alt={`Day ${m.day} ${m.rarity} skill card`} className="max-h-[70vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />}
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={!card}
          onClick={() => card && downloadCanvas(card.canvas, `life-quest-card-day${m.day}-${m.rarity}.png`)}
          className="rounded-xl bg-arc-violet px-5 py-3 font-bold text-obsidian disabled:opacity-40"
        >
          Download image
        </button>
        <button type="button" onClick={onClose} className="rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-5 py-3">
          Close
        </button>
      </div>
    </div>
  );
}

/** Collected skill cards, and what is still needed for the ones not yet earned this cycle. */
export function CardsView({ state }: { state: GameState }) {
  const startDateKey = useGame((s) => s.startDateKey);
  const [open, setOpen] = useState<Milestone | null>(null);
  const p = state.profile;
  const cards = [...state.milestones].sort((a, b) => b.unlockedOnDay - a.unlockedOnDay || b.day - a.day);
  const have = new Set(state.milestones.filter((m) => m.cycle === p.cycle).map((m) => m.day));
  const cells = cycleHeatmap(state);
  const cd = cycleDay(p);
  const activeBy = (day: number): number =>
    cells.filter((c) => c.cycleDay <= day && (c.kind === 'complete' || c.kind === 'partial' || c.kind === 'rest' || (c.kind === 'today' && c.done > 0))).length;
  const dateOf = (m: Milestone): string =>
    startDateKey
      ? new Date(`${addDaysToKey(startDateKey, m.unlockedOnDay - 1)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : `Day ${m.unlockedOnDay}`;

  return (
    <section className="space-y-4" aria-label="Skill cards">
      <p className="text-sm text-slate-300">
        Earn a card on day 7, 21, 30 and 66 of each cycle by being active on at least 70% of the days. Rarity goes from common to mythic.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {MILESTONE_DAYS.filter((d) => !have.has(d)).map((d) => {
          const need = Math.ceil(d * MILESTONE_MIN_ACTIVE_RATIO);
          return (
            <div key={d} className="glass flex aspect-[480/680] flex-col items-center justify-center gap-2 border-dashed p-3 text-center">
              <span className="text-2xl">🔒</span>
              <p className="font-pixel text-[10px]">DAY {d}</p>
              <p className="text-[11px] text-slate-400">
                {cd >= d ? `Needs ${need} active days. You have ${activeBy(d)}.` : `In ${d - cd} days. ${need} active days needed.`}
              </p>
            </div>
          );
        })}
      </div>

      <h3 className="px-1 text-sm font-medium text-arc-cyan">Collected ({cards.length})</h3>
      {cards.length === 0 && <p className="glass p-4 text-center text-sm text-slate-400">No cards yet. Your first one is on day 7.</p>}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((m) => (
          <Thumb key={m.id} m={m} player={p.name} dateLabel={dateOf(m)} onOpen={() => setOpen(m)} />
        ))}
      </div>
      {open && <Viewer m={open} player={p.name} dateLabel={dateOf(open)} onClose={() => setOpen(null)} />}
    </section>
  );
}
