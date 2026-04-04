'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieSettings } from '@/hooks/useCookieSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

/**
 * Component that conditionally loads analytics and marketing scripts
 * based on user's cookie preferences
 */
export function CookieConsent() {
  const { settings, isLoaded, updateSettings } = useCookieSettings();
  const { language } = useLanguage();
  const { user: customerUser, loading: customerLoading } = useCustomerAuth();
  const isSlovak = language === 'sk';
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  
  // Update local settings when settings change
  useEffect(() => {
    if (isLoaded) {
      setLocalSettings(settings);
    }
  }, [isLoaded, settings]);
  
  // Check if user has already made a choice (per user)
  // Also check when user changes (login/logout)
  // Only show banner if user is fully logged in OR not logged in at all (first visit)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return;
    
    // Wait for customer loading to finish
    if (customerLoading) {
      setShowBanner(false);
      return;
    }

    const checkUserChoice = () => {
      // Check if user is fully logged in (for customers: must have phoneVerified)
      // Don't show banner if user is in the process of verification (not fully logged in)
      
      let isFullyLoggedIn = false;
      let userId: string | null = null;
      
      // If customer user exists, check if phone is verified
      if (customerUser) {
        // For customers, phone must be verified to be "fully logged in"
        if (customerUser.phoneVerified === true) {
          isFullyLoggedIn = true;
          userId = customerUser.id;
        } else {
          // User is logged in but phone not verified yet - don't show banner
          setShowBanner(false);
          return;
        }
      } else {
        // Check for admin user (they don't need phone verification)
        const adminUser = localStorage.getItem('auth_user');
        if (adminUser) {
          try {
            const user = JSON.parse(adminUser);
            if (user.id) {
              isFullyLoggedIn = true;
              userId = user.id;
            } else {
              // Admin user exists but invalid - don't show
              setShowBanner(false);
              return;
            }
          } catch {
            // Invalid admin user - don't show
            setShowBanner(false);
            return;
          }
        }
        // No user at all = first visit (not logged in) - continue to check cookie settings
      }

      // Only check cookie settings if user is fully logged in OR not logged in at all
      // Get current user ID (re-check in case it changed)
      if (!userId && isFullyLoggedIn) {
        // Fallback: try to get userId from localStorage directly
        if (customerUser && customerUser.phoneVerified === true) {
          userId = customerUser.id;
        } else {
          const adminUser = localStorage.getItem('auth_user');
          if (adminUser) {
            try {
              const user = JSON.parse(adminUser);
              userId = user.id || null;
            } catch {
              // Ignore
            }
          }
        }
      }

      // Check if this user has made a choice
      const analyticsKey = userId ? `cookie_analytics_${userId}` : 'cookie_analytics';
      const marketingKey = userId ? `cookie_marketing_${userId}` : 'cookie_marketing';
      
      const analyticsValue = localStorage.getItem(analyticsKey);
      const marketingValue = localStorage.getItem(marketingKey);
      const hasChoice = analyticsValue !== null || marketingValue !== null;
      
      // Show banner if:
      // 1. User is fully logged in (or not logged in) AND
      // 2. User hasn't made a choice yet
      if ((isFullyLoggedIn || !userId) && !hasChoice) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    };

    // Initial check
    checkUserChoice();

    // Also check when localStorage changes (user login/logout)
    const handleStorageChange = (e: StorageEvent | null) => {
      // Check if it's a user-related change or if it's a manual trigger
      if (!e || e.key === 'customer_auth_user' || e.key === 'auth_user' || 
          e.key === 'customer_auth_token' || e.key === 'auth_token') {
        // Small delay to ensure localStorage is updated and settings are reloaded
        setTimeout(checkUserChoice, 300);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Poll for user changes (since storage event doesn't fire for same-tab changes)
    // Check more frequently to catch verification completion and new logins
    const interval = setInterval(checkUserChoice, 500);
    
    // Also listen for custom events (dispatched by OAuth callbacks)
    const handleCustomEvent = () => {
      setTimeout(checkUserChoice, 300);
    };
    
    window.addEventListener('customer-auth-updated', handleCustomEvent);
    window.addEventListener('auth-updated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customer-auth-updated', handleCustomEvent);
      window.removeEventListener('auth-updated', handleCustomEvent);
      clearInterval(interval);
    };
  }, [isLoaded, settings, customerUser, customerLoading]);

  // Load analytics scripts if allowed (Google Analytics)
  useEffect(() => {
    if (!isLoaded || !settings.analytics) return;
    if (typeof window === 'undefined') return;

    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!gaId) {
      // Only log in development mode to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.debug('Google Analytics ID not configured. Set NEXT_PUBLIC_GA_ID in .env.local (optional)');
      }
      return;
    }

    // Check if already loaded
    if ((window as any).gtag) {
      return;
    }

    // Load Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);

    // Track page view on route change
    const handleRouteChange = () => {
      if ((window as any).gtag) {
        (window as any).gtag('config', gaId, {
          page_path: window.location.pathname,
        });
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isLoaded, settings.analytics]);

  // Load marketing scripts if allowed (Facebook Pixel)
  useEffect(() => {
    if (!isLoaded || !settings.marketing) return;
    if (typeof window === 'undefined') return;

    const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    if (!fbPixelId) {
      // Facebook Pixel is optional, silently skip if not configured
      return;
    }

    // Check if already loaded
    if ((window as any).fbq) {
      return;
    }

    // Load Facebook Pixel with error handling
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${fbPixelId}');
      fbq('track', 'PageView');
    `;
    
    // Handle script loading errors (e.g., blocked by adblocker)
    script.onerror = () => {
      console.warn('Facebook Pixel failed to load (likely blocked by adblocker)');
      // Don't throw error, just silently fail
    };
    
    script.onload = () => {
      // Script loaded successfully
    };
    
    document.head.appendChild(script);

    // Create noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);
  }, [isLoaded, settings.marketing]);

  const handleAcceptAll = () => {
    updateSettings({
      analytics: true,
      marketing: true,
    });
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    updateSettings({
      analytics: false,
      marketing: false,
    });
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowModal(true);
    setShowBanner(false);
  };
  
  const handleSaveSettings = () => {
    try {
      updateSettings({
        analytics: localSettings.analytics,
        marketing: localSettings.marketing,
      });
      setShowModal(false);
      // Reload page to apply settings
      window.location.reload();
    } catch (error) {
      console.error('Failed to save cookie settings:', error);
      alert(isSlovak ? 'Chyba pri ukladaní nastavení' : 'Error saving settings');
    }
  };

  return (
    <>
    {showBanner && (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-6 md:right-6"
        >
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-primary)]/30 bg-gradient-to-br from-white via-white to-orange-50/50 backdrop-blur-xl shadow-[0_25px_70px_rgba(255,107,0,0.25)]">
          {/* Primary accent stripe */}
          <div
            className="absolute inset-y-0 left-0 w-2"
            style={{ background: `linear-gradient(180deg, var(--color-primary), var(--color-primary-dark, #e65a00))` }}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7">
              <div className="flex-1">
                <h3 className="font-black text-xl md:text-2xl mb-2" style={{ color: 'var(--color-primary)' }}>
                  {isSlovak ? '🍪 Súbory cookie' : '🍪 Cookies'}
                </h3>
                <p className="text-sm md:text-base text-gray-800 leading-relaxed font-medium">
                  {isSlovak
                    ? 'Táto stránka používa súbory cookie na zlepšenie vášho zážitku. Môžete si vybrať, ktoré súbory cookie chcete povoliť.'
                    : 'This website uses cookies to improve your experience. You can choose which cookies to allow.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={handleRejectAll}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all duration-200"
                >
                  {isSlovak ? 'Odmietnuť' : 'Reject'}
                </button>
                <button
                  onClick={handleCustomize}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl border-2 border-[var(--color-primary)]/40 text-[var(--color-primary)] bg-white hover:bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)] active:scale-95 transition-all duration-200"
                >
                  {isSlovak ? 'Prispôsobiť' : 'Customize'}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 text-sm font-black rounded-xl text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                  style={{ 
                    backgroundColor: 'var(--color-primary)', 
                    boxShadow: '0 10px 25px rgba(255,107,0,0.35), 0 0 0 1px rgba(255,107,0,0.1) inset'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(255,107,0,0.45), 0 0 0 1px rgba(255,107,0,0.2) inset';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,107,0,0.35), 0 0 0 1px rgba(255,107,0,0.1) inset';
                  }}
                >
                  {isSlovak ? 'Prijať všetko' : 'Accept All'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </AnimatePresence>
    )}
    
    {/* Cookie Settings Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--color-primary)]/20"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
              <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                {isSlovak ? '⚙️ Nastavenia súborov cookie' : '⚙️ Cookie Settings'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowBanner(true); // Show banner again if modal is closed
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
                aria-label={isSlovak ? 'Zavrieť' : 'Close'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 mb-6">
              {/* Necessary Cookies */}
              <div className="border-b-2 border-gray-200 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1.5 text-gray-900">
                      {isSlovak ? '🔒 Nevyhnutné súbory cookie' : '🔒 Necessary Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {isSlovak
                        ? 'Tieto súbory cookie sú nevyhnutné pre fungovanie stránky a nemôžu byť vypnuté.'
                        : 'These cookies are necessary for the website to function and cannot be disabled.'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={localSettings.necessary}
                      disabled
                      className="w-6 h-6 rounded border-2 border-gray-300 text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border-b-2 border-gray-200 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1.5 text-gray-900">
                      {isSlovak ? '📊 Analytické súbory cookie' : '📊 Analytics Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {isSlovak
                        ? 'Pomáhajú nám pochopiť, ako návštevníci používajú našu stránku.'
                        : 'Help us understand how visitors use our website.'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.analytics}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] shadow-inner"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border-b-2 border-gray-200 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1.5 text-gray-900">
                      {isSlovak ? '📢 Marketingové súbory cookie' : '📢 Marketing Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {isSlovak
                        ? 'Používajú sa na zobrazovanie relevantných reklám a sledovanie kampaní.'
                        : 'Used to display relevant ads and track campaigns.'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.marketing}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] shadow-inner"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-6 py-3.5 rounded-xl text-white font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 10px 25px rgba(255,107,0,0.35)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(255,107,0,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,107,0,0.35)';
                }}
              >
                {isSlovak ? '💾 Uložiť nastavenia' : '💾 Save Settings'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowBanner(true);
                }}
                className="px-6 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all duration-200"
              >
                {isSlovak ? 'Zrušiť' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </>
  );
}
