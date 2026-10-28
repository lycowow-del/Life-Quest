import { useEffect } from 'react';
import { useGame } from './gameStore';

/** Re-syncs the game when the app returns to the foreground or the date rolls over. */
export function useDateSync(): void {
  const sync = useGame((s) => s.syncDate);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    const id = window.setInterval(sync, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
      window.clearInterval(id);
    };
  }, [sync]);
}
