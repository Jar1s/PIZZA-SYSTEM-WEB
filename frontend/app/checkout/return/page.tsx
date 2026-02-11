'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider');

  const orderIdParam = searchParams.get('orderId');
  const statusParam = searchParams.get('status');

  // GoPay specific parameters
  const gopayState = searchParams.get('state');
  const orderNumber = searchParams.get('order_number');

  const { resolvedOrderId, resolvedStatus } = useMemo(() => {
    let mappedOrderId = orderIdParam || orderNumber || null;
    let mappedStatus = statusParam;

    if (provider === 'gopay') {
      if (!mappedOrderId && orderNumber) {
        mappedOrderId = orderNumber;
      }

      if (gopayState) {
        switch (gopayState.toUpperCase()) {
          case 'PAID':
            mappedStatus = 'success';
            break;
          case 'CANCELED':
            mappedStatus = 'canceled';
            break;
          case 'TIMEOUTED':
            mappedStatus = 'failed';
            break;
          default:
            mappedStatus = mappedStatus || 'failed';
        }
      }
    }

    return {
      resolvedOrderId: mappedOrderId,
      resolvedStatus: mappedStatus,
    };
  }, [gopayState, orderIdParam, orderNumber, provider, statusParam]);

  useEffect(() => {
    if (!resolvedOrderId) {
      router.push('/');
      return;
    }

    if (resolvedStatus === 'success') {
      // Small delay to show processing message
      setTimeout(() => {
        router.push(`/order/success?orderId=${resolvedOrderId}`);
      }, 1000);
    } else {
      // Payment failed or canceled
      setTimeout(() => {
        router.push(
          `/checkout?error=payment_${resolvedStatus || 'failed'}&orderId=${resolvedOrderId}`
        );
      }, 1000);
    }
  }, [resolvedOrderId, resolvedStatus, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-lg font-semibold text-gray-700">Processing payment...</p>
        {provider && (
          <p className="text-sm text-gray-500 mt-2">Provider: {provider.toUpperCase()}</p>
        )}
        {resolvedStatus === 'success' && (
          <p className="text-sm text-green-600 mt-2">Payment successful! Redirecting...</p>
        )}
        {(resolvedStatus === 'canceled' || resolvedStatus === 'failed') && (
          <p className="text-sm text-red-600 mt-2">Payment {resolvedStatus}. Redirecting...</p>
        )}
      </div>
    </div>
  );
}
