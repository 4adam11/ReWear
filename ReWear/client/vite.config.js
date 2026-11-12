import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The libraries every page needs go in their own file. They rarely change, so a
// returning visitor keeps them cached and only downloads the (small) app code
// after an update. Icons and date helpers stay with the pages that use them.
const VENDOR = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|axios)[\\/]/

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Link previews (WhatsApp, Instagram, LinkedIn) need full addresses, so index.html
  // uses %SITE_URL%. Set VITE_SITE_URL in client/.env to the public address when deploying.
  const siteUrl = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (VENDOR.test(id)) return 'vendor'
          },
        },
      },
    },
  }
})
