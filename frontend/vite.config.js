import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/* eslint-env node */
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev the app talks to a same-origin `/api` (so the httpOnly refresh cookie stays
  // first-party); Vite proxies it to the real backend. Point it at VITE_API_BASE_URL
  // (e.g. the duckdns backend) when set, otherwise a locally-running backend.
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8080'

  return {
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@mui/icons-material/Add',
      '@mui/icons-material/AccountBalance',
      '@mui/icons-material/AccountTree',
      '@mui/icons-material/ArrowBack',
      '@mui/icons-material/CameraAlt',
      '@mui/icons-material/CalendarMonth',
      '@mui/icons-material/Check',
      '@mui/icons-material/Close',
      '@mui/icons-material/DeleteOutline',
      '@mui/icons-material/EditOutlined',
      '@mui/icons-material/Email',
      '@mui/icons-material/EventAvailable',
      '@mui/icons-material/GroupAdd',
      '@mui/icons-material/MenuBook',
      '@mui/icons-material/Person',
      '@mui/icons-material/Phone',
      '@mui/icons-material/Send',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-query': ['@tanstack/react-query', 'axios', 'zustand'],
          'vendor-charts': ['recharts'],
          'vendor-editor': ['react-quill-new', 'dompurify'],
          // emoji-picker-react & xlsx are intentionally NOT pinned here so Rollup can
          // emit them as on-demand chunks loaded only when the user opens the emoji
          // picker / runs a bulk import.
          'vendor-misc': ['framer-motion', 'dayjs'],
        },
      },
    },
  },
  }
})
