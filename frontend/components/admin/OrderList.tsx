'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { getTenantSlug } from '@/lib/tenant-utils';
import { isSoundNotificationEnabled } from './SoundNotificationSettings';

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    // Determine which tenants to fetch based on current filter
    const tenantsToFetch = filters.tenantSlug === 'all' 
      ? ['pornopizza', 'pizzavnudzi', 'partypizza']
      : [filters.tenantSlug];
    
    const mapping: Record<string, string> = {};
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    for (const tenantSlug of tenantsToFetch) {
      try {
        const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}`, { headers });
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // If no token, redirect to login immediately
    if (!token) {
      console.log('No auth token found, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
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
        ? ['pornopizza', 'pizzavnudzi', 'partypizza']
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
        
        // Debug: log request details
        console.log('[OrderList] Fetching orders:', {
          url: `${API_URL}/api/orders?${params}`,
          hasToken: !!token,
          tokenLength: token?.length,
          headers: Object.keys(headers),
        });
        
        const res = await fetch(
          `${API_URL}/api/orders?${params}`,
          { headers }
        );
        
        console.log('[OrderList] Response:', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });
        
        if (res.ok) {
          const tenantOrders = await res.json();
          allOrders.push(...tenantOrders);
        } else if (res.status === 401) {
          // Unauthorized - token might be expired or invalid
          const errorText = await res.text().catch(() => '');
          console.error('[OrderList] 401 Unauthorized:', errorText);
          // Don't redirect here - let the page-level auth check handle it
          // Just skip this tenant's orders
          continue;
        } else if (res.status === 401) {
          // Unauthorized - redirect to login
          console.error('Unauthorized - redirecting to login');
          window.location.href = '/login';
          return;
        } else {
          console.error(`Failed to fetch orders for ${tenant}:`, res.status, await res.text());
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
            // Prehraj zvuk len ak sú zvukové upozornenia zapnuté
            if (isSoundNotificationEnabled()) {
              playNewOrderSound();
            }
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      // Build headers with Authorization
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('[OrderList] Updating order status:', {
        orderId,
        newStatus,
        hasToken: !!token,
        tokenLength: token?.length,
        url: `${API_URL}/api/orders/${orderId}/status`,
      });
      
      const res = await fetch(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: newStatus }),
        }
      );
      
      console.log('[OrderList] Status update response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });
      
      if (res.ok) {
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow text-gray-900" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900" style={{ color: '#111827' }}>Orders</h2>
        {todayOnly ? (
          <div className="mt-4 text-sm text-gray-600" style={{ color: '#4b5563' }}>
            Showing orders from today ({new Date().toLocaleDateString('sk-SK')})
          </div>
        ) : (
          <OrderFilters filters={filters} onChange={setFilters} />
        )}
      </div>
      
      {loading ? (
        <div className="p-6 text-center text-gray-600" style={{ color: '#4b5563' }}>Loading...</div>
      ) : (
        <div className="divide-y divide-gray-200">
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
              tenantSlug={tenantIdToSlug[order.tenantId] || filters.tenantSlug}
            />
          ))}
          
          {orders.length === 0 && (
            <div className="p-6 text-center text-gray-500" style={{ color: '#6b7280' }}>
              No orders found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
