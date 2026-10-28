import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { petGrowth, petLook, petMood, type GameState } from '@la66/core';
import { petPixels, type PetEyes } from '../lib/pixel/pet';
import { PixelSprite } from './PixelSprite';

/** Your tortoise companion: idles, blinks, hops when you finish a quest, and looks sleepy when your streak is at risk. */
export function PetCompanion({ state, hop, hour }: { state: GameState; hop: number; hour: number }) {
  const xp = state.profile.totalXp;
  const look = petLook(xp);
  const mood = petMood(state, hour);
  const growth = petGrowth(xp);
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (hop > 0 && !reduce) void controls.start({ y: [0, -28, 0, -8, 0], scaleY: [1, 1.1, 0.88, 1.03, 1], transition: { duration: 0.75, ease: 'easeOut' } });
  }, [hop, reduce, controls]);

  useEffect(() => {
    if (mood === 'sleepy') return;
    let off: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setBlink(true);
      off = setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => {
      clearInterval(id);
      if (off) clearTimeout(off);
    };
  }, [mood]);

  const eyes: PetEyes = mood === 'sleepy' ? 'sleepy' : blink ? 'blink' : mood === 'happy' ? 'happy' : 'open';
  const message =
    mood === 'happy'
      ? 'All done for today. Nice work!'
      : mood === 'sleepy'
        ? 'Zzz… your streak needs a quest today.'
        : look.kind === 'egg'
          ? 'Your egg is warm. Keep going.'
          : 'Ready for today’s quests!';

  return (
    <section aria-label="Your companion" className="glass flex items-center gap-4 p-3">
      <motion.div animate={controls} className="flex-none">
        <motion.div
          animate={reduce ? undefined : { y: mood === 'sleepy' ? [0, -1, 0] : [0, -3, 0] }}
          transition={{ duration: mood === 'sleepy' ? 4 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PixelSprite
            id={`pet-${look.kind}-${look.form}-${look.tierIndex}-${look.chevrons}-${look.apex}-${eyes}`}
            make={() => petPixels(look, eyes)}
            size={96}
            label="Your tortoise companion"
          />
        </motion.div>
      </motion.div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm text-slate-200">{message}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden>
          <div className="h-full rounded-full bg-arc-violet" style={{ width: `${growth.ratio * 100}%` }} />
        </div>
        <p className="text-[11px] text-slate-400">{growth.text}</p>
      </div>
    </section>
  );
}
