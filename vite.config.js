import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map(host => host.trim())
  .filter(Boolean)

const splitVendorChunk = (id) => {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
  if (id.includes('react-router')) return 'vendor-router'
  if (id.includes('lucide-react')) return 'vendor-icons'
  if (id.includes('date-fns')) return 'vendor-date'
  if (id.includes('zustand')) return 'vendor-state'
  if (id.includes('sonner')) return 'vendor-sonner'
  if (id.includes('html2canvas')) return 'vendor-capture'
  if (id.includes('firebase')) return 'vendor-firebase'
  if (id.includes('framer-motion')) return 'vendor-motion'
  if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
  if (id.includes('exceljs')) return 'vendor-excel'
  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon-512.png', 'icon-192.png', 'logo.svg'],
      manifest: {
        name: '37 Music Studio',
        short_name: '37 Studio',
        description: 'Sistem manajemen studio musik — booking, pelanggan, keuangan, inventaris',
        theme_color: '#0d0d12',
        background_color: '#0d0d12',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        rollupFormat: 'iife',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/vendor-excel-*.js']
      }
    })
  ],
  server: {
    host: true,
    ...(allowedHosts.length ? { allowedHosts } : {}),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: splitVendorChunk,
      },
    },
  }
})
