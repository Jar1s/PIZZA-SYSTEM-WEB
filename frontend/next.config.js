/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
  transpilePackages: ['@/shared'],
  swcMinify: true,
  reactStrictMode: true,
  // ESLint: Only fail on errors, not warnings
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Treat ESLint warnings as non-blocking
  typescript: {
    ignoreBuildErrors: false,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['framer-motion', '@/components'],
  },
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Disable standalone output for development
  // output: 'standalone',
}

module.exports = nextConfig


