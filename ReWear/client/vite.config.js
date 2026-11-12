import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The libraries every page needs go in their own file. They rarely change, so a
// returning visitor keeps them cached and only downloads the (small) app code
// after an update. Icons and date helpers stay with the pages that use them.
const VENDOR = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|axios)[\\/]/

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (VENDOR.test(id)) return 'vendor'
        },
      },
    },
  },
})
