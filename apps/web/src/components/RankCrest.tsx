import type { RankInfo } from '@la66/core';
import { crestPixels } from '../lib/pixel/crest';
import { TIER_COLOR } from '../lib/theme';
import { PixelSprite } from './PixelSprite';

/** Division IV shows 1 chevron up to division I with 4. Master and Grandmaster show none. */
export function RankCrest({ rank, size = 96 }: { rank: RankInfo; size?: number }) {
  const chevrons = rank.division ? 5 - rank.division : 0;
  return (
    <PixelSprite
      id={`crest-${rank.tierIndex}-${chevrons}`}
      make={() => crestPixels(rank.tierIndex, chevrons)}
      size={size}
      label={`Rank ${rank.shortLabel}`}
      glow={`${TIER_COLOR[rank.tier]}99`}
    />
  );
}
