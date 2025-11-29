'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { StatusTimeline } from '@/components/tracking/StatusTimeline';
import { getTenant } from '@/lib/api';
import { Tenant, OrderStatus } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults, getBackgroundClass, isDarkTheme, getSectionShellClass } from '@/lib/tenant-utils';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  priceCents: number;
  modifiers?: any;
}

interface Order {
  id: string;
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

  const fetchOrder = useCallback(async (retryCount = 0) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/api/track/${orderId}`;
      console.log(`[Order Tracking] Fetching order: ${url} (retry ${retryCount})`);
      
      // Use public tracking endpoint
      const response = await fetch(url);
      
      console.log(`[Order Tracking] Response status: ${response.status}`, { orderId, retryCount });
      
      if (!response.ok) {
        if (response.status === 404) {
          // If order not found and we haven't retried yet, wait a bit and retry
          // (order might still be saving to database)
          if (retryCount < 3) {
            console.log(`[Order Tracking] Order not found, retrying in ${retryCount + 1}s... (${retryCount + 1}/3)`);
            setTimeout(() => {
              fetchOrder(retryCount + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
            return;
          }
          console.error(`[Order Tracking] Order not found after ${retryCount + 1} retries`);
          throw new Error('Order not found');
        }
        const errorText = await response.text().catch(() => response.statusText);
        console.error(`[Order Tracking] Failed to load order: ${response.status} - ${errorText}`);
        throw new Error(`Failed to load order: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[Order Tracking] Order loaded successfully:`, { orderId: data.id, status: data.status });
      setOrder(data);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error('[Order Tracking] Error fetching order:', err);
      // Only set error if we've exhausted retries
      if (retryCount >= 3) {
        setError(err.message || 'Failed to load order');
        setLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder(0);
  }, [fetchOrder]);

  // Poll for updates every 30 seconds (only after order is loaded)
  useEffect(() => {
    if (!order) return;
    
    const interval = setInterval(() => {
      fetchOrder(0);
    }, 30000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

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
              {t.orderNotFound || 'Order Not Found'}
            </h1>
            <p className="mb-6 text-center text-gray-300">
              {error || (t.orderNotFoundMessage || 'We couldn\'t find this order')}
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
                {t.backToHome || 'Back to Home'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const orderNumber = order.id.slice(0, 8).toUpperCase();
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
          className={`text-center mb-8 ${isDark ? 'text-white' : 'text-gray-800'}`}
        >
          <h1 className="text-4xl font-bold mb-2">{t.trackYourOrder || 'Track Your Order'}</h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            {t.orderNumber || 'Order'} #{orderNumber}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{orderDate}</p>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${sectionShellClass} mb-8`}
        >
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {t.orderProgress || 'Order Progress'}
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
            {t.orderDetails || 'Order Details'}
          </h3>
          
          {/* Items */}
          <div className={`space-y-3 mb-6 pb-6 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.quantity}x {item.productName}
                  </p>
                  {(() => {
                    const modifiers = formatModifiers(item.modifiers, true, language);
                    return modifiers.length > 0 && (
                      <div className={`text-sm mt-1 space-y-0.5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {modifiers.map((mod, idx) => (
                          <div key={idx}>• {mod}</div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={`space-y-2 mb-6 pb-6 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
            <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span>{t.subtotal || 'Subtotal'}</span>
              <span>€{(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            {order.deliveryFeeCents > 0 && (
              <div className={`flex justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>{t.deliveryFee || 'Delivery Fee'}</span>
                <span>€{(order.deliveryFeeCents / 100).toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between text-xl font-bold pt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <span>{t.total || 'Total'}</span>
              <span style={{ color: primaryColor }}>
                €{(order.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {t.deliveryAddress || 'Delivery Address'}
            </h4>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {order.customer.name}<br />
              {order.address.street}<br />
              {order.address.city}, {order.address.postalCode}<br />
              {order.address.country || 'Slovakia'}
            </p>
            {order.address.instructions && (
              <p className={`text-sm mt-2 italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.note || 'Note'}: {order.address.instructions}
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
            {t.needHelp || 'Need Help?'}
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t.questionsAboutOrder || 'Questions about your order? Contact us at:'}
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
