'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { Header } from '@/components/layout/Header';
import { getBackgroundClass, isDarkTheme } from '@/lib/tenant-utils';
import { useCookieSettings } from '@/hooks/useCookieSettings';
import { trackPurchase } from '@/lib/conversion-tracking';

type TrackedOrder = {
  id: string;
  orderNumber?: number | null;
  status?: string;
  paymentStatus?: string | null;
  createdAt?: string;
  items?: Array<{ productName?: string; name?: string; quantity: number; priceCents?: number; totalCents?: number }>;
  subtotalCents?: number;
  deliveryFeeCents?: number;
  totalCents?: number;
  address?: { street?: string; houseNumber?: string; city?: string; postalCode?: string } | null;
};

const REDIRECT_SECONDS = 12;

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const tenantSlug = searchParams.get('tenant') || 'pornopizza';
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const { t, language } = useLanguage();
  const sk = language === 'sk';
  const toast = useToastContext();
  const { settings: cookieSettings, isLoaded: consentLoaded } = useCookieSettings();

  // Report the purchase to Meta Pixel / GA4 once the order is loaded and the
  // visitor's consent is known. The pixel/gtag scripts are injected by
  // AnalyticsScripts after consent, so poll briefly until they exist.
  useEffect(() => {
    if (!order || !consentLoaded) return;
    if (order.paymentStatus && order.paymentStatus !== 'success' && order.paymentStatus !== 'pending') return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const done = trackPurchase(order, { marketing: cookieSettings.marketing, analytics: cookieSettings.analytics });
      if (done.pixel || done.ga || attempts >= 10) {
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [order, consentLoaded, cookieSettings.marketing, cookieSettings.analytics]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tenantData, orderData] = await Promise.all([
          getTenant(tenantSlug),
          orderId
            ? (async () => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const response = await fetch(`${apiUrl}/api/track/${orderId}`);
                return response.ok ? ((await response.json()) as TrackedOrder) : null;
              })()
            : Promise.resolve(null),
        ]);
        setTenant(tenantData);
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to load order confirmation:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tenantSlug, orderId]);

  useEffect(() => {
    if (!orderId) {
      router.push(`/?tenant=${tenantSlug}`);
      return;
    }
    if (!autoRedirect) return;
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
  }, [orderId, router, tenantSlug, autoRedirect]);

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="h-8 w-8 rounded-full border-[3px] border-white/20 border-t-white animate-spin" aria-label={t.loading} />
      </div>
    );
  }
  if (!orderId) return null;

  const theme = typeof tenant.theme === 'object' && tenant.theme !== null ? (tenant.theme as any) : {};
  const primaryColor = theme.primaryColor || '#E91E63';
  const isDark = isDarkTheme(tenant);
  const backgroundClass = getBackgroundClass(tenant);
  const card = isDark ? 'bg-zinc-900/80 border-white/10' : 'bg-white border-black/5';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const strong = isDark ? 'text-white' : 'text-zinc-900';
  const divider = isDark ? 'border-white/10' : 'border-black/5';

  const orderNumber = order?.orderNumber
    ? order.orderNumber.toString().padStart(4, '0')
    : orderId.slice(0, 8).toUpperCase();
  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/order/${orderId}?tenant=${tenantSlug}` : '';
  const eur = (cents?: number) => `${((cents || 0) / 100).toFixed(2)} €`;
  const addr = order?.address;
  const addressLine = addr
    ? [`${addr.street || ''}${addr.houseNumber ? ` ${addr.houseNumber}` : ''}`.trim(), [addr.postalCode, addr.city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ')
    : null;

  const steps = [
    { label: sk ? 'Zaplatené' : 'Paid', done: true },
    { label: sk ? 'Kuchyňa pečie' : 'Kitchen is baking', done: false },
    { label: sk ? 'Kuriér na ceste' : 'Courier on the way', done: false },
    { label: sk ? 'Doručené' : 'Delivered', done: false },
  ];

  return (
    <div className={`min-h-screen ${backgroundClass} ${isDark ? 'text-white' : 'text-zinc-900'}`}>
      <Header tenant={tenant} />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-24">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 16 }}
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${primaryColor}22` }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: primaryColor }}>
            {t.orderNumberLabel} #{orderNumber}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ textWrap: 'balance' } as any}>
            {sk ? 'Objednávka prijatá, už sa pečie!' : 'Order received — it is already baking!'}
          </h1>
          <p className={`${muted} text-lg`}>
            {sk ? 'Ďakujeme. Potvrdenie sme poslali aj na váš e-mail.' : 'Thank you. We have also sent a confirmation to your email.'}
          </p>
        </motion.div>

        {/* Progress */}
        <motion.ol
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className={`mb-6 grid grid-cols-4 gap-2 rounded-3xl border ${card} p-4`}
          aria-label={sk ? 'Priebeh objednávky' : 'Order progress'}
        >
          {steps.map((step, i) => (
            <li key={step.label} className="flex flex-col items-center text-center gap-2">
              <span
                className="flex h-3 w-3 rounded-full"
                style={{ backgroundColor: step.done ? primaryColor : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
                aria-hidden="true"
              />
              <span className={`text-xs font-semibold leading-tight ${step.done ? strong : muted}`}>{step.label}</span>
              {i === 0 && <span className="sr-only">({sk ? 'hotovo' : 'done'})</span>}
            </li>
          ))}
        </motion.ol>

        {/* Order summary */}
        {order?.items && order.items.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={`mb-6 rounded-3xl border ${card} p-6`}
            aria-labelledby="summary-heading"
          >
            <h2 id="summary-heading" className={`text-[11px] font-bold uppercase tracking-[0.18em] ${muted} mb-4`}>
              {sk ? 'Vaša objednávka' : 'Your order'}
            </h2>
            <ul className="space-y-3">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-baseline justify-between gap-4">
                  <span className={strong}>
                    <span className="font-bold tabular-nums" style={{ color: primaryColor }}>{item.quantity}×</span>{' '}
                    {item.productName || item.name}
                  </span>
                  <span className={`tabular-nums ${muted}`}>{eur(item.totalCents ?? (item.priceCents || 0) * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 border-t ${divider} pt-4 space-y-1.5 text-sm`}>
              {typeof order.deliveryFeeCents === 'number' && (
                <div className={`flex justify-between ${muted}`}>
                  <span>{sk ? 'Doprava' : 'Delivery'}</span>
                  <span className="tabular-nums">{order.deliveryFeeCents === 0 ? (sk ? 'zadarmo' : 'free') : eur(order.deliveryFeeCents)}</span>
                </div>
              )}
              <div className={`flex justify-between text-base font-bold ${strong}`}>
                <span>{sk ? 'Spolu' : 'Total'}</span>
                <span className="tabular-nums">{eur(order.totalCents)}</span>
              </div>
            </div>
            {addressLine && (
              <p className={`mt-4 text-sm ${muted}`}>
                <span className="font-semibold">{sk ? 'Doručíme na: ' : 'Delivering to: '}</span>
                <span className={strong}>{addressLine}</span>
              </p>
            )}
          </motion.section>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push(`/order/${orderId}?tenant=${tenantSlug}`)}
            className="flex-1 rounded-2xl px-6 py-3.5 font-semibold text-white shadow-lg transition hover:brightness-110 active:brightness-90"
            style={{ backgroundColor: primaryColor }}
          >
            {t.trackOrderNow}
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(trackingUrl);
                toast.success(t.linkCopied);
              }
            }}
            className={`flex-1 rounded-2xl border px-6 py-3.5 font-semibold transition ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'}`}
          >
            {t.copyLink}
          </button>
        </motion.div>

        {/* Redirect notice */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className={`mt-6 text-center text-sm ${muted}`}>
          {autoRedirect ? (
            <p>
              {sk ? 'Sledovanie objednávky sa otvorí za' : 'Opening order tracking in'}{' '}
              <span className="tabular-nums font-semibold">{countdown}</span> {sk ? 's' : 's'} ·{' '}
              <button onClick={() => setAutoRedirect(false)} className="underline underline-offset-2 hover:opacity-80">
                {sk ? 'zostať tu' : 'stay here'}
              </button>
            </p>
          ) : (
            <button onClick={() => router.push(`/?tenant=${tenantSlug}`)} className="underline underline-offset-2 hover:opacity-80">
              {t.backToMenu}
            </button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
