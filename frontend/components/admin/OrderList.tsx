'use client';

import { useEffect, useState } from 'react';
import { Order, OrderStatus } from '@/shared';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    tenantSlug: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    // Poll for updates every 5 seconds (faster refresh for development)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch from all tenants
      const tenants = ['pornopizza', 'pizzavnudzi'];
      const allOrders: Order[] = [];
      
      for (const tenant of tenants) {
        const params = new URLSearchParams();
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(
          `${API_URL}/api/${tenant}/orders?${params}`
        );
        
        if (res.ok) {
          const tenantOrders = await res.json();
          allOrders.push(...tenantOrders);
        }
      }
      
      // Sort by date, newest first
      allOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Find which tenant this order belongs to
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      // TODO: Need tenant slug from order - update API to include it
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(
        `${API_URL}/api/pornopizza/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      
      if (res.ok) {
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">Orders</h2>
        <OrderFilters filters={filters} onChange={setFilters} />
      </div>
      
      {loading ? (
        <div className="p-6 text-center">Loading...</div>
      ) : (
        <div className="divide-y">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
          
          {orders.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No orders found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

