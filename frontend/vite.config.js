import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['Appic.svg', 'icons/*.png'],
      manifest: {
        name: 'Es Teh Istimewa',
        short_name: 'Es Teh Istimewa',
        description: 'Dashboard staff & ringkasan operasional Es Teh Istimewa.',
        theme_color: '#15803d',
        background_color: '#f8faf8',
        display: 'standalone',
        start_url: '/',
        lang: 'id',
        id: '/',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: false,
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 2,
        minThreads: 1,
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      "semirigorously-branchial-margit.ngrok-free.dev"
    ]
  }
})
