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
  const gopayPaymentId = searchParams.get('id');
  const gopayState = searchParams.get('state');
  const orderNumber = searchParams.get('order_number');

  const { resolvedOrderId, resolvedStatus } = useMemo(() => {
    let mappedOrderId = orderIdParam || orderNumber || null;
    let mappedStatus = statusParam;

    if (provider === 'gopay' || gopayPaymentId) {
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
      } else if (!mappedStatus) {
        mappedStatus = 'pending';
      }
    }

    return {
      resolvedOrderId: mappedOrderId,
      resolvedStatus: mappedStatus,
    };
  }, [gopayPaymentId, gopayState, orderIdParam, orderNumber, provider, statusParam]);

  useEffect(() => {
    // GoPay documentation flow: return_url is called with ?id=<payment_id>.
    // Resolve payment ID to order/status via backend and then redirect.
    if (gopayPaymentId && !resolvedOrderId) {
      let cancelled = false;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const resolveGopayReturn = async () => {
        const response = await fetch(`${apiUrl}/api/payments/gopay/resolve?id=${encodeURIComponent(gopayPaymentId)}`);
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(errorText || 'Failed to resolve GoPay return');
        }

        const payload = await response.json();
        if (cancelled) return;

        const tenantSuffix = payload.tenantSlug ? `&tenant=${encodeURIComponent(payload.tenantSlug)}` : '';
        if (payload.status === 'success') {
          router.push(`/order/success?orderId=${payload.orderId}${tenantSuffix}`);
          return;
        }

        if (payload.status === 'pending') {
          router.push(`/order/${payload.orderId}?paymentPending=1${tenantSuffix}`);
          return;
        }

        router.push(`/checkout?error=payment_${payload.status || 'failed'}&orderId=${payload.orderId}${tenantSuffix}`);
      };

      resolveGopayReturn().catch(() => {
        if (!cancelled) {
          router.push('/checkout?error=payment_failed');
        }
      });

      return () => {
        cancelled = true;
      };
    }

    if (!resolvedOrderId) {
      router.push('/');
      return;
    }

    if (resolvedStatus === 'success') {
      // Small delay to show processing message
      setTimeout(() => {
        router.push(`/order/success?orderId=${resolvedOrderId}`);
      }, 1000);
    } else if (resolvedStatus === 'pending') {
      setTimeout(() => {
        router.push(`/order/${resolvedOrderId}?paymentPending=1`);
      }, 1000);
    } else {
      // Payment failed or canceled
      setTimeout(() => {
        router.push(
          `/checkout?error=payment_${resolvedStatus || 'failed'}&orderId=${resolvedOrderId}`
        );
      }, 1000);
    }
  }, [gopayPaymentId, resolvedOrderId, resolvedStatus, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-lg font-semibold text-gray-700">Processing payment...</p>
        {(provider || gopayPaymentId) && (
          <p className="text-sm text-gray-500 mt-2">Provider: {(provider || 'gopay').toUpperCase()}</p>
        )}
        {resolvedStatus === 'success' && (
          <p className="text-sm text-green-600 mt-2">Payment successful! Redirecting...</p>
        )}
        {resolvedStatus === 'pending' && (
          <p className="text-sm text-amber-600 mt-2">Payment pending. Redirecting...</p>
        )}
        {(resolvedStatus === 'canceled' || resolvedStatus === 'failed') && (
          <p className="text-sm text-red-600 mt-2">Payment {resolvedStatus}. Redirecting...</p>
        )}
      </div>
    </div>
  );
}
