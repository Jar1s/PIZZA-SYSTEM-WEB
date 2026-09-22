import type { Metadata } from 'next';
import {
  Inter, Bebas_Neue, Pacifico, Poppins, Quicksand, Space_Grotesk,
  Barlow_Condensed, Cinzel, Fredoka, Raleway, Nunito, Rajdhani,
  Oswald, Nunito_Sans,
} from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { getTenantServer } from '@/lib/server-api';
import { buildSeoDescription, buildSeoTitle } from '@/lib/seo';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { Providers } from '@/components/Providers';
import { SafeAnalytics } from '@/components/tracking/SafeAnalytics';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';

// Force dynamic rendering because we use dynamic tenant resolution
export const dynamic = 'force-dynamic';

// Per-brand font instances — all use `variable` so font-family is
// controlled via CSS custom property, not hard-coded on <body>.
const inter          = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const bebasNeue      = Bebas_Neue({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-bebas-neue' });
const pacifico       = Pacifico({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-pacifico' });
const poppins        = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-poppins' });
const quicksand      = Quicksand({ subsets: ['latin'], display: 'swap', variable: '--font-quicksand' });
const spaceGrotesk   = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' });
const barlowCond     = Barlow_Condensed({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-barlow-condensed' });
const cinzel         = Cinzel({ subsets: ['latin'], display: 'swap', variable: '--font-cinzel' });
const fredoka        = Fredoka({ subsets: ['latin'], display: 'swap', variable: '--font-fredoka' });
const raleway        = Raleway({ subsets: ['latin'], display: 'swap', variable: '--font-raleway' });
const nunito         = Nunito({ subsets: ['latin'], display: 'swap', variable: '--font-nunito' });
const rajdhani       = Rajdhani({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-rajdhani' });
const oswald         = Oswald({ subsets: ['latin'], display: 'swap', variable: '--font-oswald' });
const nunitoSans     = Nunito_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-nunito-sans' });

// Apply all variable classes to <body> so every font is available in the
// document; the active one is selected via --font-family below.
const ALL_FONT_VARS = [
  inter.variable, bebasNeue.variable, pacifico.variable, poppins.variable,
  quicksand.variable, spaceGrotesk.variable, barlowCond.variable, cinzel.variable,
  fredoka.variable, raleway.variable, nunito.variable, rajdhani.variable,
  oswald.variable, nunitoSans.variable,
].join(' ');

interface FontConfig { cssVar: string; stack: string; }
const TENANT_FONTS: Record<string, FontConfig> = {
  pornopizza:       { cssVar: '--font-inter',            stack: 'Inter, sans-serif' },
  p0rnopizza:       { cssVar: '--font-inter',            stack: 'Inter, sans-serif' },
  pizzavnudzi:      { cssVar: '--font-bebas-neue',       stack: '"Bebas Neue", sans-serif' },
  pizzalover:       { cssVar: '--font-pacifico',         stack: 'Pacifico, cursive' },
  pizzaprefirmy:    { cssVar: '--font-poppins',          stack: 'Poppins, sans-serif' },
  skinnyb1tchpizza: { cssVar: '--font-quicksand',        stack: 'Quicksand, sans-serif' },
  ozemp1cpizza:     { cssVar: '--font-space-grotesk',    stack: '"Space Grotesk", sans-serif' },
  pizzacorner:      { cssVar: '--font-barlow-condensed', stack: '"Barlow Condensed", sans-serif' },
  pizzaheaven:      { cssVar: '--font-cinzel',           stack: 'Cinzel, serif' },
  partypizza:       { cssVar: '--font-fredoka',          stack: 'Fredoka, sans-serif' },
  threesomepizza:   { cssVar: '--font-raleway',          stack: 'Raleway, sans-serif' },
  healthypizza:     { cssVar: '--font-nunito',           stack: 'Nunito, sans-serif' },
  zerosugarpizza:   { cssVar: '--font-rajdhani',         stack: 'Rajdhani, sans-serif' },
  anabolicpizza:    { cssVar: '--font-oswald',           stack: 'Oswald, sans-serif' },
  mydaypizza:       { cssVar: '--font-nunito-sans',      stack: '"Nunito Sans", sans-serif' },
};

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
    const description = buildSeoDescription({
      ...tenantData,
      description: tenantData.description || (theme.description as string),
    }, siteName);
    const homeTitle = buildSeoTitle({ ...tenantData, name: siteName });
    const imageUrl = (theme.logo as string) || tenantData.logo || `${baseUrl}/images/og-default.jpg`;
    
    return {
      metadataBase: new URL(baseUrl),
      title: {
        default: homeTitle,
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
        title: homeTitle,
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
        title: homeTitle,
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
        default: 'Pizza Ordering | Rozvoz pizze',
        template: '%s | Pizza Ordering',
      },
      description: 'Objednajte pizzu online s rýchlym doručením a čerstvými surovinami.',
      metadataBase: new URL(baseUrl),
      openGraph: {
        type: 'website',
        locale: 'sk_SK',
        url: baseUrl,
        siteName: 'Pizza Ordering',
        title: 'Pizza Ordering | Rozvoz pizze',
        description: 'Objednajte pizzu online s rýchlym doručením a čerstvými surovinami.',
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
  const tenantSlug = normalizedTenant?.slug?.toLowerCase() || 'pornopizza';
  const fontConfig = TENANT_FONTS[tenantSlug] ?? TENANT_FONTS['pornopizza'];
  const fontFamily = fontConfig.stack;

  // Structured Data (JSON-LD)
  // Opening hours come from the tenant theme (admin-managed); the schema uses
  // them even when in-app hours enforcement is disabled.
  const schemaDayNames: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  const openingDays = (theme.openingHours as any)?.days as
    | Record<string, { open?: string; close?: string; closed?: boolean }>
    | undefined;
  const openingHoursSpecification = openingDays
    ? Object.entries(schemaDayNames)
        .filter(([key]) => {
          const day = openingDays[key];
          return day && !day.closed && day.open && day.close;
        })
        .map(([key, dayOfWeek]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek,
          opens: openingDays[key].open,
          closes: openingDays[key].close,
        }))
    : [];

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteName,
    description: buildSeoDescription({
      ...tenantData,
      description: tenantData.description || (theme.description as string),
    }, siteName),
    url: baseUrl,
    logo: (theme.logo as string) || tenantData.logo || `${baseUrl}/logo.png`,
    image: (theme.logo as string) || tenantData.logo || `${baseUrl}/images/og-default.jpg`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SK',
      ...(typeof theme.city === 'string' && theme.city ? { addressLocality: theme.city } : {}),
      ...(typeof theme.streetAddress === 'string' && theme.streetAddress
        ? { streetAddress: theme.streetAddress }
        : {}),
    },
    servesCuisine: ['Pizza', 'Italian'],
    priceRange: '$$',
    hasMenu: baseUrl,
    acceptsReservations: false,
    ...(openingHoursSpecification.length > 0 && { openingHoursSpecification }),
    potentialAction: {
      '@type': 'OrderAction',
      target: baseUrl,
      deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
    },
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
        {(() => {
          const favicon = theme.favicon || '/favicon.ico';
          return (
            <>
              <link rel="icon" href={favicon} sizes="any" />
              <link rel="apple-touch-icon" href={favicon} />
              <link rel="icon" href={favicon} type="image/png" />
            </>
          );
        })()}
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
              --font-family: var(${fontConfig.cssVar}), ${fontFamily} !important;
            }
          `
        }} />
      </head>
      <body className={ALL_FONT_VARS} suppressHydrationWarning>
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
          <AnalyticsScripts />
        </Providers>
        <SafeAnalytics />
      </body>
    </html>
  );
}
