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
      manifest: {
        name: 'Es Teh Istimewa',
        short_name: 'Es Teh Istimewa',
        description: 'Dashboard staff & ringkasan operasional Es Teh Istimewa.',
        theme_color: '#15803d',
        background_color: '#f8faf8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/Appic.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
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
