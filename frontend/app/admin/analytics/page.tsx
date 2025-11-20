'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAdminContext } from '@/app/admin/admin-context';

// Lazy load recharts for code splitting (large library)
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

// import { ProtectedRoute } from '@/components/admin/ProtectedRoute'; // Disabled for development

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  avgOrderValueChange: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
    revenue: number;
  }>;
  ordersByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Record<string, number>;
}

// Color mapping for order statuses - vibrant and meaningful colors
// Handle both underscore and space variations
const STATUS_COLORS: Record<string, string> = {
  'PENDING': '#F59E0B',           // Amber/Orange - waiting
  'PAID': '#3B82F6',              // Blue - payment confirmed
  'PREPARING': '#F97316',         // Bright Orange - in progress
  'READY': '#10B981',             // Green - ready
  'OUT_FOR_DELIVERY': '#A855F7', // Vibrant Purple - on the way
  'OUT FOR DELIVERY': '#A855F7',  // Handle space in name
  'OUT FOR_DELIVERY': '#A855F7', // Handle mixed format
  'DELIVERED': '#059669',         // Dark green - completed
  'CANCELED': '#DC2626',          // Bright Red - cancelled
};

// Fallback colors for other data
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function AnalyticsPage() {
  const { selectedTenant: contextTenant } = useAdminContext();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [selectedTenant, setSelectedTenant] = useState<'all' | 'pornopizza' | 'pizzavnudzi'>(contextTenant === 'all' ? 'all' : contextTenant as 'pornopizza' | 'pizzavnudzi');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const days = timeRange;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Fetch analytics based on selected tenant
      const endpoint = selectedTenant === 'all' 
        ? `${API_URL}/api/analytics/all?days=${days}`
        : `${API_URL}/api/analytics/${selectedTenant}?days=${days}`;
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        const errorText = await res.text();
        console.error('Failed to fetch analytics:', res.status, errorText);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedTenant]);

  // Update selectedTenant when context changes
  useEffect(() => {
    const newTenant = contextTenant === 'all' ? 'all' : contextTenant as 'pornopizza' | 'pizzavnudzi';
    if (newTenant !== selectedTenant) {
      setSelectedTenant(newTenant);
    }
  }, [contextTenant, selectedTenant]);

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No analytics data available</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = analytics.ordersByDay.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: day.revenue / 100,
    orders: day.orders,
  }));

  const ordersChartData = analytics.ordersByDay.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    orders: day.orders,
  }));

  const topProductsChartData = analytics.topProducts.map(product => ({
    name: product.productName.length > 15 ? product.productName.substring(0, 15) + '...' : product.productName,
    revenue: product.revenue / 100,
    sales: product.sales,
  }));

  const statusChartData = Object.entries(analytics.ordersByStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count], index) => {
      const displayName = status.replace(/_/g, ' '); // Replace all underscores
      // Normalize status key for lookup
      const normalizedStatus = status.toUpperCase().trim();
      // Try to find color - check exact match first, then variations
      let color = STATUS_COLORS[normalizedStatus] || 
                  STATUS_COLORS[status] || 
                  STATUS_COLORS[displayName.toUpperCase()] || 
                  STATUS_COLORS[displayName] || 
                  COLORS[index % COLORS.length]; // Use different color for each if not found
      
      return {
        name: displayName,
        value: count,
        color: color,
      };
    });

  return (
    // <ProtectedRoute requiredRole="ADMIN"> // Disabled for development
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        
        {/* Filters */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Tenant Filter */}
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value as 'all' | 'pornopizza' | 'pizzavnudzi')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Brands</option>
            <option value="pornopizza">PornoPizza</option>
            <option value="pizzavnudzi">Pizza v Núdzi</option>
          </select>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              timeRange === '7'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              timeRange === '30'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('90')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              timeRange === '90'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 90 Days
          </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-green-600">
            €{(analytics.totalRevenue / 100).toFixed(2)}
          </div>
          <div className={`text-sm mt-1 ${analytics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics.revenueChange >= 0 ? '↗' : '↘'} {analytics.revenueChange > 0 ? '+' : ''}{analytics.revenueChange}% from last period
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600">{analytics.totalOrders}</div>
          <div className={`text-sm mt-1 ${analytics.ordersChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {analytics.ordersChange >= 0 ? '↗' : '↘'} {analytics.ordersChange > 0 ? '+' : ''}{analytics.ordersChange}% from last period
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Average Order Value</div>
          <div className="text-3xl font-bold text-purple-600">
            €{(analytics.averageOrderValue / 100).toFixed(2)}
          </div>
          <div className={`text-sm mt-1 ${analytics.avgOrderValueChange >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            {analytics.avgOrderValueChange >= 0 ? '↗' : '↘'} {analytics.avgOrderValueChange > 0 ? '+' : ''}{analytics.avgOrderValueChange}% from last period
          </div>
        </div>
      </div>

      {/* Charts Row 1: Revenue & Orders Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `€${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Revenue (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No revenue data available</p>
            </div>
          )}
        </div>

        {/* Orders Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Orders Trend</h2>
          {ordersChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No orders data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Products & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Products by Revenue</h2>
          {topProductsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: any) => `€${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue (€)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No product data available</p>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Orders by Status</h2>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry: any, index: number) => {
                    const fillColor = entry.color || COLORS[index % COLORS.length];
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No status data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Orders per Day (Avg)</div>
          <div className="text-2xl font-bold text-blue-600">
            {analytics.ordersByDay.length > 0 
              ? (analytics.totalOrders / analytics.ordersByDay.length).toFixed(1)
              : '0'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Revenue per Day (Avg)</div>
          <div className="text-2xl font-bold text-green-600">
            €{analytics.ordersByDay.length > 0 
              ? ((analytics.totalRevenue / analytics.ordersByDay.length) / 100).toFixed(2)
              : '0.00'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Top Product Revenue Share</div>
          <div className="text-2xl font-bold text-purple-600">
            {analytics.topProducts.length > 0 && analytics.totalRevenue > 0
              ? ((analytics.topProducts[0].revenue / analytics.totalRevenue) * 100).toFixed(1)
              : '0'}%
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Top Products by Revenue</h2>
        {analytics.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topProducts.map((product, index) => (
                  <tr key={product.productId || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.sales} units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">€{(product.revenue / 100).toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No product data available</p>
          </div>
        )}
      </div>
    </div>
    // </ProtectedRoute> // Disabled for development
  );
}
