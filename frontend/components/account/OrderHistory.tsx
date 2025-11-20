'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Order } from '@pizza-ecosystem/shared';

interface OrderHistoryProps {
  tenant: string;
  isDark?: boolean;
}

export default function OrderHistory({ tenant, isDark = false }: OrderHistoryProps) {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${API_URL}/api/customer/account/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else if (res.status === 401) {
        // Token expired or invalid - clear it and let auth context handle logout
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
        setOrders([]);
      } else {
        console.error('[OrderHistory] Failed to fetch orders:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[OrderHistory] Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to load and user to be available before fetching orders
    if (authLoading) {
      return;
    }
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchOrders();
  }, [authLoading, user, fetchOrders]);

  // Show loading if auth is loading, user is not available, or orders are being fetched
  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6">
          <svg className={`w-24 h-24 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.emptyList}</h3>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-center max-w-md`}>{t.emptyOrderHistory}</p>
        <button
          onClick={() => router.push(`/?tenant=${tenant}`)}
          className={`mt-6 px-6 py-3 rounded-full font-semibold ${isDark ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55]' : 'text-white'}`}
          style={!isDark ? { backgroundColor: 'var(--color-primary)' } : undefined}
        >
          Objednať teraz
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.orderHistory}</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`rounded-2xl p-6 border transition-shadow ${
              isDark
                ? 'bg-white/5 border-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
                : 'border-gray-200 bg-white hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-semibold mb-1">
                  {t.orderNumber}: {order.id.slice(0, 8)}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t.orderDate}: {new Date(order.createdAt).toLocaleDateString('sk-SK')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                  €{(order.totalCents / 100).toFixed(2)}
                </div>
                <div className={`text-sm mt-1 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {order.status}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/order/${order.id}?tenant=${tenant}`)}
              className={`text-sm font-semibold ${isDark ? 'text-white' : ''}`}
              style={!isDark ? { color: 'var(--color-primary)' } : undefined}
            >
              {t.viewOrder} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
