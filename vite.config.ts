import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages project site: https://<user>.github.io/bigtwo-cal/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '牌局計算機',
        short_name: '牌局計算機',
        description: '大老二牌局計分工具',
        theme_color: '#0f2e1e',
        background_color: '#0f2e1e',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-Hant',
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  base: process.env.GITHUB_ACTIONS ? '/bigtwo-cal/' : '/',
})
