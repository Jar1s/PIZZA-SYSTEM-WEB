import { OrderList } from '@/components/admin/OrderList';
import { KPICards } from '@/components/admin/KPICards';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <KPICards />
      <OrderList />
    </div>
  );
}

