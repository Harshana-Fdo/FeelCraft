import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET = 'http://localhost:5000', VITE_DEV_PORT = '5173', FEELCRAFT_TUNNEL_PREVIEW } = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': { target: API_PROXY_TARGET, changeOrigin: true } };

  return {
    plugins: [react(), tailwind()],
    server: { port: Number(VITE_DEV_PORT), strictPort: true, proxy },
    preview: {
      proxy,
      ...(FEELCRAFT_TUNNEL_PREVIEW === '1' && {
        host: '127.0.0.1', port: Number(VITE_DEV_PORT), strictPort: true,
        headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' },
      }),
    },
    build: {
      rollupOptions: {
        output: { manualChunks: id => id.includes('/node_modules/axios/') ? 'api-client' : undefined },
      },
    },
    test: { environment: 'jsdom', include: ['src/**/*.test.jsx'] },
  };
});
