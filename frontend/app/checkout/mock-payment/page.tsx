import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import MockPaymentClient from './mock-payment-client';

// Dev-only simulated gateway used by the backend's GoPay/WePay mock mode.
// Must never be reachable on a live storefront.
export default function MockPaymentPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <MockPaymentClient />
    </Suspense>
  );
}
