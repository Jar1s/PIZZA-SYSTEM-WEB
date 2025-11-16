'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Order, OrderStatus } from '@/shared';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';

interface OrderListProps {
  todayOnly?: boolean;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function OrderList({ todayOnly = false }: OrderListProps = {}) {

  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    tenantSlug: 'all',
    status: 'all',
    startDate: todayOnly ? getTodayDate() : '',
    endDate: todayOnly ? getTodayDate() : '',
  });
  const [loading, setLoading] = useState(true);
  const [tenantIdToSlug, setTenantIdToSlug] = useState<Record<string, string>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  // Cache tenant ID to slug mapping
  const fetchTenantMapping = useCallback(async () => {
    const tenants = ['pornopizza', 'pizzavnudzi'];
    const mapping: Record<string, string> = {};
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    for (const tenantSlug of tenants) {
      try {
        const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}`);
        if (res.ok) {
          const tenantData = await res.json();
          mapping[tenantData.id] = tenantSlug;
        }
      } catch (e) {
        console.error(`Failed to fetch tenant ${tenantSlug}:`, e);
      }
    }
    
    setTenantIdToSlug(mapping);
  }, []);

  const fetchOrders = useCallback(async () => {
    // Save scroll position before update
    const scrollPosition = window.scrollY;
    const isInitial = isInitialLoad.current;
    
    try {
      // Only show loading on initial load, not on auto-refresh
      if (isInitial) {
        setLoading(true);
      }
      
      // Fetch tenant mapping if not cached
      if (Object.keys(tenantIdToSlug).length === 0) {
        await fetchTenantMapping();
      }
      
      // Determine which tenants to fetch from based on filter
      const tenantsToFetch = filters.tenantSlug === 'all' 
        ? ['pornopizza', 'pizzavnudzi']
        : [filters.tenantSlug];
      
      // If todayOnly, always use today's date
      const todayDate = getTodayDate();
      const startDate = todayOnly ? todayDate : filters.startDate;
      const endDate = todayOnly ? todayDate : filters.endDate;
      
      const allOrders: Order[] = [];
      
      for (const tenant of tenantsToFetch) {
        const params = new URLSearchParams();
        if (filters.status !== 'all') params.set('status', filters.status);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        
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
      
      // Restore scroll position after update (only if not initial load)
      if (!isInitial) {
        // Use setTimeout to ensure React has finished rendering
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto' // Instant scroll, no animation
          });
        }, 0);
      }
      
      // Mark initial load as complete
      if (isInitial) {
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [filters, tenantIdToSlug, fetchTenantMapping, todayOnly]);

  // Reset initial load when filters change
  useEffect(() => {
    isInitialLoad.current = true;
  }, [filters]);

  useEffect(() => {
    fetchOrders();
    
    // Poll for updates every 5 seconds (faster refresh for development)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Find which tenant this order belongs to
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      // Get tenant slug from cached mapping
      const orderTenantSlug = tenantIdToSlug[order.tenantId] || 'pornopizza';
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(
        `${API_URL}/api/${orderTenantSlug}/orders/${orderId}/status`,
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
        {todayOnly ? (
          <div className="mt-4 text-sm text-gray-600">
            Showing orders from today ({new Date().toLocaleDateString('sk-SK')})
          </div>
        ) : (
          <OrderFilters filters={filters} onChange={setFilters} />
        )}
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
              isExpanded={expandedOrders.has(order.id)}
              onToggleExpand={(orderId) => {
                setExpandedOrders(prev => {
                  const next = new Set(prev);
                  if (next.has(orderId)) {
                    next.delete(orderId);
                  } else {
                    next.add(orderId);
                  }
                  return next;
                });
              }}
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

