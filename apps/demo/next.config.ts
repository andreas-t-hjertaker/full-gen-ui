import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true, // Partial Pre-rendering for optimized streaming
  },
};

export default nextConfig;
