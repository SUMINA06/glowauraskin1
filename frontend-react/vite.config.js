import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars from .env, .env.[mode], etc. so we can read
  // VITE_API_PROXY_TARGET / VITE_API_BASE_URL for the dev proxy target.
  const env = loadEnv(mode, process.cwd(), '')

  // The backend URL used by the dev server proxy. Defaults to the local
  // backend port for development. In production (Railway) this should be
  // set to the internal backend service URL, e.g.
  // http://glowauraskin1.railway.internal:8080
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    (mode === 'production'
      ? 'http://glowauraskin1.railway.internal:8080'
      : 'http://localhost:3000')

  return {
    plugins: [react()],

    server: {
      port: 5173,

      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },

    preview: {
      allowedHosts: ["glowskinaura.up.railway.app"],
    },
  }
})
