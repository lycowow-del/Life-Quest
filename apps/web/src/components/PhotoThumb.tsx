import { X } from 'lucide-react';
import { usePhotoUrl } from '../lib/usePhotoUrl';

export function PhotoThumb({ id, size = 72, onOpen, onRemove }: { id: string; size?: number; onOpen: (id: string) => void; onRemove?: (id: string) => void }) {
  const url = usePhotoUrl(id);
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <button type="button" aria-label="Open photo" onClick={() => onOpen(id)} className="h-full w-full overflow-hidden rounded-xl border-2 border-arc-cyan/40 bg-slate-800">
        {url && <img src={url} alt="Journal page" className="h-full w-full object-cover" />}
      </button>
      {onRemove && (
        <button type="button" aria-label="Remove photo" onClick={() => onRemove(id)} className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-slate-200">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function PhotoViewer({ id, onClose }: { id: string; onClose: () => void }) {
  const url = usePhotoUrl(id);
  return (
    <div role="dialog" aria-modal="true" aria-label="Journal photo" className="fixed inset-0 z-[65] flex items-center justify-center bg-black/90 p-3" onClick={onClose}>
      {url && <img src={url} alt="Journal page" className="max-h-full max-w-full object-contain" />}
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-slate-900 p-2 text-slate-100" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
        <X size={20} />
      </button>
    </div>
  );
}
