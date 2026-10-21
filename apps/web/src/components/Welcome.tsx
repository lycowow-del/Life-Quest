import { useState } from 'react';
import { rankInfo } from '@la66/core';
import { useGame } from '../store/gameStore';
import { ImportButton } from './ImportButton';
import { RankCrest } from './RankCrest';

export function Welcome({ onBegin }: { onBegin: () => void }) {
  const startNewGame = useGame((s) => s.startNewGame);
  const loadError = useGame((s) => s.loadError);
  const [msg, setMsg] = useState('');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-obsidian px-6 font-display">
      <div className="flex flex-col items-center gap-4 text-center">
        <RankCrest rank={rankInfo(0)} size={128} />
        <h1 className="font-pixel text-xl leading-8 text-arc-violet">Life Quest</h1>
        <p className="text-slate-300">Build your character by building your habits. 66 days to turn a routine into automatic.</p>
      </div>
      {loadError && <p className="text-center text-sm text-arc-crimson">{loadError}</p>}
      <button type="button" onClick={onBegin} className="rounded-xl bg-arc-violet py-4 text-lg font-bold text-obsidian shadow-glow-violet">
        Begin your quest
      </button>
      <ImportButton className="rounded-xl border-2 border-arc-cyan/40 bg-slate-800 py-3 text-sm" onResult={setMsg}>
        Import a save
      </ImportButton>
      <button type="button" onClick={() => startNewGame({ name: 'Hunter' })} className="text-sm text-slate-400 underline">
        Skip the quiz
      </button>
      {msg && <p className="text-center text-sm text-slate-300">{msg}</p>}
    </main>
  );
}
