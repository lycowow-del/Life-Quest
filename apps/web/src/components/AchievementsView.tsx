import { achievementStatus, type AchievementGroup, type GameState } from '@la66/core';

const ORDER: AchievementGroup[] = ['Quests', 'Streaks', 'Ranks', 'Growth', 'Focus', 'Journal', 'Collection'];

export function AchievementsView({ state }: { state: GameState }) {
  const list = achievementStatus(state);
  const done = list.filter((a) => a.unlocked).length;
  return (
    <section className="space-y-4" aria-label="Achievements">
      <div className="glass space-y-2 p-4">
        <p className="text-sm">
          <span className="text-2xl font-bold text-arc-violet tabular-nums">{done}</span> of {list.length} unlocked
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden>
          <div className="h-full rounded-full bg-arc-violet" style={{ width: `${(done / list.length) * 100}%` }} />
        </div>
      </div>
      {ORDER.map((g) => (
        <div key={g} className="space-y-2">
          <h3 className="px-1 text-sm font-medium text-arc-cyan">{g}</h3>
          {list
            .filter((a) => a.def.group === g)
            .map((a) => (
              <div key={a.def.id} className={`glass flex items-center gap-3 p-3 ${a.unlocked ? 'border-arc-emerald/50' : 'opacity-80'}`}>
                <span className="text-2xl" aria-hidden>
                  {a.unlocked ? '🏆' : '🔒'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.def.name}</p>
                  <p className="text-xs text-slate-400">{a.def.description}</p>
                  {a.unlocked ? (
                    <p className="mt-1 text-[11px] text-arc-emerald">Earned on day {a.day}</p>
                  ) : (
                    a.def.target > 1 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800" aria-hidden>
                          <div className="h-full rounded-full bg-arc-cyan" style={{ width: `${(a.value / a.def.target) * 100}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums text-slate-400">
                          {a.value}/{a.def.target}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
        </div>
      ))}
    </section>
  );
}
