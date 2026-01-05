import type { NextConfig } from 'next'
import { withContentlayer } from 'next-contentlayer2'
import path from 'path'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/.velite': path.resolve(process.cwd(), '.velite'),
    }
    // Watch the .velite directory for changes
    config.watchOptions = {
      ...config.watchOptions,
      ignored: config.watchOptions?.ignored
        ? Array.isArray(config.watchOptions.ignored)
          ? config.watchOptions.ignored.filter((p: string) => !p.includes('.velite'))
          : []
        : [],
    }
    return config
  },
}

export default withContentlayer(nextConfig)
