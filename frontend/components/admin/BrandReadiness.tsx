'use client';

import { useCallback, useState } from 'react';

type ReadinessStatus = 'ok' | 'warn' | 'fail';

interface ReadinessCheck {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}

interface ReadinessReport {
  tenantSlug: string;
  tenantName: string;
  overall: ReadinessStatus;
  checks: ReadinessCheck[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATUS_ICON: Record<ReadinessStatus, string> = { ok: '✅', warn: '⚠️', fail: '❌' };
const OVERALL_LABEL: Record<ReadinessStatus, string> = {
  ok: 'Pripravený',
  warn: 'Funguje s výhradami',
  fail: 'Objednávky nefungujú',
};
const OVERALL_CLASS: Record<ReadinessStatus, string> = {
  ok: 'bg-green-100 text-green-800 border-green-200',
  warn: 'bg-amber-100 text-amber-800 border-amber-200',
  fail: 'bg-red-100 text-red-800 border-red-200',
};

/** Go-live checklist for one brand, fetched on demand from the admin API. */
export function BrandReadiness({ tenantSlug }: { tenantSlug: string }) {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_URL}/api/settings/tenants/${encodeURIComponent(tenantSlug)}/readiness`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json());
    } catch (err: any) {
      setError('Kontrolu sa nepodarilo načítať. Skús to znova.');
      console.error('Readiness check failed:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !report && !loading) load();
  };

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span>Pripravenosť brandu</span>
        <span className="flex items-center gap-2">
          {report && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${OVERALL_CLASS[report.overall]}`}>
              {STATUS_ICON[report.overall]} {OVERALL_LABEL[report.overall]}
            </span>
          )}
          <span className="text-gray-400">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          {loading && <p className="text-sm text-gray-500">Kontrolujem…</p>}
          {error && (
            <p className="text-sm text-red-600">
              {error}{' '}
              <button type="button" onClick={load} className="font-semibold underline">
                Znova
              </button>
            </p>
          )}
          {report && !loading && (
            <ul className="space-y-1.5">
              {report.checks.map((check) => (
                <li key={check.key} className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true">{STATUS_ICON[check.status]}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-gray-800">{check.label}:</span>{' '}
                    <span className={check.status === 'fail' ? 'text-red-700' : check.status === 'warn' ? 'text-amber-700' : 'text-gray-600'}>
                      {check.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {report && !loading && (
            <button type="button" onClick={load} className="mt-3 text-xs font-semibold text-gray-500 underline hover:text-gray-700">
              Obnoviť kontrolu
            </button>
          )}
        </div>
      )}
    </div>
  );
}
