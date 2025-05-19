/** @type {import('next').NextConfig} */
const nextConfig = {
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

    // Evitar que WDYR se incluya en producción
    if (!dev) {
      config.resolve.alias['@/config/whyDidYouRender'] = false;
    }

    return config;
  },
};

module.exports = nextConfig;
