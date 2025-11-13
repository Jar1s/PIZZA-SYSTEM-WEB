'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}

