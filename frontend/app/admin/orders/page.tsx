import { OrderList } from '@/components/admin/OrderList';

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">Orders Management</h1>
      <p className="text-gray-600 mb-6 lg:mb-8 text-sm lg:text-base">
        Manage all orders from all brands in one place.
      </p>
      <OrderList />
    </div>
  );
}

