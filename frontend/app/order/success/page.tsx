'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { Header } from '@/components/layout/Header';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const tenantSlug = searchParams.get('tenant') || 'pornopizza';
  const [countdown, setCountdown] = useState(5);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const toast = useToastContext();

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantData = await getTenant(tenantSlug);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [tenantSlug]);

  useEffect(() => {
    if (!orderId) {
      router.push(`/?tenant=${tenantSlug}`);
      return;
    }

    // Countdown redirect
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push(`/order/${orderId}?tenant=${tenantSlug}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId, router, tenantSlug]);

  if (loading || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return null;
  }

  const orderNumber = orderId.slice(0, 8).toUpperCase();
  const trackingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/order/${orderId}?tenant=${tenantSlug}`
    : '';

  // Get tenant theme
  const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
    ? tenant.theme as any
    : {};
  const primaryColor = theme.primaryColor || '#E91E63';
  const layout = theme.layout || {};
  const isDark = layout.headerStyle === 'dark';
  const useCustomBackground = layout.useCustomBackground || false;
  const customBackgroundClass = layout.customBackgroundClass || '';
  const backgroundClass = isDark && useCustomBackground && customBackgroundClass === 'porno-bg' 
    ? 'bg-skin-tone' 
    : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${backgroundClass}`} style={isDark && useCustomBackground ? { minHeight: '100vh', position: 'relative' } : {}}>
      <Header tenant={tenant} />
      <div className="flex items-center justify-center p-4 pt-24">
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="text-8xl mb-4">✅</div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t.orderConfirmed} 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            {t.thankYouForOrder}
          </p>
          <p className="text-lg text-gray-500 mb-8">
            {t.orderNumberLabel} #{orderNumber}
          </p>
        </motion.div>

        {/* Email Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg p-6 mb-8 text-left border-l-4"
          style={{ 
            backgroundColor: `${primaryColor}15`,
            borderLeftColor: primaryColor,
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">📧</div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: primaryColor }}>
                {t.checkYourEmail}
              </h3>
              <p className="text-sm" style={{ color: `${primaryColor}DD` }}>
                {t.emailConfirmationSent}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tracking Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-50 rounded-lg p-6 mb-8"
        >
          <h3 className="font-semibold text-gray-800 mb-3">{t.trackYourOrder}</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
            <code className="text-sm text-gray-600 break-all">{trackingUrl}</code>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(trackingUrl);
                toast.success(t.linkCopied);
              }
            }}
            className="font-medium text-sm transition-colors"
            style={{ color: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            📋 {t.copyLink}
          </button>
        </motion.div>

        {/* Redirect Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-6"
        >
          <p className="text-gray-500 text-sm mb-4">
            {t.redirectingToTracking} {countdown} {t.seconds}...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push(`/order/${orderId}?tenant=${tenantSlug}`)}
            className="text-white font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105 shadow-lg"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {t.trackOrderNow}
          </button>
          <button
            onClick={() => router.push(`/?tenant=${tenantSlug}`)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            {t.backToMenu}
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 pt-8 border-t border-gray-200"
        >
          <p className="text-gray-500 text-sm">
            {t.questionsContact}
          </p>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}

