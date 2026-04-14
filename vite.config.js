import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // public/manifest.json 직접 사용
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 새 빌드 배포 시 이전 해시 청크를 즉시 제거 (stale chunk 방지)
        cleanupOutdatedCaches: true,
        // 새 SW가 설치되면 즉시 활성화 (waiting 없이)
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
      },
    }),
  ],
  test: {
    environment: "node",
    globals: true,
    env: {
      JWT_SECRET: "test-secret-for-vitest-only",
      TOSS_SECRET_KEY: "test_toss_sk_vitest",
      ADMIN_EMAILS: "admin@hello.com",
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true, // Sentry source map 업로드용
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'markdown': ['react-markdown'],
          'zod': ['zod'],
          'panels': ['./src/panels.jsx'],
          'jsonrepair': ['jsonrepair'],
        },
      },
    },
  },
})
