import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dns from 'node:dns';

// Fix DNS resolution order for localhost
dns.setDefaultResultOrder('verbatim');

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', 'lucide-react'],
          router: ['react-router-dom'],
          utils: ['date-fns', 'clsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
    open: false,
    strictPort: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      port: 5174,
      host: '127.0.0.1',
      protocol: 'ws',
      clientPort: 5174,
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['speakeasy']
  },
  resolve: {
    alias: {
      util: 'util',
      buffer: 'buffer',
      process: 'process/browser'
    }
  },
  css: {
    devSourcemap: true
  }
});
