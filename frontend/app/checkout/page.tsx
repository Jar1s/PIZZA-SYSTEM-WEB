'use client';

import { useState, useEffect } from 'react';
import { useCart, useCartTotal } from '@/hooks/useCart';
import { createOrder, createPaymentSession } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const { items } = useCart();
  const total = useCartTotal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState('pornopizza');
  
  useEffect(() => {
    // Get tenant from query or default
    const params = new URLSearchParams(window.location.search);
    setTenant(params.get('tenant') || 'pornopizza');
    
    // Redirect if cart is empty
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create order
      const order = await createOrder(tenant, {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: 'SK',
        },
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          modifiers: item.modifiers,
        })),
      });
      
      // For now, redirect to success page
      // TODO: In production, integrate payment gateway first
      router.push(`/order/success?orderId=${order.id}`);
      
      // Create payment session (for later integration)
      // const payment = await createPaymentSession(order.id);
      // if (payment.redirectUrl) {
      //   window.location.href = payment.redirectUrl;
      // }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-primary)' }}>
            Checkout
          </h1>
          
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {items.map(item => (
              <div key={item.id} className="flex justify-between mb-2">
                <span>{item.product.name} x {item.quantity}</span>
                <span>€{((item.product.priceCents * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t">
              <span>Total:</span>
              <span>€{(total / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                placeholder="+421 900 123 456"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Delivery Address</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={e => setFormData({ ...formData, street: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                placeholder="Street and number"
              />
              <input
                type="text"
                required
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                placeholder="City"
              />
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
                placeholder="Postal Code"
              />
            </div>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </motion.button>
            
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg border-2 font-semibold text-lg"
              style={{ 
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)'
              }}
            >
              Back to Menu
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}


