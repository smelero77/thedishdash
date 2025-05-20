// next.config.ts
import type { NextConfig } from 'next';
import { resolve } from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kgmacxloazibdyduucgp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
      {
        protocol: 'https',
        hostname: 'kgmacxloazibdyduucgp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/alergenos/**',
      },
    ],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };

    // Avoid including WDYR in production
    if (!dev) {
      config.resolve.alias['@/config/whyDidYouRender'] = false;
    }

    return config;
  },
};

export default nextConfig;
