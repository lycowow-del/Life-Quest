import { AnimatePresence, motion } from 'framer-motion';

export interface ToastData {
  id: number;
  title: string;
  sub: string;
  color: string;
}

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="glass px-5 py-3 text-center"
            style={{ borderColor: toast.color, boxShadow: `0 0 28px ${toast.color}66` }}
          >
            <p className="text-lg font-bold" style={{ color: toast.color }}>
              {toast.title}
            </p>
            <p className="text-xs text-slate-300">{toast.sub}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
