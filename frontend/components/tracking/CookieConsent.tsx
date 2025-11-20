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
      console.warn('Google Analytics ID not configured. Set NEXT_PUBLIC_GA_ID in .env.local');
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

    // Load Facebook Pixel
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
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6"
        >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                {isSlovak ? 'Súbory cookie' : 'Cookies'}
              </h3>
              <p className="text-sm text-gray-600">
                {isSlovak
                  ? 'Táto stránka používa súbory cookie na zlepšenie vášho zážitku. Môžete si vybrať, ktoré súbory cookie chcete povoliť.'
                  : 'This website uses cookies to improve your experience. You can choose which cookies to allow.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isSlovak ? 'Odmietnuť všetko' : 'Reject All'}
              </button>
              <button
                onClick={handleCustomize}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isSlovak ? 'Prispôsobiť' : 'Customize'}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isSlovak ? 'Prijať všetko' : 'Accept All'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      </AnimatePresence>
    )}
    
    {/* Cookie Settings Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {isSlovak ? 'Nastavenia súborov cookie' : 'Cookie Settings'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowBanner(true); // Show banner again if modal is closed
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label={isSlovak ? 'Zavrieť' : 'Close'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 mb-6">
              {/* Necessary Cookies */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isSlovak ? 'Nevyhnutné súbory cookie' : 'Necessary Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600">
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
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isSlovak ? 'Analytické súbory cookie' : 'Analytics Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isSlovak ? 'Marketingové súbory cookie' : 'Marketing Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-6 py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isSlovak ? 'Uložiť nastavenia' : 'Save Settings'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowBanner(true);
                }}
                className="px-6 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50"
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

