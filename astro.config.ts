import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@astrojs/cloudflare'
import keystatic from '@keystatic/astro'

export default defineConfig({
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
