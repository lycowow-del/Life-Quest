import type { StatKey } from '@la66/core';
import { emblemPixels } from '../lib/pixel/emblem';
import { STAT_META } from '../lib/theme';
import { PixelSprite } from './PixelSprite';

export function StatEmblem({ stat, size = 32, labelled = false }: { stat: StatKey; size?: number; labelled?: boolean }) {
  return (
    <PixelSprite
      id={`emblem-${stat}`}
      make={() => emblemPixels(stat, STAT_META[stat].color)}
      size={size}
      label={labelled ? STAT_META[stat].label : ''}
    />
  );
}
