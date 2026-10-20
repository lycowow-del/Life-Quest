import type { Rank } from '@la66/core';
import { RANK_COLOR } from '../lib/theme';

export function RankCrest({ rank, size = 88 }: { rank: Rank; size?: number }) {
  const c = RANK_COLOR[rank];
  const id = `crest-${rank}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Rank ${rank}`}
      style={{ filter: `drop-shadow(0 0 12px ${c}99)`, flex: 'none' }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".95" />
          <stop offset="1" stopColor="#0B0F19" />
        </linearGradient>
      </defs>
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={`url(#${id})`} stroke={c} strokeWidth="3" />
      <polygon points="50,14 83,32 83,68 50,86 17,68 17,32" fill="#0B0F19" fillOpacity=".6" stroke={c} strokeOpacity=".5" />
      <text x="50" y="63" textAnchor="middle" fontSize="40" fontWeight="700" fill="#fff" fontFamily="inherit">
        {rank}
      </text>
    </svg>
  );
}
