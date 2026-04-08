'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { cloneTenant } from '@/lib/api';

interface CloneBrandModalProps {
  sourceTenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const toCloneSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function CloneBrandModal({
  sourceTenant,
  isOpen,
  onClose,
  onSuccess,
}: CloneBrandModalProps) {
  const sourceTheme = useMemo(
    () => ((sourceTenant?.theme && typeof sourceTenant.theme === 'object' ? sourceTenant.theme : {}) as Record<string, any>),
    [sourceTenant],
  );

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [domain, setDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#E91E63');
  const [secondaryColor, setSecondaryColor] = useState('#0F141A');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceTenant || !isOpen) return;

    const baseName = `${sourceTenant.name} Clone`;
    const generatedSlug = toCloneSlug(baseName);

    setName(baseName);
    setSlug(generatedSlug);
    setSubdomain(generatedSlug);
    setDomain('');
    setPrimaryColor(typeof sourceTheme.primaryColor === 'string' ? sourceTheme.primaryColor : '#E91E63');
    setSecondaryColor(typeof sourceTheme.secondaryColor === 'string' ? sourceTheme.secondaryColor : '#0F141A');
    setLogoUrl(typeof sourceTheme.logo === 'string' ? sourceTheme.logo : '');
    setError(null);
  }, [isOpen, sourceTenant, sourceTheme]);

  if (!isOpen || !sourceTenant) return null;

  const handleNameChange = (value: string) => {
    setName(value);
    const generatedSlug = toCloneSlug(value);
    setSlug(generatedSlug);
    setSubdomain(generatedSlug);
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setSubdomain('');
    setDomain('');
    setPrimaryColor('#E91E63');
    setSecondaryColor('#0F141A');
    setLogoUrl('');
    setLoading(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTenant) return;

    setLoading(true);
    setError(null);

    try {
      await cloneTenant(sourceTenant.slug, {
        name: name.trim(),
        slug: slug.trim(),
        subdomain: subdomain.trim(),
        domain: domain.trim() || undefined,
        theme: {
          primaryColor: primaryColor.trim() || undefined,
          secondaryColor: secondaryColor.trim() || undefined,
          logo: logoUrl.trim() || undefined,
        },
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to clone brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Clone Brand</h3>
                  <p className="mt-1 text-sm text-gray-500">Source: {sourceTenant.name}</p>
                </div>
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
                Clone vytvorí nový brand record a zdedí prevádzkové nastavenia zo source brandu.
                Storyous, Wolt, platby, email a delivery setup sa potom dolaďujú v <strong>/admin/settings</strong>.
              </div>

              <div className="grid max-h-[70vh] gap-6 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(toCloneSlug(e.target.value))}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Subdomain <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(toCloneSlug(e.target.value))}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Custom Domain</label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="brand.example.com"
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Brand identity override</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Ak nič nemeníš, clone si zoberie pôvodnú vizuálnu identitu zo source brandu.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-12 rounded border border-gray-200"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-12 rounded border border-gray-200"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

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
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? 'Cloning...' : 'Clone Brand'}
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
