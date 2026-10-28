import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

interface Props {
  x: number;
  y: number;
  color: string;
  label: string;
  onDone: () => void;
}

/** Particle burst plus floating XP label, anchored at screen coordinates. */
export function Burst({ x, y, color, label, onDone }: Props) {
  const reduce = useReducedMotion();
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), 1000);
    return () => clearTimeout(t);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2 + Math.random() * 0.4;
        const d = 45 + Math.random() * 70;
        return {
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d,
          size: 4 + Math.random() * 5,
          rot: Math.random() * 360,
          color: i % 3 === 0 ? '#A8E6FF' : i % 3 === 1 ? '#FFB3E6' : color,
        };
      }),
    [color],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
      {!reduce &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-sm"
            style={{ left: x, top: y, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 8px ${p.color}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: p.dx, y: p.dy + 36, opacity: 0, scale: 0.3, rotate: p.rot }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      <motion.div
        className="absolute -translate-x-1/2 text-xl font-bold tabular-nums text-arc-emerald"
        style={{ left: x, top: y - 28, textShadow: '0 0 10px #B8F5C8' }}
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: reduce ? 0 : -52 }}
        transition={{ duration: 0.95 }}
      >
        {label}
      </motion.div>
    </div>
  );
}
