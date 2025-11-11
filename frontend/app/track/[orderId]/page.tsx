import { OrderTracker } from '@/components/tracking/OrderTracker';
import { getOrder } from '@/lib/api';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { orderId: string };
}

export default async function TrackingPage({ params }: PageProps) {
  let order;
  
  try {
    order = await getOrder(params.orderId);
  } catch (error) {
    notFound();
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <OrderTracker order={order} />
      </div>
    </main>
  );
}








