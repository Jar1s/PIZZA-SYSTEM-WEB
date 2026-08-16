'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const sk = language === 'sk';
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
    if (gopayPaymentId) {
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
          router.push(
            `/order/${payload.orderId}?paymentPending=1&paymentId=${encodeURIComponent(gopayPaymentId)}${tenantSuffix}`
          );
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

  const stage: 'verifying' | 'success' | 'pending' | 'failed' =
    resolvedStatus === 'success'
      ? 'success'
      : resolvedStatus === 'pending'
        ? 'pending'
        : resolvedStatus === 'canceled' || resolvedStatus === 'failed'
          ? 'failed'
          : 'verifying';

  const copy = {
    verifying: {
      title: sk ? 'Overujeme vašu platbu' : 'Verifying your payment',
      body: sk
        ? 'Chvíľku strpenia — potvrdzujeme platbu s bankou. Nezatvárajte prosím toto okno.'
        : 'One moment — we are confirming the payment with your bank. Please keep this window open.',
    },
    success: {
      title: sk ? 'Platba prijatá' : 'Payment received',
      body: sk ? 'Objednávka je zaplatená. Presmerujeme vás na potvrdenie…' : 'Your order is paid. Taking you to the confirmation…',
    },
    pending: {
      title: sk ? 'Platba sa spracováva' : 'Payment in progress',
      body: sk
        ? 'Banka platbu ešte potvrdzuje. Stav objednávky uvidíte na stránke sledovania.'
        : 'Your bank is still confirming the payment. You can follow the status on the tracking page.',
    },
    failed: {
      title: sk ? 'Platba neprebehla' : 'Payment did not go through',
      body: sk
        ? 'Nič sme vám nestrhli. Vraciame vás do pokladne, kde to môžete skúsiť znova.'
        : 'You have not been charged. Taking you back to checkout to try again.',
    },
  }[stage];

  const accent = stage === 'failed' ? '#DC2626' : stage === 'pending' ? '#D97706' : '#16A34A';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur px-8 py-10 text-center shadow-2xl"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}22` }}>
          {stage === 'verifying' || stage === 'pending' ? (
            <span
              className="h-8 w-8 rounded-full border-[3px] border-white/20 animate-spin"
              style={{ borderTopColor: accent }}
              aria-hidden="true"
            />
          ) : stage === 'success' ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-3" style={{ textWrap: 'balance' } as any}>{copy.title}</h1>
        <p className="text-zinc-400 leading-relaxed">{copy.body}</p>
        {(provider || gopayPaymentId) && (
          <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-zinc-600">
            {sk ? 'Platobná brána' : 'Payment gateway'}: {(provider || 'gopay').toUpperCase()}
          </p>
        )}
      </motion.div>
    </div>
  );
}
