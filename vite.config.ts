import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'tiles-core': fileURLToPath(new URL('./packages/tiles-core/src', import.meta.url)),
      'tiles-runtime': fileURLToPath(new URL('./packages/tiles-runtime/src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
