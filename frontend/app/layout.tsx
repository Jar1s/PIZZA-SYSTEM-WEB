import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { getTenantServer } from '@/lib/server-api';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { Providers } from '@/components/Providers';
import { SafeAnalytics } from '@/components/tracking/SafeAnalytics';

// Force dynamic rendering because we use dynamic tenant resolution
export const dynamic = 'force-dynamic';

// Optimize font loading with display swap and preload
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately, swap when loaded
  preload: true,
  variable: '--font-inter',
});

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  // Get tenant from x-tenant header (set by middleware) or default
  let tenant = headersList.get('x-tenant') || 'pornopizza';
  
  // For Vercel URLs, ensure we never use hostname-derived tenant
  const hostname = headersList.get('host') || '';
  if (hostname.includes('vercel.app') && tenant.includes('pizza-system')) {
    // If tenant was incorrectly extracted from hostname, use default
    tenant = 'pornopizza';
  }
  
  // Dynamically detect base URL from request headers for proper asset loading
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${hostname}`;
  
  try {
    const tenantData = await getTenantServer(tenant);
    if (!tenantData) {
      throw new Error('Tenant not found');
    }
    const normalizedTenant = withTenantThemeDefaults(tenantData);
    const siteName = normalizedTenant?.name || 'Pizza Ordering';
    const theme = typeof normalizedTenant?.theme === 'object' && normalizedTenant?.theme !== null ? normalizedTenant.theme as any : {};
    const description = tenantData.description || (theme.description as string) || `Order delicious pizza online from ${siteName}. Fast delivery, fresh ingredients, and great prices.`;
    const imageUrl = (theme.logo as string) || tenantData.logo || `${baseUrl}/images/og-default.jpg`;
    
    return {
      metadataBase: new URL(baseUrl),
      title: {
        default: siteName,
        template: `%s | ${siteName}`,
      },
      description,
      keywords: ['pizza', 'delivery', 'online ordering', 'food delivery', tenant, 'restaurant'],
      authors: [{ name: siteName }],
      creator: siteName,
      publisher: siteName,
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      alternates: {
        canonical: '/',
      },
      openGraph: {
        type: 'website',
        locale: 'sk_SK',
        url: baseUrl,
        siteName,
        title: siteName,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${siteName} - Order Pizza Online`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: siteName,
        description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        // Add Google Search Console verification if needed
        // google: 'your-verification-code',
      },
    };
  } catch {
    return {
      title: {
        default: 'Pizza Ordering',
        template: '%s | Pizza Ordering',
      },
      description: 'Order your favorite pizza online. Fast delivery, fresh ingredients, and great prices.',
      metadataBase: new URL(baseUrl),
      openGraph: {
        type: 'website',
        locale: 'sk_SK',
        url: baseUrl,
        siteName: 'Pizza Ordering',
        title: 'Pizza Ordering',
        description: 'Order your favorite pizza online',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenant = headersList.get('x-tenant') || 'pornopizza';
  
  let tenantData;
  try {
    tenantData = await getTenantServer(tenant);
    if (!tenantData) {
      throw new Error('Tenant not found');
    }
  } catch (error) {
    // Fallback theme if tenant not found or backend unavailable
    console.warn('Failed to load tenant data, using fallback:', error);
    tenantData = {
      slug: tenant,
      name: 'Pizza Ordering',
      theme: {
        primaryColor: '#E91E63',
        secondaryColor: '#0F141A',
        favicon: '/favicon.ico',
      }
    };
  }
  
  // Dynamically detect base URL from request headers for proper asset loading
  const hostname = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${hostname}`;
  const normalizedTenant = withTenantThemeDefaults(tenantData as any);
  const siteName = normalizedTenant?.name || 'Pizza Ordering';
  const theme = typeof normalizedTenant?.theme === 'object' && normalizedTenant?.theme !== null ? normalizedTenant.theme as any : {};
  
  // Use normalized theme colors (never legacy orange for PornoPizza)
  // Force PornoPizza brand colors if tenant is pornopizza
  const isPornopizza = normalizedTenant?.slug?.toLowerCase() === 'pornopizza';
  const primaryColor = isPornopizza ? '#E91E63' : (theme.primaryColor || '#E91E63');
  const secondaryColor = isPornopizza ? '#0F141A' : (theme.secondaryColor || '#0F141A');
  const fontFamily = theme.fontFamily || 'Inter, sans-serif';
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Layout] Tenant:', normalizedTenant?.slug, 'PrimaryColor:', primaryColor, 'Original:', theme.primaryColor);
  }
  
  // Structured Data (JSON-LD)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteName,
    description: tenantData.description || (theme.description as string) || `Order delicious pizza online from ${siteName}`,
    url: baseUrl,
    logo: (theme.logo as string) || tenantData.logo || `${baseUrl}/logo.png`,
    image: (theme.logo as string) || tenantData.logo || `${baseUrl}/images/og-default.jpg`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SK',
    },
    servesCuisine: 'Italian',
    priceRange: '$$',
    ...(tenantData.phone && {
      telephone: tenantData.phone,
    }),
    ...(tenantData.email && {
      email: tenantData.email,
    }),
  };

  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/android-chrome-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/android-chrome-512x512.png" type="image/png" sizes="512x512" />
        <link rel="canonical" href={baseUrl} />
        <meta name="theme-color" content={primaryColor} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${primaryColor} !important;
              --color-primary-dark: ${primaryColor === '#E91E63' ? '#C2185B' : '#e65a00'} !important;
              --color-secondary: ${secondaryColor} !important;
              --font-family: ${fontFamily} !important;
            }
          `
        }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Set background immediately to prevent white flash
                const hostname = window.location.hostname;
                const params = new URLSearchParams(window.location.search);
                let tenantSlug = 'pornopizza';
                if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk') || hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) {
                  tenantSlug = 'pornopizza';
                } else if (hostname.includes('pizzavnudzi.sk') || hostname.includes('pizzavnudzi')) {
                  tenantSlug = 'pizzavnudzi';
                } else {
                  tenantSlug = params.get('tenant') || 'pornopizza';
                }
                if (tenantSlug === 'pornopizza') {
                  document.body.classList.add('bg-porno-vibe');
                  document.body.style.backgroundColor = '#040404';
                } else {
                  document.body.style.backgroundColor = '#f8f8f8';
                }
              })();
            `
          }}
        />
        <Providers>
          {children}
        </Providers>
        <SafeAnalytics />
      </body>
    </html>
  );
}
