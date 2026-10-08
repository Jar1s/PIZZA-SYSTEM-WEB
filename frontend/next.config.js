const { withSentryConfig } = require('@sentry/nextjs');
const { PHASE_PRODUCTION_BUILD } = require('next/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
    // NOTE: public/ is served by Vercel's static CDN layer (verified via
    // x-matched-path) — bundling it into every function via
    // outputFileTracingIncludes blew past the 250MB function limit once the
    // brand image sets grew. The /images|/logos|/favicons route handlers only
    // ever see paths that do not exist as static files and 404 there anyway.
    optimizePackageImports: ['framer-motion', '@/components'],
  },
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Disable standalone output for development
  // output: 'standalone',

  // Security headers applied to every route on every tenant domain.
  //
  // Content-Security-Policy is deliberately NOT set here yet: the app loads
  // Google Tag Manager, Google Analytics and the Facebook Pixel via inline
  // bootstrap snippets, redirects to Adyen for payment, and geocodes addresses
  // against Nominatim/Photon. A CSP has to enumerate all of those or it breaks
  // checkout and analytics, so it gets rolled out separately in report-only
  // mode first.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Browsers must honour the declared Content-Type instead of sniffing
          // it, which is what turns an uploaded "image" into executable script.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Clickjacking: nothing may frame our pages. We still frame
          // googletagmanager ourselves — this header only restricts who may
          // embed us, not who we may embed.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Send the full URL only to ourselves; cross-origin requests
          // (payment gateway, analytics) see the origin alone.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // None of these APIs are used anywhere in the app (verified: no
          // navigator.geolocation, no getUserMedia, no PaymentRequest), so
          // deny them outright. 'payment' stays on self in case a future
          // gateway integration needs the Payment Request API.
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'usb=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()',
              'payment=(self)',
            ].join(', '),
          },
        ],
      },
    ];
  },
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

// Fail-fast: a production build must have NEXT_PUBLIC_API_URL set. Otherwise the
// app would silently fall back to http://localhost:3000 and break in production.
// Function-form config: Next passes the phase as an argument when the config is
// loaded, so the guard fires during `next build` but not `next dev`/`next lint`.
// (Reading process.env.NEXT_PHASE here does NOT work — Next sets it only after
// the config has already been loaded.)
module.exports = (phase) => {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.NEXT_PUBLIC_API_URL) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required for production builds. Set it in the Vercel project environment variables.',
    );
  }
  return config;
};
