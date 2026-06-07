import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map(host => host.trim())
  .filter(Boolean)

const splitVendorChunk = (id) => {
  if (!id.includes('node_modules')) return undefined
  if (
    id.includes('/react/') ||
    id.includes('\\react\\') ||
    id.includes('react_jsx-runtime') ||
    id.includes('react-jsx-runtime') ||
    id.includes('react/jsx-runtime') ||
    id.includes('react\\jsx-runtime') ||
    id.includes('react-dom') ||
    id.includes('react-is') ||
    id.includes('scheduler')
  ) return 'vendor-react'
  if (id.includes('react-router')) return 'vendor-router'
  if (id.includes('lucide-react')) return 'vendor-icons'
  if (id.includes('zustand')) return 'vendor-state'
  if (id.includes('sonner')) return 'vendor-sonner'
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: [
          'icon-512.png',
          'icon-192.png',
          'logo.svg',
          'client.webmanifest',
          'admin.webmanifest',
          'offline.html'
        ],
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
        globPatterns: [
          'index.html',
          'manifest.webmanifest',
          'client.webmanifest',
          'admin.webmanifest',
          'offline.html',

          'assets/**/*.css',
          'assets/index-*.js',

          'assets/vendor-react-*.js',
          'assets/vendor-router-*.js',
          'assets/vendor-state-*.js',
          'assets/vendor-icons-*.js',
          'assets/vendor-sonner-*.js',

          'assets/AdminShell-*.js',
          'assets/AdminLoginPage-*.js',
          'assets/DashboardPage-*.js',
          'assets/CalendarPage-*.js',
          'assets/CustomersPage-*.js',
          'assets/InventoryPage-*.js',
          'assets/BillingPage-*.js',
          'assets/FinancePage-*.js',
          'assets/StaffPage-*.js',
          'assets/MaintenancePage-*.js',
          'assets/GalleryPage-*.js',
          'assets/SettingsPage-*.js',
          'assets/ClientMessagesPage-*.js',

          'assets/LandingPage-*.js',
          'assets/PortalResolver-*.js',
          'assets/ClientDashboardPage-*.js',
          'assets/ClientMessageCenterPage-*.js',
          'assets/PublicCalendarPage-*.js',
          'assets/PublicGalleryPage-*.js',
          'assets/RegisterPage-*.js',

          'assets/firebase-*.js',
          'assets/useAuthStore-*.js',
          'assets/useThemeStore-*.js',
          'assets/useSettingsStore-*.js',
          'assets/useNotificationStore-*.js',
          'assets/useBookingStore-*.js',
          'assets/useBookingRequestStore-*.js',
          'assets/useClientMessageStore-*.js',

          'icon-*.png',
          'logo.svg'
        ],
        globIgnores: [
          '**/react-pdf.browser-*.js',
          '**/exceljs.min-*.js',
          '**/ReceiptPDF-*.js',
          '**/FileSaver.min-*.js'
        ]
      }
    })
  ],
  server: {
    host: true,
    ...(allowedHosts.length ? { allowedHosts } : {}),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: splitVendorChunk,
      },
    },
  }
})
