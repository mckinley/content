import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/.velite": path.resolve(process.cwd(), ".velite"),
    };
    return config;
  },
};

export default withContentlayer(nextConfig);
