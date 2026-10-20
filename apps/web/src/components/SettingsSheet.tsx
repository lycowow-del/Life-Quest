import { useState } from 'react';
import type { GameState } from '@la66/core';
import { useGame } from '../store/gameStore';
import { downloadText } from '../store/saveFile';
import { ImportButton } from './ImportButton';
import { Sheet } from './Sheet';

const ghost = 'rounded-xl border border-purple-500/30 bg-slate-800 px-4 py-3 text-sm';

export function SettingsSheet({ open, onClose, state }: { open: boolean; onClose: () => void; state: GameState }) {
  const g = useGame();
  const [msg, setMsg] = useState('');
  const [sure, setSure] = useState(false);
  const hard = state.profile.mode === 'hard';

  return (
    <Sheet open={open} onClose={() => { setSure(false); onClose(); }} title="Settings">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold">Hard Mode</p>
            <p className="text-xs text-slate-400">Missed quests cost half their XP, 3 empty days restart your cycle, idle stats decay.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hard}
            aria-label="Hard Mode"
            onClick={() => g.setMode(hard ? 'standard' : 'hard')}
            className={`relative h-7 w-12 flex-none rounded-full transition-colors ${hard ? 'bg-arc-crimson' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${hard ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={ghost}
            onClick={() => {
              const j = g.exportJson();
              if (j) downloadText('life-arc-66-save.json', j);
            }}
          >
            Export save
          </button>
          <ImportButton className={ghost} onResult={setMsg}>
            Import save
          </ImportButton>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-700 p-3">
          <p className="text-xs text-slate-400">Developer tools (removed before v1.0)</p>
          <button type="button" className={`${ghost} w-full`} onClick={g.devSkipDay}>
            Skip to next day
          </button>
        </div>

        <button
          type="button"
          className={`${ghost} w-full text-arc-crimson`}
          onClick={() => {
            if (sure) void g.reset();
            else setSure(true);
          }}
        >
          {sure ? 'Tap again to erase everything' : 'Reset all data'}
        </button>
        {msg && <p className="text-center text-sm text-slate-300">{msg}</p>}
      </div>
    </Sheet>
  );
}
