import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { getTenant } from '@/lib/api';
import { Providers } from '@/components/Providers';

// Optimize font loading with display swap and preload
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately, swap when loaded
  preload: true,
  variable: '--font-inter',
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const tenant = headersList.get('x-tenant') || 'pornopizza';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  
  try {
    const tenantData = await getTenant(tenant);
    const siteName = tenantData.name || 'Pizza Ordering';
    const description = tenantData.description || `Order delicious pizza online from ${siteName}. Fast delivery, fresh ingredients, and great prices.`;
    const imageUrl = tenantData.logo || `${baseUrl}/images/og-default.jpg`;
    
    return {
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
      metadataBase: new URL(baseUrl),
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
    tenantData = await getTenant(tenant);
  } catch {
    // Fallback theme if tenant not found
    tenantData = {
      theme: {
        primaryColor: '#FF6B00',
        secondaryColor: '#000000',
        favicon: '/favicon.ico',
      }
    };
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const siteName = tenantData.name || 'Pizza Ordering';
  
  // Structured Data (JSON-LD)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteName,
    description: tenantData.description || `Order delicious pizza online from ${siteName}`,
    url: baseUrl,
    logo: tenantData.logo || `${baseUrl}/logo.png`,
    image: tenantData.logo || `${baseUrl}/images/og-default.jpg`,
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
        <link rel="icon" href={tenantData.theme.favicon || '/favicon.ico'} />
        <link rel="canonical" href={baseUrl} />
        <meta name="theme-color" content={tenantData.theme.primaryColor || '#FF6B00'} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${tenantData.theme.primaryColor};
              --color-secondary: ${tenantData.theme.secondaryColor};
            }
          `
        }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


