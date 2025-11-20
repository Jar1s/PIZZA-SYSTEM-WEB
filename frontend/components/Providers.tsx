'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { CookieConsent } from '@/components/tracking/CookieConsent';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <TenantProvider>
          <LanguageProvider>
            <ToastProvider>
              {children}
              <CookieConsent />
            </ToastProvider>
          </LanguageProvider>
        </TenantProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}

