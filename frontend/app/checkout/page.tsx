'use client';

import { useState, useEffect } from 'react';
import { useCart, useCartTotal } from '@/hooks/useCart';
import { createOrder, createPaymentSession } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const total = useCartTotal();
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState('pornopizza');
  
  useEffect(() => {
    // Get tenant from query or default
    const params = new URLSearchParams(window.location.search);
    setTenant(params.get('tenant') || 'pornopizza');
    
    // Wait for auth to load before checking
    if (authLoading) {
      return;
    }
    
    // Redirect to login if not authenticated
    if (!user) {
      // Redirect to login without returnUrl - after login, user will be redirected back to checkout
      // Use window.location for full page reload to ensure correct route
      window.location.href = `/auth/login?tenant=${tenant}`;
      return;
    }
    
    // Wait a bit for cart to load from localStorage (zustand persist)
    // Check cart from localStorage directly if items array is empty
    if (items.length === 0) {
      // Give cart time to hydrate from localStorage (especially after OAuth redirect)
      // Don't redirect immediately - wait for zustand to hydrate
      const checkCart = setTimeout(() => {
        const cartStorage = localStorage.getItem('cart-storage');
        if (cartStorage) {
          try {
            const cartData = JSON.parse(cartStorage);
            if (cartData.state && cartData.state.items && cartData.state.items.length > 0) {
              // Cart has items in localStorage, just wait for zustand to hydrate
              console.log('Checkout - cart has items in localStorage, waiting for zustand to hydrate');
              // Don't redirect - zustand will update items array soon
              return;
            }
          } catch (e) {
            console.error('Checkout - invalid cart data:', e);
          }
        }
        
        // Cart appears empty, but wait longer for OAuth redirects
        // After OAuth, cart might take time to hydrate
        console.log('Checkout - cart appears empty, waiting longer for OAuth redirects');
        
        // Wait even longer (total 5 seconds) before redirecting
        const finalCheck = setTimeout(() => {
          // Final check - if cart is still empty, redirect to home
          const finalCartStorage = localStorage.getItem('cart-storage');
          const finalItems = items.length; // Check zustand state too
          
          if (finalItems > 0) {
            // Items loaded in zustand, don't redirect
            console.log('Checkout - items loaded in zustand, staying on checkout');
            return;
          }
          
          if (finalCartStorage) {
            try {
              const finalCartData = JSON.parse(finalCartStorage);
              if (finalCartData.state && finalCartData.state.items && finalCartData.state.items.length > 0) {
                // Cart has items, just wait for zustand
                console.log('Checkout - cart found in localStorage, waiting for zustand');
                return;
              }
            } catch (e) {
              // Invalid cart data
            }
          }
          
          // Cart is really empty after all checks, redirect to home
          console.log('Checkout - cart is empty after all checks, redirecting to home');
          router.push('/');
        }, 3000); // Additional 3 seconds (total 5 seconds)
        
        return () => clearTimeout(finalCheck);
      }, 2000); // Initial 2 seconds
      
      return () => clearTimeout(checkCart);
    }
  }, [items, router, tenant, user, authLoading]);
  
  const handlePay = async () => {
    if (!user) {
      alert('Please log in to continue');
      return;
    }

    setLoading(true);
    
    try {
      // Create order with user data from authentication
      const order = await createOrder(tenant, {
        customer: {
          name: user.name || 'Customer',
          email: user.email || '',
          phone: '', // Phone can be empty or from user profile if available
        },
        address: {
          street: '', // Address can be collected later or from user profile
          city: '',
          postalCode: '',
          country: 'SK',
        },
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          modifiers: item.modifiers,
        })),
      });
      
      // Create payment session
      try {
        const payment = await createPaymentSession(order.id);
        
        if (payment.redirectUrl) {
          // Redirect to payment gateway (Adyen, GoPay, or WePay)
          window.location.href = payment.redirectUrl;
          return;
        }
      } catch (paymentError) {
        console.error('Payment session creation failed:', paymentError);
        // Continue to success page even if payment fails (for testing)
        // In production, you might want to show an error or retry
      }
      
      // If no redirect URL, go to success page
      router.push(`/order/success?orderId=${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
      
      // Check if it's a product validation error
      if (errorMessage.includes('not found') || errorMessage.includes('inactive')) {
        alert('Some items in your cart are no longer available. Please refresh the page and add items again.');
        // Clear cart and redirect
        clearCart();
        router.push('/');
      } else {
        alert(`Failed to process order: ${errorMessage}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
          <p className="mt-4 text-lg text-gray-700">Načítavam...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (handled in useEffect)
  if (!user) {
    return null;
  }

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
            {items.map(item => {
              const modifiers = formatModifiers(item.modifiers);
              return (
                <div key={item.id} className="mb-4 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <div className="font-semibold">{item.product.name} x {item.quantity}</div>
                      {modifiers.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                          {modifiers.map((mod, idx) => (
                            <div key={idx} className="text-xs">• {mod}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold ml-4">€{((item.product.priceCents * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t">
              <span>Total:</span>
              <span>€{(total / 100).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Customer Info (read-only, from authentication) */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2 text-gray-700">
              <div><strong>Name:</strong> {user.name || 'N/A'}</div>
              <div><strong>Email:</strong> {user.email || 'N/A'}</div>
            </div>
          </div>
          
          {/* Payment Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </motion.button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-3 mt-4 rounded-lg border-2 font-semibold text-lg"
            style={{ 
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            }}
          >
            Back to Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}


