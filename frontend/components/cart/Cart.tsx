'use client';

import { useCart, useCartTotal } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useCallback, useState, useMemo } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Tenant } from '@pizza-ecosystem/shared';
import { isDarkTheme, getButtonGradientClass, getButtonStyle } from '@/lib/tenant-utils';
import { isCurrentlyOpen } from '@/lib/opening-hours';
import { useToastContext } from '@/contexts/ToastContext';

interface CartProps {
  tenant?: Tenant | null;
  isDark?: boolean;
}

export function Cart({ tenant = null, isDark: isDarkOverride }: CartProps) {
  const { items, isOpen, closeCart } = useCart();
  const total = useCartTotal();
  const router = useRouter();
  const { user } = useCustomerAuth();
  const { t, language } = useLanguage();
  const { tenant: tenantFromContext } = useTenant();
  const toast = useToastContext();
  
  // Use tenant from props or context
  const effectiveTenant = tenant || tenantFromContext;
  const isDark = typeof isDarkOverride === 'boolean' ? isDarkOverride : isDarkTheme(effectiveTenant);
  const primaryColor = effectiveTenant?.theme?.primaryColor || 'var(--color-primary)';
  const secondaryColor = effectiveTenant?.theme?.secondaryColor || 'var(--color-secondary)';
  
  // Check maintenance mode (manual or automatic based on opening hours)
  const maintenanceMode = useMemo(() => {
    if (!effectiveTenant) return false;
    const manualMaintenanceMode = effectiveTenant.theme?.maintenanceMode === true;
    const openingHours = (effectiveTenant.theme as any)?.openingHours;
    // Only apply automatic maintenance mode if opening hours are enabled
    const autoMaintenanceMode = (openingHours?.enabled === true) ? !isCurrentlyOpen(openingHours) : false;
    return manualMaintenanceMode || autoMaintenanceMode;
  }, [effectiveTenant]);

  // Debug logging
  useEffect(() => {
    console.log('Cart component rendered', { isOpen, itemsCount: items.length });
  }, [isOpen, items.length]);

  // Handle ESC key to close cart
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeCart]);

  // Prevent body scroll when cart is open (mobile fix)
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Disable body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position when cart closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  const getTenantSlug = useCallback(() => {
    if (typeof window === 'undefined') return 'pornopizza';
    const hostname = window.location.hostname;
    if (hostname.includes('pornopizza')) return 'pornopizza';
    if (hostname.includes('pizzavnudzi')) return 'pizzavnudzi';
    if (hostname.includes('localhost')) {
      const params = new URLSearchParams(window.location.search);
      return params.get('tenant') || 'pornopizza';
    }
    return 'pornopizza';
  }, []);

  const handleCheckout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check maintenance mode first
    if (maintenanceMode) {
      toast.error(language === 'sk' 
        ? 'Momentálne neprijímame nové objednávky!' 
        : 'We are currently not accepting new orders!');
      return;
    }
    
    console.log('🛒 Checkout button clicked', { itemsCount: items.length, tenantSlug: getTenantSlug() });
    
    if (items.length === 0) {
      console.warn('🛒 Cannot checkout: cart is empty');
      return;
    }
    
    const tenantSlug = getTenantSlug();
    const checkoutUrl = `/checkout?tenant=${tenantSlug}`;
    console.log('🛒 Navigating to checkout:', checkoutUrl);
    
    // Close cart first
    closeCart();
    
    // Use router.push with a small delay to ensure cart closes first
    setTimeout(() => {
      try {
        router.push(checkoutUrl);
      } catch (error) {
        console.error('🛒 Router.push failed, using window.location:', error);
        // Fallback to window.location if router.push fails
        window.location.href = checkoutUrl;
      }
    }, 150);
  };

  const handleContinueShopping = () => {
    closeCart();
    if (typeof window === 'undefined') return;
    const menuElement = document.getElementById('menu');
    if (!menuElement) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const headerHeight = 80;
    const elementPosition = menuElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };
  
  console.log('🛒 Cart render check', { isOpen, itemsCount: items.length });
  
  if (!isOpen) {
    return null;
  }
  
  console.log('🛒 Rendering cart UI (isOpen=true)');
  
  return (
    <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: 'auto',
          backgroundColor: secondaryColor,
        }}
      >
        {/* Backdrop */}
        <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🛒 Backdrop clicked, closing cart');
          closeCart();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `${secondaryColor}dd`,
          zIndex: 10000,
          pointerEvents: 'auto',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Cart Panel */}
      <motion.div
        key="cart-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="fixed right-0 top-0 h-screen w-full sm:max-w-[28rem] p-4 sm:p-6 flex flex-col z-[10001]"
        style={{
          backgroundColor: secondaryColor,
          color: '#fff',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
        onAnimationStart={() => console.log('🛒 Cart animation started')}
        onAnimationComplete={() => console.log('🛒 Cart animation completed')}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p
              className="text-xs uppercase tracking-[0.4em] mb-2"
              style={{ color: '#fff' }}
            >
              {t.cartBadge}
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white">{t.yourCart}</h2>
            <p className="text-gray-200">{t.cartSubtitle}</p>
          </div>
          <button
            onClick={closeCart}
            className="rounded-full w-10 h-10 flex items-center justify-center transition-colors text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.35)' : '0 8px 18px rgba(0,0,0,0.15)',
            }}
            aria-label="Zavrieť košík"
          >
              &times;
            </button>
          </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl">🛒</div>
            <p className="text-xl font-semibold">{t.emptyCart}</p>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{t.cartEmptyCta}</p>
            <button
              onClick={handleContinueShopping}
              className={`px-5 py-3 rounded-full font-semibold ${getButtonGradientClass(effectiveTenant)}`}
              style={getButtonStyle(effectiveTenant, isDark)}
            >
              {t.menu}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 min-h-0">
              {items.map(item => (
                <CartItem key={item.id} item={item} variant={isDark ? 'dark' : 'light'} />
              ))}
            </div>

            <div className="mt-auto space-y-4 pt-4 border-t border-white/10 pb-4 flex-shrink-0">
            <div className="rounded-2xl p-4 flex items-center justify-between bg-white/10 border border-white/20">
              <div>
                <p className="text-sm uppercase tracking-widest">{t.items}</p>
                <p className="text-lg font-semibold">{items.reduce((sum, item) => sum + item.quantity, 0)} {t.items}</p>
              </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-widest">{t.total}</p>
                  <p className="text-2xl font-black">€{(total / 100).toFixed(2)}</p>
                </div>
              </div>

              <div className="text-xs uppercase tracking-[0.4em] text-gray-400">
                {t.cartSecureCheckout} • {t.cartDeliveryPromise}
              </div>

              <motion.button
                whileHover={maintenanceMode ? {} : { scale: 1.01 }}
                whileTap={maintenanceMode ? {} : { scale: 0.98 }}
                onClick={handleCheckout}
                disabled={maintenanceMode}
                className={`w-full py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg text-white touch-manipulation min-h-[48px] ${
                  maintenanceMode ? 'opacity-50 cursor-not-allowed' : getButtonGradientClass(effectiveTenant)
                }`}
                style={{
                  ...(maintenanceMode ? {} : getButtonStyle(effectiveTenant, isDark)),
                  backgroundColor: maintenanceMode 
                    ? '#999' 
                    : (primaryColor),
                }}
              >
                {maintenanceMode 
                  ? (t.maintenanceModeTitle || (language === 'sk' ? 'Momentálne neprijímame nové objednávky!' : 'We are currently not accepting new orders!'))
                  : t.checkout
                }
              </motion.button>

              <button
                type="button"
                onClick={handleContinueShopping}
                className={`w-full py-3 rounded-full font-semibold border touch-manipulation min-h-[44px] ${
                  isDark
                    ? 'text-white hover:bg-white/10 active:bg-white/5'
                    : 'border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100'
                }`}
                style={{
                  borderColor: effectiveTenant?.theme?.primaryColor || 'var(--color-primary)',
                  color: effectiveTenant?.theme?.primaryColor || 'var(--color-primary)',
                }}
              >
                {t.menu}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default Cart;
