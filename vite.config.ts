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
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-core';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-gfm') || id.includes('node_modules/rehype-raw')) {
            return 'markdown';
          }
          if (id.includes('node_modules/date-fns')) {
            return 'date-fns';
          }
          if (id.includes('node_modules/xlsx')) {
            return 'xlsx';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
            return 'icons';
          }
          if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/axios')) {
            return 'data-client';
          }
          if (id.includes('node_modules/react-day-picker') || id.includes('node_modules/input-otp')) {
            return 'forms-widgets';
          }
          if (id.includes('node_modules/sonner') || id.includes('node_modules/cmdk') || id.includes('node_modules/next-themes') || id.includes('node_modules/vaul')) {
            return 'ui-utils';
          }
          if (id.includes('node_modules')) {
            return 'vendor-misc';
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
