'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  ordersByDay: Array<{
    date: string;
    orders: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for now - in production this would fetch from API
      const mockData: AnalyticsData = {
        totalRevenue: 45678,
        totalOrders: 234,
        averageOrderValue: 1952,
        topProducts: [
          { name: 'Margherita', sales: 45, revenue: 35550 },
          { name: 'Pepperoni', sales: 38, revenue: 33820 },
          { name: 'Quattro Formaggi', sales: 32, revenue: 34880 },
          { name: 'Prosciutto', sales: 28, revenue: 27720 },
          { name: 'Diavola', sales: 24, revenue: 22800 },
        ],
        ordersByDay: [
          { date: '2025-10-30', orders: 12 },
          { date: '2025-10-31', orders: 15 },
          { date: '2025-11-01', orders: 18 },
          { date: '2025-11-02', orders: 14 },
          { date: '2025-11-03', orders: 20 },
          { date: '2025-11-04', orders: 16 },
          { date: '2025-11-05', orders: 22 },
        ],
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-gray-500">No data available</div>;
  }

  return (
    // <ProtectedRoute requiredRole="ADMIN"> // Disabled for development
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              timeRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              timeRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              timeRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-green-600">
            €{(analytics.totalRevenue / 100).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">↑ 12% from last period</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600">
            {analytics.totalOrders}
          </div>
          <div className="text-sm text-gray-500 mt-1">↑ 8% from last period</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Average Order Value</div>
          <div className="text-3xl font-bold text-purple-600">
            €{(analytics.averageOrderValue / 100).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">↑ 5% from last period</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Products</h2>
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.sales} sales</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">€{(product.revenue / 100).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Day */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Orders by Day</h2>
          <div className="space-y-3">
            {analytics.ordersByDay.map((day) => {
              const maxOrders = Math.max(...analytics.ordersByDay.map(d => d.orders));
              const percentage = (day.orders / maxOrders) * 100;
              
              return (
                <div key={day.date}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="font-semibold">{day.orders} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="font-bold text-yellow-900">Analytics in Development</h3>
            <p className="text-sm text-yellow-700">
              More detailed analytics and charts coming soon. Currently showing mock data for demonstration.
            </p>
          </div>
        </div>
      </div>
      </div>
    // </ProtectedRoute> // Disabled for development
  );
}

