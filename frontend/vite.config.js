import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ngrok-api': {
        target: 'https://glimmer-clustered-exorcist.ngrok-free.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ngrok-api/, ''),
        secure: false,
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
          'vendor-misc': ['framer-motion', 'emoji-picker-react', 'dayjs'],
        },
      },
    },
  },
})