import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";
import path from "path";

class VeliteWebpackPlugin {
  static started = false;
  apply(compiler: {
    options: { mode: string };
    hooks: {
      beforeCompile: {
        tapPromise: (name: string, fn: () => Promise<void>) => void;
      };
    };
  }) {
    compiler.hooks.beforeCompile.tapPromise("VeliteWebpackPlugin", async () => {
      if (VeliteWebpackPlugin.started) return;
      VeliteWebpackPlugin.started = true;
      const dev = compiler.options.mode === "development";
      const { build } = await import("velite");
      await build({ watch: false, clean: !dev });
    });
  }
}

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/.velite": path.resolve(process.cwd(), ".velite"),
    };
    config.plugins.push(new VeliteWebpackPlugin());
    return config;
  },
};

export default withContentlayer(nextConfig);
