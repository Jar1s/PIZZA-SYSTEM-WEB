'use client';

import { useEffect, useState } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { updateTenant } from '@/lib/api';

interface EditBrandModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditBrandModal({ tenant, isOpen, onClose, onUpdate }: EditBrandModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    domain: '',
    isActive: true,
  });
  const [themeColors, setThemeColors] = useState({
    primaryColor: '#E91E63',
    secondaryColor: '#0F141A',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) return;

    const theme = typeof tenant.theme === 'object' && tenant.theme !== null ? (tenant.theme as any) : {};

    setFormData({
      name: tenant.name || '',
      subdomain: tenant.subdomain || tenant.slug || '',
      domain: tenant.domain || '',
      isActive: tenant.isActive !== undefined ? tenant.isActive : true,
    });
    setThemeColors({
      primaryColor: theme.primaryColor || '#E91E63',
      secondaryColor: theme.secondaryColor || '#0F141A',
    });
    setLogoUrl(theme.logo || '');
    setFaviconUrl(theme.favicon || '');
    setError(null);
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const existingTheme = (tenant.theme as any) || {};
      const updatedTheme: any = {
        ...existingTheme,
        primaryColor: themeColors.primaryColor.trim() || existingTheme.primaryColor,
        secondaryColor: themeColors.secondaryColor.trim() || existingTheme.secondaryColor,
        logo: logoUrl.trim() || undefined,
        favicon: faviconUrl.trim() || existingTheme.favicon || '/favicon.ico',
      };

      if (!updatedTheme.logo) delete updatedTheme.logo;

      await updateTenant(tenant.subdomain || tenant.slug, {
        name: formData.name.trim() || tenant.name,
        domain: formData.domain.trim() || null,
        isActive: formData.isActive,
        theme: updatedTheme,
      });

      alert('Brand identity bola uložená. Prevádzkové settings patria do Settings.');
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('[EditBrandModal] Failed to update brand:', err);
      setError(err?.message || 'Nepodarilo sa uložiť brand nastavenia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Edit Brand</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Prevádzkové settings ako Storyous, Wolt, platby, otváracie hodiny a delivery fee tiers sú presunuté do <strong>/admin/settings</strong>.
                Tento modal rieši už len brand inventory a identitu.
              </div>

              <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] max-h-[72vh] overflow-y-auto pr-1">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Brand Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Subdomain</label>
                    <div className="font-medium text-gray-900">{formData.subdomain}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Custom Domain</label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="brand.example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                    <label className="flex items-center gap-3 text-sm text-gray-900">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      />
                      Active brand
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Theme Colors</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeColors.primaryColor}
                          onChange={(e) => setThemeColors((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="h-10 w-12 rounded border border-gray-200"
                        />
                        <input
                          type="text"
                          value={themeColors.primaryColor}
                          onChange={(e) => setThemeColors((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeColors.secondaryColor}
                          onChange={(e) => setThemeColors((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                          className="h-10 w-12 rounded border border-gray-200"
                        />
                        <input
                          type="text"
                          value={themeColors.secondaryColor}
                          onChange={(e) => setThemeColors((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Logo URL</label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Favicon URL</label>
                      <input
                        type="text"
                        value={faviconUrl}
                        onChange={(e) => setFaviconUrl(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="/favicon.ico"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? 'Saving...' : 'Save Brand'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
