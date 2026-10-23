import type { GameState, RankInfo, StatKey } from './types';
import { levelFromXp, rankInfo } from './xp';

/** What a grant of XP changed, so the app can show a banner or a promotion scene. */
export interface Reward {
  stat: StatKey;
  xp: number;
  from: RankInfo;
  to: RankInfo;
  rankedUp: boolean;
  tierUp: boolean;
  leveledUp: boolean;
  newLevel: number;
}

/** Adds XP to the total and one stat, and counts the day as activity for that stat. */
export function grantXp(state: GameState, stat: StatKey, xp: number): { state: GameState; reward: Reward } {
  const p = state.profile;
  const from = rankInfo(p.totalXp);
  const to = rankInfo(p.totalXp + xp);
  const next: GameState = {
    ...state,
    profile: {
      ...p,
      totalXp: p.totalXp + xp,
      statXp: { ...p.statXp, [stat]: p.statXp[stat] + xp },
      lastStatDay: { ...p.lastStatDay, [stat]: p.dayNumber },
    },
  };
  return {
    state: next,
    reward: {
      stat,
      xp,
      from,
      to,
      rankedUp: to.step > from.step,
      tierUp: to.tierIndex > from.tierIndex,
      leveledUp: levelFromXp(p.totalXp + xp) > levelFromXp(p.totalXp),
      newLevel: levelFromXp(p.totalXp + xp),
    },
  };
}
