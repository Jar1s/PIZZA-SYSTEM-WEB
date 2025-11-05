import { OrderList } from '@/components/admin/OrderList';

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders Management</h1>
      <p className="text-gray-600 mb-8">
        Manage all orders from all brands in one place.
      </p>
      <OrderList />
    </div>
  );
}

