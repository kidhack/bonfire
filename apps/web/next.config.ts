import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bonfire/ui', '@bonfire/types', '@bonfire/db'],
};

export default nextConfig;
