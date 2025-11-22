'use client';

import { useCart, useCartTotal } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useCallback, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tenant } from '@pizza-ecosystem/shared';
import { isDarkTheme, getButtonGradientClass, getButtonStyle } from '@/lib/tenant-utils';

interface CartProps {
  tenant?: Tenant | null;
  isDark?: boolean;
}

export function Cart({ tenant = null, isDark: isDarkOverride }: CartProps) {
  const { items, isOpen, closeCart } = useCart();
  const total = useCartTotal();
  const router = useRouter();
  const { user } = useCustomerAuth();
  const { t } = useLanguage();
  
  const isDark = typeof isDarkOverride === 'boolean' ? isDarkOverride : isDarkTheme(tenant);

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
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          pointerEvents: 'auto',
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
        className="fixed right-0 top-0 h-screen w-full sm:max-w-[28rem] p-4 sm:p-6 flex flex-col overflow-y-auto z-[10001]"
        style={{
          backgroundColor: isDark ? 'var(--cart-dark-bg, #1a1a1a)' : '#ffffff',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
        }}
        onAnimationStart={() => console.log('🛒 Cart animation started')}
        onAnimationComplete={() => console.log('🛒 Cart animation completed')}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className={`text-xs uppercase tracking-[0.4em] mb-2 ${isDark ? 'text-rose-200' : 'text-gray-400'}`}>
              {t.cartBadge}
            </p>
            <h2 className="text-3xl font-black tracking-tight">{t.yourCart}</h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.cartSubtitle}</p>
          </div>
          <button
            onClick={closeCart}
            className={`rounded-full w-10 h-10 flex items-center justify-center transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
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
              className={`px-5 py-3 rounded-full font-semibold ${getButtonGradientClass(tenant)}`}
              style={getButtonStyle(tenant, isDark)}
            >
              {t.menu}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
              {items.map(item => (
                <CartItem key={item.id} item={item} variant={isDark ? 'dark' : 'light'} />
              ))}
            </div>

            <div className="mt-auto space-y-4 pt-4 border-t border-white/10">
              <div className={`rounded-2xl p-4 flex items-center justify-between ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100'
              }`}>
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                className={`w-full py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg text-white touch-manipulation min-h-[48px] ${getButtonGradientClass(tenant)}`}
                style={{
                  ...getButtonStyle(tenant, isDark),
                  backgroundColor: tenant?.theme?.primaryColor || 'var(--color-primary)',
                }}
              >
                {t.checkout}
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
                  borderColor: tenant?.theme?.primaryColor || 'var(--color-primary)',
                  color: tenant?.theme?.primaryColor || 'var(--color-primary)',
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
