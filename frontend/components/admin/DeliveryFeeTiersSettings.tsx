'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminContext } from '@/app/admin/admin-context';
import { SettingsBadge, SettingsCard, SettingsCardHeader } from '@/components/admin/SettingsCard';

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

function normalizeTenant(slug: string | null): string | null {
  if (!slug || slug === 'all') return null;
  if (slug === 'p0rnopizza') return 'pornopizza';
  if (slug === 'pizzaparty') return 'partypizza';
  return slug;
}

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
      const tenantSlug = normalizeTenant(selectedTenant);
      const endpoint = tenantSlug
        ? `${API_URL}/api/delivery-fee-tiers?tenantSlug=${encodeURIComponent(tenantSlug)}`
        : `${API_URL}/api/delivery-fee-tiers`;

      const response = await fetch(endpoint, {
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
      setTiers(data);
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, handleUnauthorized]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleSave = async () => {
    if (!editingId) {
      // Creating new tiers is disabled
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        await handleUnauthorized();
        return;
      }
      const url = `${API_URL}/api/delivery-fee-tiers/${editingId}`;
      
      const method = 'PATCH';
      const body = formData;

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
    return <div className="animate-pulse rounded-[28px] bg-gray-200 p-10" />;
  }

  return (
    <SettingsCard className="h-full min-h-[640px]">
      <SettingsCardHeader
        eyebrow="Delivery"
        title="Delivery Fee Tiers"
        subtitle={selectedTenant && selectedTenant !== 'all' ? `Brand: ${selectedTenant}` : 'Globálne pásma a priorita poplatkov.'}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <SettingsBadge tone="neutral">{tiers.length} pásiem</SettingsBadge>
        <SettingsBadge tone="accent">Úprava existujúcich</SettingsBadge>
      </div>

      {showAddForm && editingId && (
        <div className="mt-5 rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="mb-3 text-base font-black tracking-tight text-zinc-900">Edit Tier</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Min Distance (m)</label>
              <input
                type="number"
                value={formData.minDistanceMeters}
                onChange={(e) => setFormData({ ...formData, minDistanceMeters: parseInt(e.target.value) })}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Distance (m)</label>
              <input
                type="number"
                value={formData.maxDistanceMeters}
                onChange={(e) => setFormData({ ...formData, maxDistanceMeters: parseInt(e.target.value) })}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fee (cents)</label>
              <input
                type="number"
                value={formData.deliveryFeeCents}
                onChange={(e) => setFormData({ ...formData, deliveryFeeCents: parseInt(e.target.value) })}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5"
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
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-3">
        <div className="overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-zinc-50">
              <th className="border-b border-zinc-200 px-4 py-3 text-left text-sm font-black text-zinc-700">Distance Range</th>
              <th className="border-b border-zinc-200 px-4 py-3 text-left text-sm font-black text-zinc-700">Fee (€)</th>
              <th className="border-b border-zinc-200 px-4 py-3 text-left text-sm font-black text-zinc-700">Priority</th>
              <th className="border-b border-zinc-200 px-4 py-3 text-left text-sm font-black text-zinc-700">Status</th>
              <th className="border-b border-zinc-200 px-4 py-3 text-left text-sm font-black text-zinc-700">Scope</th>
              <th className="border-b border-zinc-200 px-4 py-3 text-left text-sm font-black text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id} className="bg-white transition-colors hover:bg-zinc-50/60">
                <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-900">
                  {tier.minDistanceMeters}m - {tier.maxDistanceMeters}m
                </td>
                <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-900">{(tier.deliveryFeeCents / 100).toFixed(2)}</td>
                <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-900">{tier.priority}</td>
                <td className="border-b border-zinc-100 px-4 py-4 text-sm">
                  {tier.isActive ? (
                    <SettingsBadge tone="success">Active</SettingsBadge>
                  ) : (
                    <SettingsBadge tone="neutral">Inactive</SettingsBadge>
                  )}
                </td>
                <td className="border-b border-zinc-100 px-4 py-4 text-sm">
                  <SettingsBadge tone="neutral">{tier.tenantId ? 'Tenant-specific' : 'Global'}</SettingsBadge>
                </td>
                <td className="border-b border-zinc-100 px-4 py-4">
                  <button
                    onClick={() => handleEdit(tier)}
                    className="mr-2 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tier.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
      </div>
    </SettingsCard>
  );
}
