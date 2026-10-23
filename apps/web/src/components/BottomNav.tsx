import { BookOpen, Home, Timer } from 'lucide-react';

export type Tab = 'quests' | 'focus' | 'journal';

const ITEMS: { tab: Tab; label: string; Icon: typeof Home }[] = [
  { tab: 'quests', label: 'Quests', Icon: Home },
  { tab: 'focus', label: 'Focus', Icon: Timer },
  { tab: 'journal', label: 'Journal', Icon: BookOpen },
];

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-arc-cyan/30 bg-obsidian/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {ITEMS.map(({ tab: t, label, Icon }) => (
          <button
            key={t}
            type="button"
            aria-current={tab === t ? 'page' : undefined}
            onClick={() => onTab(t)}
            className={`flex flex-col items-center gap-1 py-3 text-xs ${tab === t ? 'text-arc-violet' : 'text-slate-400'}`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
