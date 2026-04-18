import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/framer-motion/')) {
            return 'motion';
          }
          if (id.includes('/node_modules/recharts/')) {
            return 'charts';
          }
          if (
            id.includes('/node_modules/react-markdown/') ||
            id.includes('/node_modules/remark-gfm/') ||
            id.includes('/node_modules/rehype-raw/')
          ) {
            return 'markdown';
          }
          if (id.includes('/node_modules/xlsx/')) {
            return 'xlsx';
          }
          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }
          if (id.includes('/node_modules/@radix-ui/')) {
            return 'radix';
          }
          if (id.includes('/node_modules/react-use-websocket/')) {
            return 'chat';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
