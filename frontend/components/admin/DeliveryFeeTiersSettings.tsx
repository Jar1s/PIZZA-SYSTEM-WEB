'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminContext } from '@/app/admin/admin-context';

interface DeliveryFeeTier {
  id: string;
  tenantId: string | null;
  minDistanceMeters: number;
  maxDistanceMeters: number;
  deliveryFeeCents: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DeliveryFeeTiersSettings() {
  const { selectedTenant } = useAdminContext();
  const router = useRouter();
  const { logout } = useAuth();
  const [tiers, setTiers] = useState<DeliveryFeeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    minDistanceMeters: 0,
    maxDistanceMeters: 3000,
    deliveryFeeCents: 425,
    isActive: true,
    priority: 0,
  });

  const handleUnauthorized = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        await handleUnauthorized();
        return;
      }
      const response = await fetch(`${API_URL}/api/delivery-fee-tiers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch tiers');
      }
      const data = await response.json();
      // Filter by selected tenant or show global (null) tiers
      const tenantSlug = selectedTenant === 'all' ? null : selectedTenant;
      const filtered = tenantSlug
        ? data.filter((t: DeliveryFeeTier) => t.tenantId === tenantSlug || t.tenantId === null)
        : data.filter((t: DeliveryFeeTier) => t.tenantId === null);
      setTiers(filtered);
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        await handleUnauthorized();
        return;
      }
      const url = editingId
        ? `${API_URL}/api/delivery-fee-tiers/${editingId}`
        : `${API_URL}/api/delivery-fee-tiers`;
      
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId
        ? formData
        : { ...formData, tenantId: selectedTenant === 'all' ? null : selectedTenant };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      if (response.ok) {
        await fetchTiers();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({
          minDistanceMeters: 0,
          maxDistanceMeters: 3000,
          deliveryFeeCents: 425,
          isActive: true,
          priority: 0,
        });
      }
    } catch (error) {
      console.error('Failed to save tier:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        await handleUnauthorized();
        return;
      }
      const response = await fetch(`${API_URL}/api/delivery-fee-tiers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      if (response.ok) {
        await fetchTiers();
      }
    } catch (error) {
      console.error('Failed to delete tier:', error);
    }
  };

  const handleEdit = (tier: DeliveryFeeTier) => {
    setEditingId(tier.id);
    setFormData({
      minDistanceMeters: tier.minDistanceMeters,
      maxDistanceMeters: tier.maxDistanceMeters,
      deliveryFeeCents: tier.deliveryFeeCents,
      isActive: tier.isActive,
      priority: tier.priority,
    });
    setShowAddForm(true);
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Delivery Fee Tiers</h2>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setFormData({
              minDistanceMeters: 0,
              maxDistanceMeters: 3000,
              deliveryFeeCents: 425,
              isActive: true,
              priority: 0,
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Tier
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">{editingId ? 'Edit' : 'Add'} Tier</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min Distance (m)</label>
              <input
                type="number"
                value={formData.minDistanceMeters}
                onChange={(e) => setFormData({ ...formData, minDistanceMeters: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Distance (m)</label>
              <input
                type="number"
                value={formData.maxDistanceMeters}
                onChange={(e) => setFormData({ ...formData, maxDistanceMeters: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fee (cents)</label>
              <input
                type="number"
                value={formData.deliveryFeeCents}
                onChange={(e) => setFormData({ ...formData, deliveryFeeCents: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Distance Range</th>
              <th className="border p-2 text-left">Fee (€)</th>
              <th className="border p-2 text-left">Priority</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Scope</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id}>
                <td className="border p-2">
                  {tier.minDistanceMeters}m - {tier.maxDistanceMeters}m
                </td>
                <td className="border p-2">{(tier.deliveryFeeCents / 100).toFixed(2)}</td>
                <td className="border p-2">{tier.priority}</td>
                <td className="border p-2">
                  {tier.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </td>
                <td className="border p-2">
                  {tier.tenantId ? 'Tenant-specific' : 'Global'}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(tier)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tier.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
