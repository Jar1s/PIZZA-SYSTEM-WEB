'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { getProductTranslation, getProductDisplayName } from '@/lib/product-translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateOrderItemPrice } from '@/lib/calculate-order-item-price';
import { Header } from '@/components/layout/Header';
import { StatusTimeline } from '@/components/tracking/StatusTimeline';
import { createPaymentSession, getTenant } from '@/lib/api';
import { Tenant, OrderStatus, OrderItem } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults, getBackgroundClass, isDarkTheme, getSectionShellClass } from '@/lib/tenant-utils';

interface Order {
  id: string;
  orderNumber?: number | null;
  status: string;
  paymentStatus?: string | null;
  paymentRef?: string | null;
  deliveryId?: string | null;
  delivery?: {
    id: string;
    provider: string;
    jobId?: string | null;
    status?: string;
    trackingUrl?: string | null;
    quote?: {
      courierEta?: number | string;
      etaMinutes?: number | string;
      pickupEtaMinutes?: number | string;
      dropoffEtaMinutes?: number | string;
    } | null;
  } | null;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country?: string;
    instructions?: string;
  };
  items: OrderItem[];
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const orderId = params.id as string;
  const tenantSlug = searchParams.get('tenant') || 'pornopizza';
  const paymentInitFailed = searchParams.get('paymentInitFailed') === '1';
  const paymentPending = searchParams.get('paymentPending') === '1';
  const paymentId = searchParams.get('paymentId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantLoadError, setTenantLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const TRACKING_POLL_INTERVAL_MS = 10000;
  const TRACKING_MIN_FETCH_GAP_MS = 2000;
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [retryPaymentError, setRetryPaymentError] = useState<string | null>(null);
  
  // Refs to prevent concurrent requests and track polling
  const isFetchingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Load tenant
  useEffect(() => {
    const loadTenant = async () => {
      setTenantLoading(true);
      setTenantLoadError(null);
      try {
        const tenantData = await getTenant(tenantSlug);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load tenant:', error);
        setTenantLoadError(error instanceof Error ? error.message : 'Failed to load tenant');
      } finally {
        setTenantLoading(false);
      }
    };
    loadTenant();
  }, [tenantSlug]);

  const fetchOrder = useCallback(async (retryCount = 0, isBackgroundRefresh = false, force = false) => {
    // Prevent concurrent requests
    if (isFetchingRef.current && retryCount === 0 && !force) {
      console.log('[Order Tracking] Fetch already in progress, skipping...');
      return;
    }
    
    // Throttle: don't fetch if last fetch was less than 2 seconds ago (respects 30 req/min limit)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < TRACKING_MIN_FETCH_GAP_MS && retryCount === 0 && !force) {
      console.log(`[Order Tracking] Throttling: last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/api/track/${orderId}?t=${Date.now()}`;
      console.log(`[Order Tracking] Fetching order: ${url} (retry ${retryCount}, background: ${isBackgroundRefresh})`);
      
      // Use public tracking endpoint
      const response = await fetch(url, {
        cache: 'no-store',
      });
      
      console.log(`[Order Tracking] Response status: ${response.status}`, { orderId, retryCount });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded - wait longer before retry
          const waitTime = Math.min(60000, 2000 * Math.pow(2, retryCount)); // Min 2s, max 60s, exponential backoff
          console.warn(`[Order Tracking] Rate limit exceeded (429), waiting ${waitTime}ms before retry...`);
          if (retryCount < 2) {
            setTimeout(() => {
              isFetchingRef.current = false; // Allow retry
              fetchOrder(retryCount + 1, isBackgroundRefresh, true);
            }, waitTime);
            return;
          }
          // After max retries, wait longer before allowing next fetch
          isFetchingRef.current = false;
          throw new Error('Too many requests. Please wait a moment and refresh the page.');
        }
        if (response.status === 404) {
          // If order not found and we haven't retried yet, wait a bit and retry
          // (order might still be saving to database)
          if (retryCount < 3) {
            console.log(`[Order Tracking] Order not found, retrying in ${retryCount + 1}s... (${retryCount + 1}/3)`);
            setTimeout(() => {
              isFetchingRef.current = false; // Allow retry
              fetchOrder(retryCount + 1, isBackgroundRefresh, true);
            }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
            return;
          }
          console.error(`[Order Tracking] Order not found after ${retryCount + 1} retries`);
          isFetchingRef.current = false;
          throw new Error('Order not found');
        }
        const errorText = await response.text().catch(() => response.statusText);
        console.error(`[Order Tracking] Failed to load order: ${response.status} - ${errorText}`);
        isFetchingRef.current = false;
        throw new Error(`Failed to load order: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update order data
      setOrder(data);
      setError(null);
      setLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    } catch (err: any) {
      console.error('[Order Tracking] Error fetching order:', err);
      setIsRefreshing(false);
      isFetchingRef.current = false;

      // For initial page load, retry transient network/CORS issues a few times,
      // then fail gracefully instead of spinning forever.
      if (!isBackgroundRefresh && retryCount < 3) {
        const waitTime = 1000 * (retryCount + 1);
        setTimeout(() => {
          isFetchingRef.current = false;
          fetchOrder(retryCount + 1, false, true);
        }, waitTime);
        return;
      }

      if (!isBackgroundRefresh) {
        setError(err?.message || 'Failed to load order');
        setLoading(false);
      }
    }
  }, [orderId, TRACKING_MIN_FETCH_GAP_MS]); // Removed 'order' from dependencies to prevent infinite loops

  // Initial fetch on mount
  useEffect(() => {
    fetchOrder(0);
  }, [orderId, fetchOrder]); // Include fetchOrder in dependencies

  const currentOrderId = order?.id;
  const currentOrderStatus = order?.status;

  // Poll for updates every 10 seconds (only after order is loaded and if order is not delivered/canceled)
  // 10s keeps the page responsive and stays safely under 100 req/min API throttling.
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (!currentOrderId) return;
    
    // Stop polling if order is in final state
    const finalStates = ['DELIVERED', 'CANCELED'];
    if (currentOrderStatus && finalStates.includes(currentOrderStatus)) {
      return;
    }
    
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if not currently fetching
      if (!isFetchingRef.current) {
        fetchOrder(0, true); // true = background refresh
      }
    }, TRACKING_POLL_INTERVAL_MS);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrderId, currentOrderStatus, fetchOrder, TRACKING_POLL_INTERVAL_MS]); // Only depend on order identity/status to prevent interval reset on every order update

  // Refresh immediately when user returns to the tab/window.
  useEffect(() => {
    if (!currentOrderId) return;
    if (currentOrderStatus && ['DELIVERED', 'CANCELED'].includes(currentOrderStatus)) return;

    const refreshNow = () => {
      fetchOrder(0, true, true);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNow();
      }
    };

    window.addEventListener('focus', refreshNow);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshNow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [currentOrderId, currentOrderStatus, fetchOrder]);

  // Keep ETA display moving between network polls.
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // If we were redirected with GoPay paymentId in pending state, keep resolving it in background.
  useEffect(() => {
    if (!paymentPending || !paymentId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const syncGoPayStatus = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const response = await fetch(`${apiUrl}/api/payments/gopay/resolve?id=${encodeURIComponent(paymentId)}`);
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (cancelled) return;

        const resolvedTenant = payload.tenantSlug || tenantSlug;
        const tenantQuery = `&tenant=${encodeURIComponent(resolvedTenant)}`;

        if (payload.status === 'success') {
          router.push(`/order/success?orderId=${payload.orderId}${tenantQuery}`);
          return;
        }

        if (payload.status === 'failed' || payload.status === 'canceled') {
          router.push(`/checkout?error=payment_${payload.status}&orderId=${payload.orderId}${tenantQuery}`);
        }
      } catch {
        // Ignore transient resolve errors; tracking page keeps polling order state as fallback.
      }
    };

    void syncGoPayStatus();

    const interval = setInterval(() => {
      if (attempts >= maxAttempts || cancelled) {
        clearInterval(interval);
        return;
      }
      void syncGoPayStatus();
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [paymentPending, paymentId, router, tenantSlug]);

  // Get tenant theme - Force dark theme for tracking page
  const normalizedTenant = withTenantThemeDefaults(tenant);
  const customizationLabels = normalizedTenant?.theme?.customizationLabels;
  const isDark = true; // Always dark theme for tracking page
  const backgroundClass = 'bg-black'; // Always black background
  const sectionShellClass = 'bg-gray-900 rounded-3xl px-6 py-10 lg:px-16 shadow-xl border border-gray-800'; // Dark cards
  const primaryColor = normalizedTenant?.theme?.primaryColor || '#E91E63';

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍕</div>
          <p className="text-white">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !order || !tenant) {
    const fallbackMessage = tenantLoadError || error || t.orderNotFoundMessage;

    return (
      <div className="min-h-screen bg-black">
        {tenant && <Header tenant={tenant} />}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-3xl px-6 py-10 lg:px-16 shadow-xl border border-gray-800"
          >
            <div className="text-6xl mb-4 text-center">😕</div>
            <h1 className="text-2xl font-bold mb-2 text-center text-white">
              {t.orderNotFound}
            </h1>
            <p className="mb-6 text-center text-gray-300">
              {fallbackMessage}
            </p>
            <div className="text-center">
              <button
                onClick={() => router.push(`/?tenant=${tenantSlug}`)}
                className="px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
              >
                {t.backToHome}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber 
    ? order.orderNumber.toString().padStart(4, '0')
    : order.id.slice(0, 8).toUpperCase(); // Fallback for old orders without orderNumber
  const orderDate = new Date(order.createdAt).toLocaleString('sk-SK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const orderStatus = order.status as OrderStatus;
  const parseOptionalNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const isWoltDelivery = order.delivery?.provider === 'wolt';
  const woltQuote = (order.delivery?.quote as Record<string, unknown> | null | undefined) || null;
  const woltDropoffEtaBaseMinutes =
    parseOptionalNumber(woltQuote?.dropoffEtaMinutes) ??
    parseOptionalNumber(woltQuote?.etaMinutes) ??
    parseOptionalNumber(woltQuote?.courierEta);

  const etaReferenceMs = new Date(order.updatedAt).getTime();
  const woltDropoffEtaRemainingMinutes =
    woltDropoffEtaBaseMinutes != null
      ? Math.max(0, Math.ceil((etaReferenceMs + woltDropoffEtaBaseMinutes * 60000 - nowMs) / 60000))
      : null;
  const woltEtaRingRatio =
    woltDropoffEtaBaseMinutes != null &&
    woltDropoffEtaBaseMinutes > 0 &&
    woltDropoffEtaRemainingMinutes != null
      ? Math.max(0.08, Math.min(1, woltDropoffEtaRemainingMinutes / woltDropoffEtaBaseMinutes))
      : 0.35;
  const woltRingRadius = 92;
  const woltRingCircumference = 2 * Math.PI * woltRingRadius;
  const woltRingDashOffset = woltRingCircumference * (1 - woltEtaRingRatio);

  const woltStatusText = (order.delivery?.status || '').replace(/_/g, ' ').toLowerCase();
  const canRetryPayment =
    orderStatus === OrderStatus.PENDING &&
    order.paymentStatus !== 'success' &&
    (Boolean(order.paymentRef) || paymentInitFailed || paymentPending);

  const handleRetryPayment = async () => {
    if (!order || retryingPayment) return;

    setRetryPaymentError(null);
    setRetryingPayment(true);
    try {
      const payment = await createPaymentSession(order.id);
      if (!payment?.redirectUrl) {
        throw new Error('Payment gateway did not return redirect URL');
      }
      window.location.href = payment.redirectUrl;
    } catch (err: any) {
      const message = err?.message || 'Nepodarilo sa obnoviť platbu';
      setRetryPaymentError(message);
      alert(`Nepodarilo sa obnoviť platbu: ${message}`);
    } finally {
      setRetryingPayment(false);
    }
  };

  return (
    <div className={`min-h-screen ${backgroundClass}`}>
      <Header tenant={tenant} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 ${isDark ? 'text-white' : 'text-gray-800'}`}
        >
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/?tenant=${tenantSlug}`)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t.back || 'Back'}
            </button>
          </div>
          
          {/* Title Section */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{t.trackYourOrder}</h1>
              {isRefreshing && (
                <div className="animate-spin text-2xl">🔄</div>
              )}
            </div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {t.orderNumber} #{orderNumber}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{orderDate}</p>
            {isRefreshing && (
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t.updating}
              </p>
            )}
          </div>
        </motion.div>

        {paymentInitFailed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4"
          >
            <p className="text-sm font-semibold text-amber-300">
              {language === 'sk'
                ? 'Objednávka je vytvorená, ale nepodarilo sa otvoriť platobnú bránu. Skontroluj payment konfiguráciu tenanta.'
                : 'Order was created, but payment gateway could not be opened. Check tenant payment configuration.'}
            </p>
          </motion.div>
        )}

        {paymentPending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-blue-500/50 bg-blue-500/10 p-4"
          >
            <p className="text-sm font-semibold text-blue-300">
              {language === 'sk'
                ? 'Platba je zatiaľ spracovávaná. Stav sa obnoví automaticky.'
                : 'Payment is still processing. Status will update automatically.'}
            </p>
          </motion.div>
        )}

        {canRetryPayment && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold text-emerald-200">
                {language === 'sk'
                  ? 'Platba nebola dokončená. Klikni na pokračovanie a otvorí sa platobná brána znova.'
                  : 'Payment was not completed. Continue to reopen the payment gateway.'}
              </p>
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={retryingPayment}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  retryingPayment ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: primaryColor }}
              >
                {retryingPayment
                  ? (language === 'sk' ? 'Otváram platbu...' : 'Opening payment...')
                  : (language === 'sk' ? 'Pokračovať v platbe' : 'Continue payment')}
              </button>
            </div>
            {retryPaymentError && (
              <p className="mt-2 text-xs text-rose-200">{retryPaymentError}</p>
            )}
          </motion.div>
        )}

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${sectionShellClass} mb-8`}
        >
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {t.orderProgress}
          </h3>
          <StatusTimeline status={orderStatus} paymentStatus={order.paymentStatus} />
        </motion.div>

        {isWoltDelivery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`${sectionShellClass} mb-8`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  🚚 {language === 'sk' ? 'Wolt doručenie' : 'Wolt delivery'}
                </h3>
                {order.delivery?.status && (
                  <p className={`text-sm mt-1 capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {language === 'sk' ? 'Stav kuriéra:' : 'Courier status:'} {woltStatusText}
                  </p>
                )}
                {order.delivery?.trackingUrl && (
                  <a
                    href={order.delivery.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm underline font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {language === 'sk' ? 'Otvoriť live tracking' : 'Open live tracking'}
                  </a>
                )}
              </div>

              <div className="min-w-[240px]">
                <div className={`relative mx-auto h-56 w-56 rounded-full border ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 240 240">
                    <circle
                      cx="120"
                      cy="120"
                      r={woltRingRadius}
                      fill="none"
                      stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.14)'}
                      strokeWidth="18"
                    />
                    <circle
                      cx="120"
                      cy="120"
                      r={woltRingRadius}
                      fill="none"
                      stroke={isDark ? '#34D399' : '#059669'}
                      strokeLinecap="round"
                      strokeWidth="18"
                      strokeDasharray={woltRingCircumference}
                      strokeDashoffset={woltRingDashOffset}
                      style={{ transition: 'stroke-dashoffset 500ms ease-out' }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {language === 'sk' ? 'Est. doručenia' : 'Est. delivery'}
                    </p>
                    <p className={`mt-2 text-5xl font-black leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {woltDropoffEtaRemainingMinutes != null ? woltDropoffEtaRemainingMinutes : '--'}
                    </p>
                    <p className={`mt-1 text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {language === 'sk' ? 'minút do doručenia' : 'minutes until delivery'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className={`text-xs mt-3 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {language === 'sk'
                ? 'Čas sa priebežne aktualizuje počas sledovania objednávky.'
                : 'Estimated times update continuously while tracking your order.'}
            </p>
          </motion.div>
        )}

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${sectionShellClass} mb-8`}
        >
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {t.orderDetails}
          </h3>
          
          {/* Items */}
          <div className={`space-y-3 mb-6 pb-6 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
            {order.items.map((item) => {
              // Use centralized function: for orders (string), uses static mapping
              // Use displayName from DB if available, otherwise use centralized function
              console.log('[Order Detail] Item displayName check:', {
                itemId: item.id,
                productName: item.productName,
                displayName: item.displayName,
                hasDisplayName: !!item.displayName,
              });
              const displayName = item.displayName || getProductDisplayName(item.productName, language);
              
              const modifiers = formatModifiers(item.modifiers, false, language, customizationLabels);
              
              return (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.quantity}x {displayName}
                    </p>
                    {modifiers.length > 0 && (
                      <div className={`text-sm mt-1 space-y-0.5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {modifiers.map((mod, idx) => (
                          <div key={idx}>• {mod}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    €{(calculateOrderItemPrice(item, 'PIZZA') / 100).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className={`space-y-2 mb-6 pb-6 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
            <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span>{t.subtotal}</span>
              <span>€{(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            {order.deliveryFeeCents > 0 && (
              <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>{t.deliveryFee}</span>
                <span>€{(order.deliveryFeeCents / 100).toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between text-xl font-bold pt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <span>{t.total}</span>
              <span style={{ color: primaryColor }}>
                €{(order.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {t.deliveryAddress}
            </h4>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {order.customer.name}<br />
              {order.address.street}<br />
              {order.address.city}, {order.address.postalCode}<br />
              {order.address.country || (language === 'sk' ? 'Slovensko' : 'Slovakia')}
            </p>
            {order.address.instructions && (
              <p className={`text-sm mt-2 italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.note}: {order.address.instructions}
              </p>
            )}
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${sectionShellClass} text-center`}
        >
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {t.needHelp}
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t.questionsAboutOrder}
          </p>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {tenant && (
              <>
                <a 
                  href={`tel:+421914363363`}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-colors"
                >
                  📱 0914 363 363
                </a>
                <br />
                <a 
                  href={`mailto:info@${tenant.subdomain || tenantSlug}.sk`}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-colors"
                >
                  📧 info@{tenant.subdomain || tenantSlug}.sk
                </a>
              </>
            )}
          </p>
        </motion.div>

      </div>
    </div>
  );
}
