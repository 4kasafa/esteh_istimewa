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
        name: 'EsTehLay Finance',
        short_name: 'EsTehLay',
        description: 'Ringkasan keuangan sederhana untuk pemilik usaha kecil.',
        theme_color: '#f4d03f',
        background_color: '#ffffff',
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
  },
  server: {
    host: true,
    allowedHosts: [
      "semirigorously-branchial-margit.ngrok-free.dev"
    ]
  }
})
