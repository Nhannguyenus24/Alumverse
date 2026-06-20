import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
