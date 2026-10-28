import { todayProgress } from './selectors';
import type { GameState } from './types';
import { rankInfo } from './xp';

/** From Master up, the companion grows once for every this many points. */
export const PET_POINTS_PER_STAGE = 100;
/** The companion looks sleepy from this local hour if your streak is still waiting for a quest. */
export const PET_SLEEPY_HOUR = 18;

export type PetKind = 'egg' | 'pet';

export interface PetLook {
  /** Grows by one with every division promotion, and every 100 points from Master up. Each division adds a chevron to its shell. */
  stage: number;
  kind: PetKind;
  /** Body shape: 0 baby, 1 young, 2 adult, 3 legend (Master and up). */
  form: number;
  /** Tier colours, 0 (Iron) to 9 (Challenger). */
  tierIndex: number;
  /** Division chevrons on the shell, 0 to 4 (none from Master up). */
  chevrons: number;
  /** Extra growth stages earned with points from Master up. */
  apex: number;
}

/** What the companion looks like for a given total XP. */
/** The first rank step of each body shape: baby from Iron III, young from Silver IV, adult from Platinum IV, legend from Master. */
export const PET_FORM_STEPS = [1, 8, 16, 28] as const;
export const petForm = (step: number): number => PET_FORM_STEPS.filter((s) => step >= s).length - 1;

export function petLook(xp: number): PetLook {
  const r = rankInfo(xp);
  const apex = r.points !== null ? Math.floor(r.points / PET_POINTS_PER_STAGE) : 0;
  return {
    stage: r.step + apex,
    kind: r.step === 0 ? 'egg' : 'pet',
    form: Math.max(0, petForm(r.step)),
    tierIndex: r.tierIndex,
    chevrons: r.division ? 5 - r.division : 0,
    apex,
  };
}

export type PetMood = 'idle' | 'sleepy' | 'happy';

/** Happy when everything due is done, sleepy when the streak still needs a quest this evening. */
export function petMood(s: GameState, hour: number): PetMood {
  const { done, total } = todayProgress(s);
  if (total > 0 && done === total) return 'happy';
  if (total > 0 && done === 0 && s.profile.streak > 0 && hour >= PET_SLEEPY_HOUR) return 'sleepy';
  return 'idle';
}

/** How close the companion is to its next growth. */
export function petGrowth(xp: number): { text: string; ratio: number } {
  const r = rankInfo(xp);
  if (r.points !== null) {
    const into = r.points % PET_POINTS_PER_STAGE;
    return { text: `Grows in ${PET_POINTS_PER_STAGE - into} points`, ratio: into / PET_POINTS_PER_STAGE };
  }
  const verb = r.step === 0 ? 'Hatches' : 'Grows';
  return { text: `${verb} at ${r.nextLabel} (${r.xpToNext.toLocaleString('en-US')} XP)`, ratio: r.ratio };
}
