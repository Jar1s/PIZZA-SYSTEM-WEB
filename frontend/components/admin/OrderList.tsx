'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { getTenantSlug } from '@/lib/tenant-utils';

interface OrderListProps {
  todayOnly?: boolean;
  selectedTenant?: 'all' | string;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Funkcia na prehratie zvuku pri novej objednávke
const playNewOrderSound = () => {
  try {
    // Vytvor jednoduchý beep zvuk pomocou Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Nastav frekvenciu a typ zvuku (800Hz - príjemný beep)
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    // Nastav hlasitosť (0.3 = 30%)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Prehraj zvuk (300ms)
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};

export function OrderList({ todayOnly = false, selectedTenant }: OrderListProps = {}) {
  // Get current tenant as default
  const currentTenant = selectedTenant || getTenantSlug();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    tenantSlug: currentTenant,
    status: 'all',
    startDate: todayOnly ? getTodayDate() : '',
    endDate: todayOnly ? getTodayDate() : '',
  });
  const [loading, setLoading] = useState(true);
  const [tenantIdToSlug, setTenantIdToSlug] = useState<Record<string, string>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  
  // Ref na uloženie predchádzajúcich order IDs pre detekciu nových objednávok
  const previousOrderIds = useRef<Set<string>>(new Set());

  // Cache tenant ID to slug mapping
  const fetchTenantMapping = useCallback(async () => {
    // Determine which tenants to fetch based on current filter
    const tenantsToFetch = filters.tenantSlug === 'all' 
      ? ['pornopizza', 'pizzavnudzi']
      : [filters.tenantSlug];
    
    const mapping: Record<string, string> = {};
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    for (const tenantSlug of tenantsToFetch) {
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
  }, [filters.tenantSlug]);

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
        params.set('tenantSlug', tenant);
        const res = await fetch(
          `${API_URL}/api/orders?${params}`
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
      
      // Detekcia nových objednávok (len ak to nie je prvý load)
      if (!isInitial && previousOrderIds.current.size > 0) {
        const currentOrderIds = new Set(allOrders.map(o => o.id));
        const newOrderIds = Array.from(currentOrderIds).filter(
          id => !previousOrderIds.current.has(id)
        );
        
        // Ak sú nové objednávky, prehraj zvuk
        if (newOrderIds.length > 0) {
          // Filtruj len nové objednávky s PENDING statusom (nepridávať zvuk pre staré objednávky)
          const newPendingOrders = allOrders.filter(
            o => newOrderIds.includes(o.id) && o.status === 'PENDING'
          );
          
          if (newPendingOrders.length > 0) {
            playNewOrderSound();
            console.log(`🔔 Nová objednávka! (${newPendingOrders.length} nových)`);
          }
        }
      }
      
      // Aktualizuj predchádzajúce order IDs
      previousOrderIds.current = new Set(allOrders.map(o => o.id));
      
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

  // Update filters when selectedTenant changes
  useEffect(() => {
    if (selectedTenant && selectedTenant !== filters.tenantSlug) {
      setFilters(prev => ({ ...prev, tenantSlug: selectedTenant }));
    }
  }, [selectedTenant, filters.tenantSlug]);

  // Reset initial load when filters change
  useEffect(() => {
    isInitialLoad.current = true;
    // Reset previous order IDs keď sa zmenia filtre
    previousOrderIds.current = new Set();
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
        `${API_URL}/api/orders/${orderId}/status`,
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

