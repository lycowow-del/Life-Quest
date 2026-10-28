/** Life Quest design tokens: navy pastel. */
export default {
  theme: {
    extend: {
      colors: {
        obsidian: '#141B3A',
        arc: {
          violet: '#FFB3E6',
          cyan: '#A8E6FF',
          emerald: '#B8F5C8',
          crimson: '#FFB3B3',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', 'Space Grotesk', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 24px rgba(255,179,230,.4)',
        'glow-cyan': '0 0 24px rgba(168,230,255,.4)',
        'glow-emerald': '0 0 24px rgba(184,245,200,.4)',
        'glow-crimson': '0 0 24px rgba(255,179,179,.4)',
      },
    },
  },
};
