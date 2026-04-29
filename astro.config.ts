import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@astrojs/cloudflare'
import keystatic from '@keystatic/astro'

// pjmgmt: dev-port — load PORT from .env.development before Astro's own env loader runs
import { loadEnv as __loadDevEnv } from 'vite'
const __devPort = (() => {
  const env = __loadDevEnv('development', '.', '')
  const n = Number(env.PORT)
  return Number.isFinite(n) ? n : undefined
})()

export default defineConfig({
  server: { port: __devPort },
  adapter: cloudflare(),
  integrations: [react(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@/.velite': new URL('./.velite', import.meta.url).pathname,
      },
    },
  },
})
