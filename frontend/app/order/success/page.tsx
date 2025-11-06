'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    // Countdown redirect
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push(`/order/${orderId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  if (!orderId) {
    return null;
  }

  const orderNumber = orderId.slice(0, 8).toUpperCase();
  const trackingUrl = `${window.location.origin}/order/${orderId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
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
            Order Confirmed! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Thank you for your order!
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Order #{orderNumber}
          </p>
        </motion.div>

        {/* Email Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">📧</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Check Your Email
              </h3>
              <p className="text-blue-700 text-sm">
                We&apos;ve sent a confirmation email with your order details and tracking link.
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
          <h3 className="font-semibold text-gray-800 mb-3">Track Your Order</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
            <code className="text-sm text-gray-600 break-all">{trackingUrl}</code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(trackingUrl);
              alert('Tracking link copied to clipboard!');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            📋 Copy Link
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
            Redirecting to tracking page in {countdown} seconds...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full bg-green-500"
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
            onClick={() => router.push(`/order/${orderId}`)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Track Order Now
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 pt-8 border-t"
        >
          <p className="text-gray-500 text-sm">
            Questions? Contact us at the phone number or email you provided with your order.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

