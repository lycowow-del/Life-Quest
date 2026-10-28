import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** "Ready to use offline" once the app is cached, and a Reload prompt when a new version is waiting. */
export function PwaBanner() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a new version every hour while the app stays open.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady && !needRefresh) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
    >
      <div className="glass flex items-center gap-3 px-4 py-3 text-sm shadow-glow-cyan">
        {needRefresh ? (
          <>
            <span>New version ready</span>
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="rounded-lg bg-arc-violet px-3 py-1.5 font-bold text-obsidian"
            >
              Reload
            </button>
            <button type="button" aria-label="Later" onClick={() => setNeedRefresh(false)} className="p-1 text-slate-400">
              <X size={16} />
            </button>
          </>
        ) : (
          <span>Ready to use offline</span>
        )}
      </div>
    </div>
  );
}
