'use client';

import { useCart, useCartTotal } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export function Cart() {
  const { items, isOpen, closeCart } = useCart();
  const total = useCartTotal();
  const router = useRouter();
  
  // Debug logging
  useEffect(() => {
    console.log('Cart component - isOpen changed:', isOpen, 'items:', items.length);
  }, [isOpen, items.length]);
  
  const handleCheckout = () => {
    closeCart();
    
    // Get tenant from URL or default
    const hostname = window.location.hostname;
    let tenantSlug = 'pornopizza'; // default
    
    if (hostname.includes('pornopizza')) {
      tenantSlug = 'pornopizza';
    } else if (hostname.includes('pizzavnudzi')) {
      tenantSlug = 'pizzavnudzi';
    } else if (hostname.includes('localhost')) {
      const params = new URLSearchParams(window.location.search);
      tenantSlug = params.get('tenant') || 'pornopizza';
    }
    
    // Redirect to login page (user must authenticate before checkout)
    router.push(`/auth/login?tenant=${tenantSlug}`);
  };
  
  // Always render the container, but conditionally show content
  if (!isOpen) return null;
  
  return (
    <>
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-6 z-[1000] flex flex-col"
        style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '100%',
          maxWidth: '28rem',
          zIndex: 1000,
        }}
      >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button
                onClick={closeCart}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                &times;
              </button>
            </div>
            
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto mb-6">
                  {items.map(item => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold mb-4">
                    <span>Total:</span>
                    <span>€{(total / 100).toFixed(2)}</span>
                  </div>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Checkout
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
    </>
  );
}


