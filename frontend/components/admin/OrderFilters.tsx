'use client';

import { OrderStatus } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslations } from '@/lib/translations';

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
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  const getStatusLabel = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: t.orderStatusPending,
      [OrderStatus.PAID]: t.orderStatusPaid,
      [OrderStatus.PREPARING]: t.orderStatusPreparing,
      [OrderStatus.READY]: t.orderStatusReady,
      [OrderStatus.OUT_FOR_DELIVERY]: t.orderStatusOutForDelivery,
      [OrderStatus.DELIVERED]: t.orderStatusDelivered,
      [OrderStatus.CANCELED]: t.orderStatusCanceled,
    };
    return statusMap[status] || status;
  };
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
        <option value="all">{language === 'sk' ? 'Všetky stavy' : 'All Statuses'}</option>
        <option value={OrderStatus.PENDING}>{getStatusLabel(OrderStatus.PENDING)}</option>
        <option value={OrderStatus.PAID}>{getStatusLabel(OrderStatus.PAID)}</option>
        <option value={OrderStatus.PREPARING}>{getStatusLabel(OrderStatus.PREPARING)}</option>
        <option value={OrderStatus.READY}>{getStatusLabel(OrderStatus.READY)}</option>
        <option value={OrderStatus.OUT_FOR_DELIVERY}>{getStatusLabel(OrderStatus.OUT_FOR_DELIVERY)}</option>
        <option value={OrderStatus.DELIVERED}>{getStatusLabel(OrderStatus.DELIVERED)}</option>
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





















