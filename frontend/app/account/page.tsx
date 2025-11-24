'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import OrderHistory from '@/components/account/OrderHistory';
import MyAddress from '@/components/account/MyAddress';
import PersonalData from '@/components/account/PersonalData';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme, getButtonGradientClass } from '@/lib/tenant-utils';

type AccountSection = 'orders' | 'address' | 'settings';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, loading: authLoading } = useCustomerAuth();
  const { t } = useLanguage();
  const { tenant: tenantData } = useTenant();
  const initialSection = searchParams.get('section') as AccountSection | null;
  const [activeSection, setActiveSection] = useState<AccountSection>(initialSection || 'orders');
  const tenant = searchParams.get('tenant') || 'pornopizza';
  const isDark = isDarkTheme(tenantData);
  const gradientClass = getButtonGradientClass(tenantData);
  const primaryColor = tenantData?.theme?.primaryColor || '#E91E63';
  
  // Update active section when section query param changes
  useEffect(() => {
    const section = searchParams.get('section') as AccountSection | null;
    if (section && ['orders', 'address', 'settings'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Clear sessionStorage.oauth_redirect when account page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('oauth_redirect');
    }
  }, []);

  // Wait until auth is loaded, then handle redirect
  useEffect(() => {
    // Wait until auth is loaded
    if (authLoading) return;
    
    // Derive accountReturnUrl from tenant + section
    const section = searchParams.get('section') as AccountSection | null;
    const accountReturnUrl = `/account?tenant=${tenant}${section ? `&section=${section}` : ''}`;
    
    if (!user) {
      // Stash accountReturnUrl into sessionStorage.oauth_requested_returnUrl
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_requested_returnUrl', accountReturnUrl);
      }
      router.push(`/auth/login?tenant=${tenant}&returnUrl=${encodeURIComponent(accountReturnUrl)}`);
    } else {
      // When user exists, remove the session key
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('oauth_requested_returnUrl');
      }
    }
  }, [authLoading, user, router, tenant, searchParams]);

  // Timeout for loading state (prevent infinite loading)
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        console.warn('Account page: Loading timeout - authLoading still true after 5 seconds');
        setLoadingTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  // Render spinner while authLoading || !user (but with timeout)
  if (authLoading || !user) {
    // If timeout, show error message
    if (loadingTimeout && !user) {
      return (
        <div className={`min-h-screen ${isDark ? 'porno-bg text-white' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">{t.error || 'Chyba'}</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Nepodarilo sa načítať údaje používateľa. Prosím, skúste sa prihlásiť znova.
            </p>
            <button
              onClick={() => router.push(`/auth/login?tenant=${tenant}`)}
              className={`px-6 py-3 rounded-full font-semibold ${gradientClass}`}
              style={!isDark ? { backgroundColor: primaryColor, color: 'white' } : undefined}
            >
              Prihlásiť sa
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`min-h-screen ${isDark ? 'porno-bg text-white' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4`}
          style={{ borderColor: isDark ? '#ff5e00' : primaryColor }}></div>
          <p className={`mt-4 text-lg ${isDark ? 'text-white' : 'text-gray-700'}`}>{t.loading}</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push(`/?tenant=${tenant}`);
  };

  const menuItems = [
    {
      id: 'orders' as AccountSection,
      label: t.orderHistory,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'address' as AccountSection,
      label: t.myAddress,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'settings' as AccountSection,
      label: t.settingsAndPersonalData,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const handleBackToHome = () => {
    router.push(`/?tenant=${tenant}`);
  };

  return (
    <div className={`min-h-screen py-8 ${isDark ? 'porno-bg text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black mb-2" style={{ color: primaryColor }}>
                {t.myAccount}
              </h1>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{user.email}</p>
            </div>
            <button
              onClick={handleBackToHome}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform hover:scale-[1.02] font-semibold ${gradientClass}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>{t.backToHome}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Menu Sidebar */}
          <div className="md:col-span-1">
            <div className={`${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white'} rounded-2xl shadow-lg p-4 space-y-2`}>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    activeSection === item.id
                      ? isDark
                        ? 'bg-white/10 border-white/40 shadow-lg'
                        : 'bg-orange-50 border-[var(--color-primary)]'
                      : isDark
                        ? 'border-transparent hover:bg-white/5'
                        : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={isDark ? 'text-white' : 'text-gray-700'}>{item.icon}</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                  <svg
                    className={`w-5 h-5 ml-auto ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-4 transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                <span className="font-medium">{t.logout}</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${isDark ? 'checkout-card-dark p-8' : 'bg-white rounded-2xl shadow-md p-8'}`}
            >
              {activeSection === 'orders' && <OrderHistory tenant={tenant} isDark={isDark} />}
              {activeSection === 'address' && <MyAddress tenant={tenant} isDark={isDark} />}
              {activeSection === 'settings' && <PersonalData tenant={tenant} isDark={isDark} />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
