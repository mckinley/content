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

// The cntmgmt preview deployment (Worker content-preview, design 04 path 2) is this site built
// with CNTMGMT_PREVIEW_DEPLOYMENT=1: every page renders on request, with the editor's drafts.
const previewDeployment = process.env.CNTMGMT_PREVIEW_DEPLOYMENT === '1'

export default defineConfig({
  server: { port: __devPort },
  output: previewDeployment ? 'server' : 'static',
  adapter: cloudflare(),
  integrations: [react(), keystatic()],
  vite: {
    define: { __CNTMGMT_PREVIEW_DEPLOYMENT__: JSON.stringify(previewDeployment) },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@/.velite': new URL('./.velite', import.meta.url).pathname,
        // React 19's browser server renderer needs MessageChannel, which Workers lack; the edge
        // build doesn't (Astro's Cloudflare adapter docs)
        ...(import.meta.env.PROD ? { 'react-dom/server': 'react-dom/server.edge' } : {}),
      },
    },
  },
})
