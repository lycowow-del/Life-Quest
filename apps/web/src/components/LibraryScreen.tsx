import { useMemo, useState } from 'react';
import { libraryCounts, libraryEntries, moodAverage, moodStrip, type GameState, type LibraryFilter, type Mood } from '@la66/core';
import { useGame } from '../store/gameStore';
import { PhotoThumb, PhotoViewer } from './PhotoThumb';

const EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
const COLOR: Record<number, string> = { 1: '#FFB3B3', 2: '#FFB38A', 3: '#FFE08A', 4: '#B8F5C8', 5: '#A8E6FF' };
const FILTERS: { value: LibraryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'written', label: 'Written' },
  { value: 'photos', label: 'Photos' },
];
const monthOf = (key: string): string => new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const dayOf = (key: string): string => new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Library: every mood check, journal entry and paper-journal photo, with search and filters. */
export function LibraryScreen({ state }: { state: GameState }) {
  const startDateKey = useGame((s) => s.startDateKey);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [viewing, setViewing] = useState<string | null>(null);
  const counts = libraryCounts(state);
  const strip = moodStrip(state, 30);
  const avg = moodAverage(strip);
  const entries = useMemo(
    () => (startDateKey ? libraryEntries(state, startDateKey, { filter, query }) : []),
    [state, startDateKey, filter, query],
  );

  let lastMonth = '';
  return (
    <section className="space-y-5" aria-label="Library">
      <h2 className="text-lg font-bold">Library</h2>

      <div className="glass space-y-3 p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            [counts.entries, 'days'],
            [counts.written, 'written'],
            [counts.photos, 'photos'],
            [counts.moods, 'moods'],
          ].map(([n, label]) => (
            <div key={label} className="rounded-xl bg-slate-800/70 p-2">
              <p className="text-xl font-bold tabular-nums text-arc-violet">{n}</p>
              <p className="text-[11px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Mood, last 30 days</span>
            <span>{avg === null ? 'no mood checks yet' : `average ${EMOJI[Math.round(avg)]}`}</span>
          </p>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }} role="img" aria-label="Mood for each of the last 30 days">
            {strip.map((m: Mood | null, i) => (
              <span key={i} className="aspect-[1/2] rounded-[2px]" style={{ background: m ? COLOR[m] : '#1e2748' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your journal"
          aria-label="Search your journal"
          className="w-full rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500"
        />
        <div className="flex gap-2" role="radiogroup" aria-label="Filter">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm ${filter === f.value ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/40 text-slate-400'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <p className="glass p-4 text-center text-sm text-slate-400">
          {counts.entries === 0 ? 'Nothing here yet. Your mood checks and journal entries will collect here.' : 'No entries match.'}
        </p>
      )}

      {entries.map((e) => {
        const month = monthOf(e.dateKey);
        const heading = month !== lastMonth ? month : null;
        lastMonth = month;
        return (
          <div key={e.day} className="space-y-2">
            {heading && <h3 className="px-1 pt-1 text-sm font-medium text-arc-cyan">{heading}</h3>}
            <details className="glass p-3">
              <summary className="cursor-pointer text-sm">
                <span className="font-medium">{dayOf(e.dateKey)}</span> {e.mood ? EMOJI[e.mood] : ''}
                {e.photoIds.length > 0 ? ` · ${e.photoIds.length} ${e.photoIds.length === 1 ? 'photo' : 'photos'}` : ''}
                {e.text && <span className="mt-0.5 block truncate text-xs text-slate-400">{e.text}</span>}
              </summary>
              {e.text && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{e.text}</p>}
              {e.photoIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {e.photoIds.map((id) => (
                    <PhotoThumb key={id} id={id} size={72} onOpen={setViewing} />
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-500">Day {e.day}</p>
            </details>
          </div>
        );
      })}

      {viewing && <PhotoViewer id={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
