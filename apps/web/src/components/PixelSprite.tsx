import { spriteUrl } from '../lib/pixel/sprites';

interface Props {
  id: string;
  make: () => Uint8ClampedArray;
  size: number;
  label?: string;
  glow?: string;
}

export function PixelSprite({ id, make, size, label = '', glow }: Props) {
  return (
    <img
      src={spriteUrl(id, make)}
      width={size}
      height={size}
      alt={label}
      draggable={false}
      style={{
        imageRendering: 'pixelated',
        flex: 'none',
        filter: glow ? `drop-shadow(0 0 8px ${glow})` : undefined,
      }}
    />
  );
}
