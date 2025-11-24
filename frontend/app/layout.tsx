import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { getTenantServer } from '@/lib/server-api';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { Providers } from '@/components/Providers';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

// Force dynamic rendering because we use dynamic tenant resolution
export const dynamic = 'force-dynamic';

// Optimize font loading with display swap and preload
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately, swap when loaded
  preload: true,
  variable: '--font-inter',
});

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
    const imageUrl = tenantData.logo || (theme.logo as string) || `${baseUrl}/images/og-default.jpg`;
    
    return {
      metadataBase: new URL(baseUrl),
      viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
      },
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
  const primaryColor = theme.primaryColor || '#E91E63';
  const secondaryColor = theme.secondaryColor || '#0F141A';
  const fontFamily = theme.fontFamily || 'Inter, sans-serif';
  
  // Structured Data (JSON-LD)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteName,
    description: tenantData.description || (theme.description as string) || `Order delicious pizza online from ${siteName}`,
    url: baseUrl,
    logo: tenantData.logo || (theme.logo as string) || `${baseUrl}/logo.png`,
    image: tenantData.logo || (theme.logo as string) || `${baseUrl}/images/og-default.jpg`,
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
        <link rel="icon" href={theme.favicon || '/favicon.ico'} />
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
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
