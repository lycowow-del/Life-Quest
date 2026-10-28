import { useEffect, useState } from 'react';
import { Hub } from './components/Hub';
import { Onboarding } from './components/Onboarding';
import { PwaBanner } from './components/PwaBanner';
import { Welcome } from './components/Welcome';
import { useGame } from './store/gameStore';
import { useDateSync } from './store/useDateSync';

export default function App() {
  const hydrated = useGame((s) => s.hydrated);
  const state = useGame((s) => s.state);
  const [view, setView] = useState<'welcome' | 'onboarding'>('welcome');
  useDateSync();
  useEffect(() => {
    void useGame.getState().hydrate();
  }, []);

  let screen;
  if (!hydrated) screen = <p className="min-h-screen bg-obsidian p-6 font-display text-slate-400">Loading…</p>;
  else if (state) screen = <Hub state={state} />;
  else if (view === 'onboarding') screen = <Onboarding onBack={() => setView('welcome')} />;
  else screen = <Welcome onBegin={() => setView('onboarding')} />;

  return (
    <>
      {screen}
      <PwaBanner />
    </>
  );
}
