import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bowtie/shared', '@bowtie/ui', '@bowtie/methodology'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
