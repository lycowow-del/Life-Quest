import { useEffect } from 'react';
import { Hub } from './components/Hub';
import { Welcome } from './components/Welcome';
import { useGame } from './store/gameStore';
import { useDateSync } from './store/useDateSync';

export default function App() {
  const hydrated = useGame((s) => s.hydrated);
  const state = useGame((s) => s.state);
  useDateSync();
  useEffect(() => {
    void useGame.getState().hydrate();
  }, []);

  if (!hydrated) return <p className="min-h-screen bg-obsidian p-6 font-display text-slate-400">Loading…</p>;
  return state ? <Hub state={state} /> : <Welcome />;
}
