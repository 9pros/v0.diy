import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
    optimizeCss: true,
    cssChunking: true,
    inlineCss: true,
  },
  typedRoutes: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
