import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The deploy workflow sets VITE_BASE to the repo name for GitHub Pages. Local dev uses "/".
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
      manifest: {
        name: 'Life Quest',
        short_name: 'Life Quest',
        description: 'Build your character by building your habits. 66 days to automatic.',
        theme_color: '#141B3A',
        background_color: '#141B3A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
