const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-toast',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Optimizar la carga de CSS
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
