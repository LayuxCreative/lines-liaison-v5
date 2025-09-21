import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: false
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    __WS_TOKEN__: JSON.stringify(process.env.VITE_WS_TOKEN || 'default-ws-token'),
    global: 'globalThis',
    'process.env': {}
  },
});
