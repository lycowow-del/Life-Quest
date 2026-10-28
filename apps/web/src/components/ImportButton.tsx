import type { ChangeEvent, ReactNode } from 'react';
import { useGame } from '../store/gameStore';
import { readFileText } from '../store/saveFile';

export function ImportButton({ className, onResult, children }: { className: string; onResult: (msg: string) => void; children: ReactNode }) {
  const importJson = useGame((s) => s.importJson);
  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = importJson(await readFileText(f));
    onResult(r.ok ? 'Save imported.' : (r.error ?? 'Import failed.'));
    e.target.value = '';
  };
  return (
    <label className={`${className} cursor-pointer text-center`}>
      {children}
      <input type="file" accept="application/json,.json" className="hidden" onChange={onChange} />
    </label>
  );
}
