import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const port = Number(process.env.CLIENT_PORT ?? 5173);
const proxy = {
  '/api': {
    target: process.env.API_URL ?? 'http://localhost:3001',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port, strictPort: true, proxy },
  preview: { port, strictPort: true, proxy },
});
