'use client';

import { OrderStatus } from '@/shared';

interface OrderFiltersProps {
  filters: {
    tenantSlug: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  onChange: (filters: any) => void;
}

export function OrderFilters({ filters, onChange }: OrderFiltersProps) {
  return (
    <div className="flex gap-4 mt-4">
      <select
        value={filters.tenantSlug}
        onChange={e => onChange({ ...filters, tenantSlug: e.target.value })}
        className="border rounded px-3 py-2"
      >
        <option value="all">All Brands</option>
        <option value="pornopizza">PornoPizza</option>
        <option value="pizzavnudzi">Pizza v Núdzi</option>
      </select>
      
      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="border rounded px-3 py-2"
      >
        <option value="all">All Statuses</option>
        <option value={OrderStatus.PENDING}>Pending</option>
        <option value={OrderStatus.PAID}>Paid</option>
        <option value={OrderStatus.PREPARING}>Preparing</option>
        <option value={OrderStatus.READY}>Ready</option>
        <option value={OrderStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
        <option value={OrderStatus.DELIVERED}>Delivered</option>
      </select>
      
      <input
        type="date"
        value={filters.startDate}
        onChange={e => onChange({ ...filters, startDate: e.target.value })}
        className="border rounded px-3 py-2"
        placeholder="Start Date"
      />
      
      <input
        type="date"
        value={filters.endDate}
        onChange={e => onChange({ ...filters, endDate: e.target.value })}
        className="border rounded px-3 py-2"
        placeholder="End Date"
      />
    </div>
  );
}







