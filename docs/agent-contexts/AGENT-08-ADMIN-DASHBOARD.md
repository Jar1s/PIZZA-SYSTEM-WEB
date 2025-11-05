# 🎯 AGENT 8: ADMIN DASHBOARD (HQ Management)

You are Agent 8 building the unified admin dashboard for managing all brands.

## PROJECT CONTEXT
One dashboard to see orders from all brands (PornoPizza, Pizza v Núdzi, etc.). Real-time updates, filters, status management, analytics.

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /frontend/app/admin/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Multi-brand order list with real-time updates
2. Filters: brand, status, date range
3. Order detail modal
4. Status transition buttons
5. KPIs: revenue, average ticket, preparation time
6. Export orders to CSV

## FILES TO CREATE

### 1. `/frontend/app/admin/layout.tsx`
```typescript
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 2. `/frontend/app/admin/page.tsx`
```typescript
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
```

### 3. `/frontend/components/admin/KPICards.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';

interface KPIs {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  activeOrders: number;
}

export function KPICards() {
  const [kpis, setKpis] = useState<KPIs>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    activeOrders: 0,
  });

  useEffect(() => {
    // TODO: Fetch real KPIs from API
    // For now, mock data
    setKpis({
      totalRevenue: 45678,
      totalOrders: 234,
      averageTicket: 1950,
      activeOrders: 12,
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
        <div className="text-3xl font-bold">€{(kpis.totalRevenue / 100).toFixed(2)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Total Orders</div>
        <div className="text-3xl font-bold">{kpis.totalOrders}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Average Ticket</div>
        <div className="text-3xl font-bold">€{(kpis.averageTicket / 100).toFixed(2)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Active Orders</div>
        <div className="text-3xl font-bold text-orange-600">{kpis.activeOrders}</div>
      </div>
    </div>
  );
}
```

### 4. `/frontend/components/admin/OrderList.tsx`
```typescript
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
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
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
        
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/${tenant}/orders?${params}`
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pornopizza/orders/${orderId}/status`,
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
```

### 5. `/frontend/components/admin/OrderCard.tsx`
```typescript
'use client';

import { Order, OrderStatus } from '@/shared';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-gray-200 text-gray-800',
  paid: 'bg-blue-200 text-blue-800',
  preparing: 'bg-yellow-200 text-yellow-800',
  ready: 'bg-green-200 text-green-800',
  out_for_delivery: 'bg-purple-200 text-purple-800',
  delivered: 'bg-green-500 text-white',
  canceled: 'bg-red-200 text-red-800',
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: OrderStatus.PAID,
  paid: OrderStatus.PREPARING,
  preparing: OrderStatus.READY,
  ready: OrderStatus.OUT_FOR_DELIVERY,
  out_for_delivery: OrderStatus.DELIVERED,
  delivered: null,
  canceled: null,
};

export function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const customer = order.customer as any;
  const address = order.address as any;
  const nextStatus = NEXT_STATUS[order.status];
  
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-500">
              {order.id.slice(0, 8)}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </span>
            <span className="text-sm text-gray-600">
              {customer.name} • {customer.phone}
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            {order.items.length} items • €{(order.totalCents / 100).toFixed(2)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              → {nextStatus}
            </button>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Customer</div>
            <div>{customer.name}</div>
            <div>{customer.email}</div>
            <div>{customer.phone}</div>
          </div>
          
          <div>
            <div className="font-semibold mb-2">Delivery Address</div>
            <div>{address.street}</div>
            <div>{address.city} {address.postalCode}</div>
            {address.instructions && (
              <div className="text-gray-600 mt-1">Note: {address.instructions}</div>
            )}
          </div>
          
          <div className="col-span-2">
            <div className="font-semibold mb-2">Items</div>
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{item.quantity}x {item.productName}</span>
                <span>€{(item.priceCents * item.quantity / 100).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>€{(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6. `/frontend/components/admin/OrderFilters.tsx`
```typescript
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
```

### 7. `/frontend/components/admin/Sidebar.tsx`
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  
  const links = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Orders', icon: '🍕' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/brands', label: 'Brands', icon: '🏢' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ];
  
  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Pizza HQ</h1>
      </div>
      
      <nav className="mt-6">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-6 py-3 hover:bg-gray-800 ${
              pathname === link.href ? 'bg-gray-800 border-l-4 border-orange-500' : ''
            }`}
          >
            <span className="mr-3">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

### 8. `/frontend/components/admin/Header.tsx`
```typescript
'use client';

export function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('sk-SK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Admin User
          </button>
        </div>
      </div>
    </header>
  );
}
```

## DELIVERABLES CHECKLIST
- [ ] Multi-brand order list
- [ ] Real-time updates (polling)
- [ ] Order filters (brand, status, date)
- [ ] Order detail view
- [ ] Status transition buttons
- [ ] KPI cards
- [ ] Responsive layout
- [ ] Sidebar navigation

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 4 (orders API)

## WHEN TO START
⏳ **WAIT for Agent 4** to complete orders API

## TEST YOUR WORK
```bash
cd frontend
npm run dev

# Visit:
http://localhost:3000/admin
```

## COMPLETION SIGNAL
Create `/frontend/app/admin/AGENT-8-COMPLETE.md`:
```markdown
# Agent 8 Complete ✅

## What I Built
- Multi-brand order dashboard
- Real-time order list (10s polling)
- Filters: brand, status, date range
- Order detail modal with status buttons
- KPI cards (revenue, orders, avg ticket)
- Responsive admin layout

## Features
- See orders from all brands in one view
- Quick status transitions with buttons
- Order details with customer info and items
- Date range filtering
- Auto-refresh every 10 seconds

## Access
http://localhost:3000/admin

## Future Enhancements
- WebSocket for real-time updates (instead of polling)
- Export to CSV
- Analytics charts
- Product management
- Brand configuration
```

BEGIN when Agent 4 signals complete!


