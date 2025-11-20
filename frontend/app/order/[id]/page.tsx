'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { useLanguage } from '@/contexts/LanguageContext';

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

const orderStatuses = {
  PENDING: {
    label: 'Order Received',
    icon: '📋',
    color: '#6b7280',
    description: 'We received your order',
  },
  PAID: {
    label: 'Payment Confirmed',
    icon: '💳',
    color: '#3b82f6',
    description: 'Payment successful',
  },
  PREPARING: {
    label: 'Preparing',
    icon: '👨‍🍳',
    color: '#f59e0b',
    description: 'Your pizza is being made',
  },
  READY: {
    label: 'Ready',
    icon: '✅',
    color: '#10b981',
    description: 'Order is ready',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    icon: '🚗',
    color: '#8b5cf6',
    description: 'Driver is on the way',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: '🎉',
    color: '#22c55e',
    description: 'Enjoy your meal!',
  },
  CANCELED: {
    label: 'Canceled',
    icon: '❌',
    color: '#ef4444',
    description: 'Order was canceled',
  },
};

const statusOrder = ['PENDING', 'PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const orderId = params.id as string;
  const tenant = searchParams.get('tenant') || 'pornopizza'; // Default tenant
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      // Use tenant-specific endpoint instead of track endpoint
      const response = await fetch(`${apiUrl}/api/${tenant}/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Order not found');
      }
      
      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, tenant]);

  useEffect(() => {
    fetchOrder();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍕</div>
          <p className="text-gray-600 text-lg">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'We couldn\'t find this order'}</p>
          <a
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  const currentStatusInfo = orderStatuses[order.status as keyof typeof orderStatuses];
  const currentStatusIndex = statusOrder.indexOf(order.status);
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push(`/?tenant=${tenant}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">{t.back}</span>
          </button>
        </motion.div>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Order #{orderNumber}</p>
          <p className="text-gray-500 text-sm">{orderDate}</p>
        </motion.div>

        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center"
          style={{ borderTop: `4px solid ${currentStatusInfo.color}` }}
        >
          <div className="text-7xl mb-4">{currentStatusInfo.icon}</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentStatusInfo.label}</h2>
          <p className="text-gray-600 text-lg">{currentStatusInfo.description}</p>
        </motion.div>

        {/* Status Timeline */}
        {order.status !== 'CANCELED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Order Progress</h3>
            <div className="space-y-4">
              {statusOrder.map((status, index) => {
                const statusInfo = orderStatuses[status as keyof typeof orderStatuses];
                const isComplete = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={status} className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                        isComplete
                          ? 'bg-green-100 scale-110'
                          : 'bg-gray-100 opacity-50'
                      } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                    >
                      {statusInfo.icon}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          isComplete ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {statusInfo.label}
                      </p>
                      <p
                        className={`text-sm ${
                          isComplete ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {statusInfo.description}
                      </p>
                    </div>
                    {isComplete && (
                      <div className="text-green-500 text-xl">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">Order Details</h3>
          
          {/* Items */}
          <div className="space-y-3 mb-6 pb-6 border-b">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    {item.quantity}x {item.productName}
                  </p>
                  {(() => {
                    const modifiers = formatModifiers(item.modifiers, true, language); // Use defaults
                    return modifiers.length > 0 && (
                      <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                        {modifiers.map((mod, idx) => (
                          <div key={idx}>• {mod}</div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <p className="font-semibold text-gray-700">
                  €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-6 pb-6 border-b">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>€{(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (20%)</span>
              <span>€{(order.taxCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>€{(order.deliveryFeeCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2">
              <span>Total</span>
              <span className="text-orange-500">€{(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Delivery Address</h4>
            <p className="text-gray-600">
              {order.customer.name}<br />
              {order.address.street}<br />
              {order.address.city}, {order.address.postalCode}<br />
              {order.address.country || 'Slovakia'}
            </p>
            {order.address.instructions && (
              <p className="text-gray-500 text-sm mt-2 italic">
                Note: {order.address.instructions}
              </p>
            )}
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Questions about your order? Contact us at:
          </p>
          <p className="text-gray-800 font-semibold">
            📧 {order.customer.email}<br />
            📱 {order.customer.phone}
          </p>
        </motion.div>

      </div>
    </div>
  );
}

