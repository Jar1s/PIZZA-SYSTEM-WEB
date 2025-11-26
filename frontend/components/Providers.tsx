'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { CookieConsent } from '@/components/tracking/CookieConsent';

export function Providers({ children }: { children: React.ReactNode }) {
  // Global error handler to suppress non-critical DOM errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Suppress InvalidNodeTypeError from Framer Motion/Intersection Observer
      // This happens when nodes are removed from DOM during animations
      if (
        event.error?.name === 'InvalidNodeTypeError' ||
        event.message?.includes('selectNode') ||
        event.message?.includes('Range') ||
        event.message?.includes('has no parent')
      ) {
        event.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress InvalidNodeTypeError from promises
      if (
        event.reason?.name === 'InvalidNodeTypeError' ||
        event.reason?.message?.includes('selectNode') ||
        event.reason?.message?.includes('Range') ||
        event.reason?.message?.includes('has no parent')
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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

