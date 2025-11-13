'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MockPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const provider = searchParams.get('provider') || 'wepay';
  const [processing, setProcessing] = useState(false);

  const handleSuccess = () => {
    setProcessing(true);
    // Simulate payment success
    setTimeout(() => {
      router.push(`/checkout/return?orderId=${orderId}&status=success&provider=${provider}`);
    }, 1500);
  };

  const handleCancel = () => {
    router.push(`/checkout/return?orderId=${orderId}&status=canceled&provider=${provider}`);
  };

  useEffect(() => {
    if (!orderId) {
      router.push('/');
    }
  }, [orderId, router]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Mock Payment ({provider.toUpperCase()})</h2>
        <p className="text-gray-600 mb-6">
          This is a mock payment page for testing. Order ID: <strong>{orderId}</strong>
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Development Mode:</strong> This is a simulated payment page. 
            In production, you would be redirected to the actual payment gateway.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleSuccess}
            disabled={processing}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {processing ? 'Processing...' : '✅ Simulate Successful Payment'}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={processing}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            ❌ Cancel Payment
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-500 text-center">
            This page is only available in development mode
          </p>
        </div>
      </div>
    </div>
  );
}





