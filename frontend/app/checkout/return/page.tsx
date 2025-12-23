'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider');
  
  // Standard parameters
  let orderId = searchParams.get('orderId');
  let status = searchParams.get('status');
  
  // GoPay specific parameters
  const paymentSessionId = searchParams.get('paymentSessionId');
  const gopayState = searchParams.get('state');
  const orderNumber = searchParams.get('order_number');

  useEffect(() => {
    // Handle GoPay specific parameters
    if (provider === 'gopay') {
      // If orderId is not in URL, try to get it from order_number
      if (!orderId && orderNumber) {
        orderId = orderNumber;
      }
      
      // Map GoPay state to status
      if (gopayState) {
        switch (gopayState.toUpperCase()) {
          case 'PAID':
            status = 'success';
            break;
          case 'CANCELED':
            status = 'canceled';
            break;
          case 'TIMEOUTED':
            status = 'failed';
            break;
          default:
            // If state is not recognized, use status from URL or default to failed
            status = status || 'failed';
        }
      }
    }

    if (!orderId) {
      router.push('/');
      return;
    }

    // Redirect based on payment status
    if (status === 'success') {
      // Small delay to show processing message
      setTimeout(() => {
        router.push(`/order/success?orderId=${orderId}`);
      }, 1000);
    } else {
      // Payment failed or canceled
      setTimeout(() => {
        router.push(`/checkout?error=payment_${status || 'failed'}&orderId=${orderId}`);
      }, 1000);
    }
  }, [orderId, status, provider, gopayState, orderNumber, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-lg font-semibold text-gray-700">Processing payment...</p>
        {provider && (
          <p className="text-sm text-gray-500 mt-2">Provider: {provider.toUpperCase()}</p>
        )}
        {status === 'success' && (
          <p className="text-sm text-green-600 mt-2">Payment successful! Redirecting...</p>
        )}
        {(status === 'canceled' || status === 'failed') && (
          <p className="text-sm text-red-600 mt-2">Payment {status}. Redirecting...</p>
        )}
      </div>
    </div>
  );
}














