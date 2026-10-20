/** Life Arc 66 design tokens. */
export default {
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0F19',
        arc: {
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          crimson: '#EF4444',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-violet': '0 0 24px rgba(139,92,246,.45)',
        'glow-cyan': '0 0 24px rgba(6,182,212,.4)',
        'glow-emerald': '0 0 24px rgba(16,185,129,.4)',
        'glow-crimson': '0 0 24px rgba(239,68,68,.4)',
      },
    },
  },
};
