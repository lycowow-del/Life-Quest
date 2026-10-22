import { Bell, X } from 'lucide-react';

export function ReminderBanner({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div role="status" className="glass flex items-center gap-3 border-arc-violet/60 p-3 text-sm">
      <Bell size={18} className="flex-none text-arc-violet" />
      <span className="flex-1">{text}</span>
      <button type="button" aria-label="Dismiss reminder" onClick={onClose} className="p-1 text-slate-400">
        <X size={16} />
      </button>
    </div>
  );
}
