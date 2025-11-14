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
  
  try {
    const tenantData = await getTenant(tenant);
    
    return {
      title: tenantData.name,
      description: `Order pizza from ${tenantData.name}`,
    };
  } catch {
    return {
      title: 'Pizza Ordering',
      description: 'Order your favorite pizza online',
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
  
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="icon" href={tenantData.theme.favicon || '/favicon.ico'} />
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


