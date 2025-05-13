import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: "VITE_",
    server: {
    host: '0.0.0.0', // <- REQUIRED inside Docker!
    port: 5173,
    proxy: {
        '/api': {
        target: 'http://backend:3001', // internal Docker-to-Docker
        changeOrigin: true,
        secure: false,
        },
    },
    },
});
