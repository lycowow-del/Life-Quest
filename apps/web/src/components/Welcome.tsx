import { useState } from 'react';
import { RankCrest } from './RankCrest';
import { ImportButton } from './ImportButton';
import { useGame } from '../store/gameStore';

export function Welcome() {
  const startNewGame = useGame((s) => s.startNewGame);
  const loadError = useGame((s) => s.loadError);
  const [msg, setMsg] = useState('');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-obsidian px-6 font-display">
      <div className="flex flex-col items-center gap-4 text-center">
        <RankCrest rank="E" size={120} />
        <h1 className="text-4xl font-bold">Life Arc 66</h1>
        <p className="text-slate-400">Build your character by building your habits. 66 days to turn a routine into automatic.</p>
      </div>
      {loadError && <p className="text-center text-sm text-arc-crimson">{loadError}</p>}
      <button type="button" onClick={() => startNewGame({ name: 'Hunter' })} className="rounded-xl bg-arc-violet py-4 text-lg font-bold text-white shadow-glow-violet">
        Begin your arc
      </button>
      <ImportButton className="rounded-xl border border-purple-500/30 bg-slate-800 py-3 text-sm" onResult={setMsg}>
        Import a save
      </ImportButton>
      {msg && <p className="text-center text-sm text-slate-300">{msg}</p>}
    </main>
  );
}
