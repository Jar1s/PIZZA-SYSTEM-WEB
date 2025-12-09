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
import { getTenant } from '@/lib/api';
import { Tenant, OrderStatus, OrderItem } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults, getBackgroundClass, isDarkTheme, getSectionShellClass } from '@/lib/tenant-utils';

interface Order {
  id: string;
  orderNumber?: number | null;
  status: string;
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
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs to prevent concurrent requests and track polling
  const isFetchingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Load tenant
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantData = await getTenant(tenantSlug);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load tenant:', error);
      }
    };
    loadTenant();
  }, [tenantSlug]);

  const fetchOrder = useCallback(async (retryCount = 0, isBackgroundRefresh = false) => {
    // Prevent concurrent requests
    if (isFetchingRef.current && retryCount === 0) {
      console.log('[Order Tracking] Fetch already in progress, skipping...');
      return;
    }
    
    // Throttle: don't fetch if last fetch was less than 2 seconds ago (respects 30 req/min limit)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < 2000 && retryCount === 0) {
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
      const url = `${apiUrl}/api/track/${orderId}`;
      console.log(`[Order Tracking] Fetching order: ${url} (retry ${retryCount}, background: ${isBackgroundRefresh})`);
      
      // Use public tracking endpoint
      const response = await fetch(url);
      
      console.log(`[Order Tracking] Response status: ${response.status}`, { orderId, retryCount });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded - wait longer before retry
          const waitTime = Math.min(60000, 2000 * Math.pow(2, retryCount)); // Min 2s, max 60s, exponential backoff
          console.warn(`[Order Tracking] Rate limit exceeded (429), waiting ${waitTime}ms before retry...`);
          if (retryCount < 2) {
            setTimeout(() => {
              isFetchingRef.current = false; // Allow retry
              fetchOrder(retryCount + 1, isBackgroundRefresh);
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
              fetchOrder(retryCount + 1, isBackgroundRefresh);
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
      // Only set error if we've exhausted retries
      if (retryCount >= 3) {
        setError(err.message || 'Failed to load order');
        setLoading(false);
      }
    }
  }, [orderId]); // Removed 'order' from dependencies to prevent infinite loops

  // Initial fetch on mount
  useEffect(() => {
    fetchOrder(0);
  }, [orderId]); // Only depend on orderId, not fetchOrder

  // Poll for updates every 45 seconds (only after order is loaded and if order is not delivered/canceled)
  // Increased to 45s to be well under the 30 req/min limit (allows ~1.3 req/min)
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (!order) return;
    
    // Stop polling if order is in final state
    const finalStates = ['DELIVERED', 'CANCELED'];
    if (finalStates.includes(order.status)) {
      return;
    }
    
    // Start polling with longer interval
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if not currently fetching
      if (!isFetchingRef.current) {
        fetchOrder(0, true); // true = background refresh
      }
    }, 45000); // Poll every 45 seconds to avoid rate limiting
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [order?.id, order?.status]); // Only depend on order ID and status, not the whole order object

  // Get tenant theme - Force dark theme for tracking page
  const normalizedTenant = withTenantThemeDefaults(tenant);
  const isDark = true; // Always dark theme for tracking page
  const backgroundClass = 'bg-black'; // Always black background
  const sectionShellClass = 'bg-gray-900 rounded-3xl px-6 py-10 lg:px-16 shadow-xl border border-gray-800'; // Dark cards
  const primaryColor = normalizedTenant?.theme?.primaryColor || '#E91E63';

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍕</div>
          <p className="text-white">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black">
        <Header tenant={tenant} />
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
              {error || t.orderNotFoundMessage}
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
          <StatusTimeline status={orderStatus} />
        </motion.div>

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
              const displayName = item.displayName || getProductDisplayName(item.productName, language);
              
              const modifiers = formatModifiers(item.modifiers, false, language);
              
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
