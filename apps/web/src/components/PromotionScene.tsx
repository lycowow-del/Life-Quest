import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { RankInfo } from '@la66/core';
import { chevronPixels, chevronY } from '../lib/pixel/crest';
import { TIER_COLORS } from '../lib/pixel/palette';
import { playPromotionSound } from '../lib/sound';
import { TIER_COLOR } from '../lib/theme';
import { PixelSprite } from './PixelSprite';
import { RankCrest } from './RankCrest';

const SIZE = 224;

function Particles({ colors, count, spread, top = '50%', delay = 0 }: { colors: string[]; count: number; spread: number; top?: string; delay?: number }) {
  const key = colors.join(',');
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const d = spread * (0.5 + Math.random() * 0.7);
        return {
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d,
          size: 5 + Math.random() * 7,
          rot: Math.random() * 540 - 270,
          color: colors[i % colors.length]!,
        };
      }),
    [key, count, spread],
  );
  return (
    <>
      {items.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-sm"
          style={{ left: '50%', top, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 8px ${p.color}` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy + 30, opacity: 0, scale: 0.3, rotate: p.rot }}
          transition={{ duration: 0.9, delay, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function Backdrop({ color, onClick, children }: { color: string; onClick: () => void; children: ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'rgba(10,14,34,.9)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      role="dialog"
      aria-modal="true"
      aria-label="Rank promotion"
    >
      <div className="pointer-events-none absolute h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: `${color}30` }} aria-hidden />
      {children}
    </motion.div>
  );
}

const pixelText = 'font-pixel text-center leading-6';

/** A division moves up: the new chevron slams in under the shield. */
function DivisionScene({ from, to, onDone }: { from: RankInfo; to: RankInfo; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [landed, setLanded] = useState(!!reduce);
  const done = useRef(onDone);
  done.current = onDone;
  const color = TIER_COLOR[to.tier];
  const k = (to.division ? 5 - to.division : 1) - 1;

  useEffect(() => {
    playPromotionSound('division');
    const t1 = setTimeout(() => setLanded(true), reduce ? 0 : 1300);
    const t2 = setTimeout(() => done.current(), reduce ? 2400 : 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce]);

  return (
    <Backdrop color={color} onClick={onDone}>
      {landed && !reduce && (
        <motion.div className="pointer-events-none fixed inset-0 bg-white" initial={{ opacity: 0.55 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }} aria-hidden />
      )}
      <p className={`${pixelText} mb-8 text-[11px] text-slate-300`}>Division up</p>
      <motion.div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        animate={landed && !reduce ? { x: [0, -9, 9, -6, 6, 0], y: [0, 5, -4, 3, 0] } : {}}
        transition={{ duration: 0.45 }}
      >
        <RankCrest rank={landed ? to : from} size={SIZE} />
        {!landed && (
          <motion.div
            className="absolute inset-0"
            initial={{ y: -280, scale: 2.4, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.55, ease: [0.2, 0.9, 0.3, 1] }}
          >
            <PixelSprite id={`chev-${to.tierIndex}-${k}`} make={() => chevronPixels(to.tierIndex, k)} size={SIZE} glow="#ffffff" />
          </motion.div>
        )}
        {landed && !reduce && (
          <>
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
              style={{ left: '50%', top: `${((chevronY(k) + 1.5) / 64) * 100}%`, width: 90, height: 90, borderColor: color }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <Particles colors={[color, '#ffffff', TIER_COLORS[to.tierIndex]!.light]} count={22} spread={150} top={`${((chevronY(k) + 1.5) / 64) * 100}%`} />
          </>
        )}
      </motion.div>
      <motion.p
        key={landed ? 'after' : 'before'}
        className={`${pixelText} mt-10 text-2xl`}
        style={{ color, textShadow: `0 0 18px ${color}` }}
        initial={{ opacity: 0, scale: landed ? 1.6 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
      >
        {landed ? to.shortLabel : from.shortLabel}
      </motion.p>
      <p className="mt-3 text-xs text-slate-400">{landed ? 'Tap to continue' : ' '}</p>
    </Backdrop>
  );
}

/** A new tier: the old shield breaks apart and the new one forms. */
function TierScene({ from, to, onDone }: { from: RankInfo; to: RankInfo; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<0 | 1 | 2>(reduce ? 2 : 0);
  const done = useRef(onDone);
  done.current = onDone;
  const color = TIER_COLOR[to.tier];
  const oldColors = useMemo(() => {
    const c = TIER_COLORS[from.tierIndex]!;
    return [c.base, c.light, c.dark];
  }, [from.tierIndex]);

  useEffect(() => {
    playPromotionSound('tier');
    if (reduce) {
      const t = setTimeout(() => done.current(), 2600);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase(1), 1000);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => done.current(), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reduce]);

  return (
    <Backdrop color={color} onClick={onDone}>
      {phase === 1 && !reduce && (
        <motion.div className="pointer-events-none fixed inset-0 bg-white" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} aria-hidden />
      )}
      <p className={`${pixelText} mb-8 text-[11px] text-slate-300`}>{phase < 2 ? 'Tier up' : `${from.tier} to ${to.tier}`}</p>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {phase === 2 && !reduce && (
          <>
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: `repeating-conic-gradient(${color}55 0deg 8deg, transparent 8deg 24deg)`,
                WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 68%)',
                maskImage: 'radial-gradient(circle, black 18%, transparent 68%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              aria-hidden
            />
            {[0, 0.25].map((d) => (
              <motion.div
                key={d}
                className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{ borderColor: color }}
                initial={{ scale: 0.3, opacity: 0.9 }}
                animate={{ scale: 3.4, opacity: 0 }}
                transition={{ duration: 1, delay: d, ease: 'easeOut' }}
              />
            ))}
            <Particles colors={[color, '#ffffff', TIER_COLORS[to.tierIndex]!.light]} count={26} spread={190} />
          </>
        )}
        {phase < 2 && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={
              phase === 0
                ? { scale: [1, 1.05, 1], opacity: 1, rotate: [0, -1.5, 1.5, 0] }
                : { scale: 1.3, opacity: 0, filter: 'brightness(3)' }
            }
            transition={phase === 0 ? { duration: 0.9 } : { duration: 0.45 }}
          >
            <RankCrest rank={from} size={SIZE} />
          </motion.div>
        )}
        {phase === 1 && !reduce && <Particles colors={oldColors} count={30} spread={230} />}
        {phase === 2 && (
          <motion.div
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { scale: 0.1, rotate: -16, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={reduce ? { duration: 0.4 } : { type: 'spring', stiffness: 170, damping: 11 }}
          >
            <RankCrest rank={to} size={SIZE} />
          </motion.div>
        )}
      </div>
      <motion.p
        key={phase === 2 ? 'new' : 'old'}
        className={`${pixelText} mt-10 text-2xl`}
        style={{ color: phase === 2 ? color : '#E5E7EB', textShadow: phase === 2 ? `0 0 18px ${color}` : undefined }}
        initial={{ opacity: 0, scale: phase === 2 ? 1.6 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 15 }}
      >
        {phase === 2 ? to.label : from.shortLabel}
      </motion.p>
      <p className="mt-3 text-xs text-slate-400">{phase === 2 ? 'Tap to continue' : ' '}</p>
    </Backdrop>
  );
}

/** Full-screen promotion moment. A new tier breaks and rebuilds the shield; a division slams in a chevron. */
export function PromotionScene({ from, to, onDone }: { from: RankInfo; to: RankInfo; onDone: () => void }) {
  return to.tierIndex > from.tierIndex ? <TierScene from={from} to={to} onDone={onDone} /> : <DivisionScene from={from} to={to} onDone={onDone} />;
}
