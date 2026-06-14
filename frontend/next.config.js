const { withSentryConfig } = require('@sentry/nextjs');

// Fail-fast: a production build must have NEXT_PUBLIC_API_URL set. Otherwise the
// app would silently fall back to http://localhost:3000 and break in production.
// NEXT_PUBLIC_* is inlined at build time, so this guard belongs in the build step.
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is required for production builds. Set it in the Vercel project environment variables.',
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for static images
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  transpilePackages: ['@pizza-ecosystem/shared'],
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
    outputFileTracingIncludes: {
      '/*': ['./public/**/*'],
    },
    optimizePackageImports: ['framer-motion', '@/components'],
  },
  // Optimize production builds
  productionBrowserSourceMaps: false,
  webpack: (config, { dev }) => {
    if (!dev && config.optimization) {
      config.optimization.minimize = false;
    }
    return config;
  },
  // Disable standalone output for development
  // output: 'standalone',
}

// Only wrap with Sentry if DSN is configured
const config = process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
  ? withSentryConfig(
      nextConfig,
      {
        silent: true,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
      {
        widenClientFileUpload: true,
        hideSourceMaps: true,
        disableLogger: true,
      }
    )
  : nextConfig;

module.exports = config;
