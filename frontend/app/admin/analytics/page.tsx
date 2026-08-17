'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useAdminContext } from '@/app/admin/admin-context';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Heatmap } from '@/components/admin/analytics/Heatmap';
import { Sparkline } from '@/components/admin/analytics/Sparkline';
import {
  duration,
  longDate,
  money,
  num,
  pct,
  signedPct,
  time,
  toDateInputValue,
} from '@/components/admin/analytics/format';
import {
  EMPTY_TIMING,
  PAYMENT_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type AnalyticsData,
  type PaymentMethod,
  type PeriodSelection,
} from '@/components/admin/analytics/types';
import type { TrendMetric } from '@/components/admin/analytics/AnalyticsCharts';

const TrendChart = dynamic(() => import('@/components/admin/analytics/AnalyticsCharts').then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <div className="h-[240px] animate-pulse rounded-xl bg-zinc-100" />,
});
const PaymentsDonut = dynamic(() => import('@/components/admin/analytics/AnalyticsCharts').then((m) => m.PaymentsDonut), {
  ssr: false,
  loading: () => <div className="h-[120px] animate-pulse rounded-xl bg-zinc-100" />,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function periodQuery(period: PeriodSelection): string {
  if (period.mode === 'custom') {
    return `from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(period.to)}`;
  }
  return `days=${period.days}`;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AnalyticsPage() {
  const { selectedTenant: contextTenant } = useAdminContext();
  const selectedTenant: 'all' | string = contextTenant || 'all';

  const [period, setPeriod] = useState<PeriodSelection>({ mode: 'days', days: 30 });
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(new Date(Date.now() - 29 * 86400000)));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(new Date()));
  const [customOpen, setCustomOpen] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('revenue');
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${API_URL}/api/analytics/${selectedTenant === 'all' ? 'all' : encodeURIComponent(selectedTenant)}?${periodQuery(period)}`;
      const res = await fetch(endpoint, { headers: authHeaders() });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as AnalyticsData;
      if (!data?.period || !data?.payments || !data?.heatmap) {
        // Old backend still deployed – the new dashboard needs the extended payload.
        throw new Error('API vracia starý formát – nasaď najnovšiu verziu backendu.');
      }
      setAnalytics({ ...data, timingMetrics: { ...EMPTY_TIMING, ...(data.timingMetrics || {}) } });
      setUpdatedAt(new Date());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      const message = err instanceof Error && err.message.startsWith('API vracia') ? err.message : 'Analytiku sa nepodarilo načítať. Skús to znova.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    const from = customFrom <= customTo ? customFrom : customTo;
    const to = customFrom <= customTo ? customTo : customFrom;
    setPeriod({ mode: 'custom', from, to });
    setCustomOpen(false);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const endpoint = `${API_URL}/api/analytics/${selectedTenant === 'all' ? 'all' : encodeURIComponent(selectedTenant)}/export?${periodQuery(period)}`;
      const res = await fetch(endpoint, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] || `objednavky_${selectedTenant}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      setError('Export CSV zlyhal. Skús to znova.');
    } finally {
      setExporting(false);
    }
  };

  const revenueSeries = useMemo(() => analytics?.ordersByDay.map((d) => d.revenue) || [], [analytics]);
  const ordersSeries = useMemo(() => analytics?.ordersByDay.map((d) => d.orders) || [], [analytics]);
  const aovSeries = useMemo(
    () => analytics?.ordersByDay.map((d) => (d.orders > 0 ? Math.round(d.revenue / d.orders) : 0)) || [],
    [analytics],
  );

  const periodLabel = useMemo(() => {
    if (!analytics) return '';
    const start = longDate(analytics.period.start);
    const end = longDate(analytics.period.end);
    return start === end ? start : `${start} – ${end}`;
  }, [analytics]);

  const isEmpty = !!analytics && analytics.totalOrders === 0 && analytics.canceled.count === 0 && analytics.unpaid.count === 0;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="text-zinc-950">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Prehľad predaja</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Analytika</h1>
            {periodLabel && (
              <p className="mt-1 text-sm text-zinc-500">
                {periodLabel}
                {updatedAt && <span className="text-zinc-400"> · aktualizované {time(updatedAt)}</span>}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-zinc-200 bg-white p-1">
              {([7, 30, 90] as const).map((d) => {
                const active = period.mode === 'days' && period.days === d;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setPeriod({ mode: 'days', days: d });
                      setCustomOpen(false);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                      active ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {d} dní
                  </button>
                );
              })}
              <button
                onClick={() => setCustomOpen((v) => !v)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                  period.mode === 'custom' ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Vlastné
              </button>
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-50"
              title="Znova načítať"
            >
              {loading ? 'Načítavam…' : 'Obnoviť'}
            </button>
            <button
              onClick={exportCsv}
              disabled={exporting || !analytics}
              className="rounded-full bg-zinc-950 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {exporting ? 'Exportujem…' : 'Export CSV'}
            </button>
          </div>
        </div>

        {customOpen && (
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Od
              <input
                type="date"
                value={customFrom}
                max={toDateInputValue(new Date())}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 block rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium normal-case tracking-normal text-zinc-900"
              />
            </label>
            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Do
              <input
                type="date"
                value={customTo}
                max={toDateInputValue(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 block rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium normal-case tracking-normal text-zinc-900"
              />
            </label>
            <button
              onClick={applyCustomRange}
              className="rounded-full bg-zinc-950 px-4 py-2 text-[13px] font-bold text-white hover:bg-zinc-800"
            >
              Použiť
            </button>
            <span className="text-xs text-zinc-500">Max. 366 dní, čas Europe/Bratislava.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button onClick={fetchAnalytics} className="font-bold underline">
              Skúsiť znova
            </button>
          </div>
        )}

        {!analytics && loading && <SkeletonPage />}

        {analytics && (
          <div className={`space-y-4 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
            {/* KPI row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Tržby"
                value={money(analytics.totalRevenue)}
                change={analytics.revenueChange}
                changeSuffix={analytics.previous.totalOrders > 0 ? `vs. ${money(analytics.previous.totalRevenue)}` : undefined}
                series={revenueSeries}
              />
              <KpiCard
                label="Objednávky"
                value={num(analytics.totalOrders)}
                change={analytics.ordersChange}
                changeSuffix={analytics.previous.totalOrders > 0 ? `vs. ${num(analytics.previous.totalOrders)}` : undefined}
                series={ordersSeries}
              />
              <KpiCard
                label="Priemerný košík"
                value={money(analytics.averageOrderValue)}
                change={analytics.avgOrderValueChange}
                changeSuffix={analytics.previous.totalOrders > 0 ? `vs. ${money(analytics.previous.averageOrderValue)}` : undefined}
                series={aovSeries}
              />
              <Panel className="flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Stornované</p>
                  <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">
                    {num(analytics.canceled.count)}
                    {analytics.canceled.count > 0 && (
                      <span className="ml-1.5 text-sm font-bold text-zinc-500">({pct(analytics.canceled.rate, 1)})</span>
                    )}
                  </p>
                </div>
                <div className="mt-2 space-y-0.5 text-[12px] text-zinc-600">
                  <p className={analytics.refunds.count > 0 ? 'text-red-700' : ''}>
                    Refundy: {num(analytics.refunds.count)}
                    {analytics.refunds.amountCents > 0 && ` · ${money(analytics.refunds.amountCents)}`}
                    {analytics.refunds.pendingCount > 0 && ` · ${analytics.refunds.pendingCount} čaká`}
                    {analytics.refunds.failedCount > 0 && ` · ${analytics.refunds.failedCount} zlyhal`}
                  </p>
                  <p>
                    Nezaplatené online: {num(analytics.unpaid.count)}
                    {analytics.unpaid.count > 0 && ` · ${money(analytics.unpaid.amountCents)} mimo tržieb`}
                  </p>
                </div>
              </Panel>
            </div>

            {isEmpty && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-8 text-center text-sm text-zinc-500">
                V tomto období nie sú žiadne objednávky. Skús dlhšie obdobie alebo iný brand.
              </div>
            )}

            {/* Status strip */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.filter((s) => (analytics.ordersByStatus[s] || 0) > 0).map((s) => (
                <span
                  key={s}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    s === 'CANCELED'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : s === 'DELIVERED'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-white text-zinc-700'
                  }`}
                >
                  {STATUS_LABELS[s] || s} <span className="tabular-nums">{num(analytics.ordersByStatus[s])}</span>
                </span>
              ))}
            </div>

            {/* Trend + heatmap */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
              <Panel className="xl:col-span-3">
                <PanelHeader
                  title="Vývoj po dňoch"
                  hint="Tmavé stĺpce = piatok a sobota"
                  right={
                    <div className="flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
                      {(['revenue', 'orders'] as TrendMetric[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setTrendMetric(m)}
                          className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                            trendMetric === m ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {m === 'revenue' ? 'Tržby' : 'Objednávky'}
                        </button>
                      ))}
                    </div>
                  }
                />
                {analytics.totalOrders > 0 ? (
                  <TrendChart data={analytics.ordersByDay} metric={trendMetric} />
                ) : (
                  <EmptyNote height={240} />
                )}
              </Panel>
              <Panel className="xl:col-span-2">
                <PanelHeader title="Špičky" hint="Objednávky podľa hodiny a dňa v týždni" />
                <Heatmap data={analytics.heatmap} />
              </Panel>
            </div>

            {/* Payments · customers · areas */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Panel>
                <PanelHeader title="Platby" hint="Podiel z objednávok" />
                <PaymentsDonut payments={analytics.payments} />
                <PaymentsFootnote payments={analytics.payments} />
              </Panel>
              <Panel>
                <PanelHeader title="Zákazníci" hint="Podľa e-mailu, telefónu alebo účtu" />
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Noví" value={num(analytics.customers.newCount)} />
                  <Stat label="Vracajúci sa" value={num(analytics.customers.returningCount)} />
                  <Stat label="Opakované" value={pct(analytics.customers.repeatRate)} />
                </div>
                <p className="mt-3 text-[12px] text-zinc-500">
                  „Vracajúci sa“ = mal objednávku už pred začiatkom obdobia. Spolu {num(analytics.customers.unique)} zákazníkov.
                </p>
              </Panel>
              <Panel>
                <PanelHeader title="Kam sa vozí" hint="Top PSČ" />
                {analytics.topZips.length === 0 ? (
                  <EmptyNote height={100} />
                ) : (
                  <RankList
                    rows={analytics.topZips.map((z) => ({
                      key: z.zip,
                      label: `${z.zip}${z.city ? ` ${z.city}` : ''}`,
                      value: `${num(z.orders)} obj.`,
                      share: analytics.totalOrders > 0 ? z.orders / analytics.totalOrders : 0,
                    }))}
                  />
                )}
              </Panel>
            </div>

            {/* Products · extras · timing */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Panel>
                <PanelHeader title="Top produkty" hint="Tržby · kusy" />
                {analytics.topProducts.length === 0 ? (
                  <EmptyNote height={100} />
                ) : (
                  <RankList
                    rows={analytics.topProducts.map((p) => ({
                      key: p.productId,
                      label: p.productName,
                      value: `${money(p.revenue)} · ${num(p.sales)} ks`,
                      share: analytics.topProducts[0].revenue > 0 ? p.revenue / analytics.topProducts[0].revenue : 0,
                    }))}
                  />
                )}
              </Panel>
              <Panel>
                <PanelHeader title="Top prílohy a úpravy" hint="Platené extra a prísady navyše" />
                {analytics.topModifiers.length === 0 ? (
                  <EmptyNote height={100} />
                ) : (
                  <RankList
                    rows={analytics.topModifiers.map((m) => ({
                      key: m.id,
                      label: m.name,
                      value: `${num(m.count)}×`,
                      share: analytics.topModifiers[0].count > 0 ? m.count / analytics.topModifiers[0].count : 0,
                    }))}
                  />
                )}
              </Panel>
              <Panel>
                <PanelHeader title="Ako rýchlo" hint="Priemer · medián, bez zrušených" />
                <div className="grid grid-cols-2 gap-2">
                  <TimingStat
                    label="Prijatie"
                    avg={analytics.timingMetrics.avgConfirmSeconds}
                    median={analytics.timingMetrics.medianConfirmSeconds}
                    samples={analytics.timingMetrics.confirmSamples}
                  />
                  <TimingStat
                    label="Do kuchyne"
                    avg={analytics.timingMetrics.avgPreparingSeconds}
                    median={analytics.timingMetrics.medianPreparingSeconds}
                    samples={analytics.timingMetrics.preparingSamples}
                  />
                  <TimingStat
                    label="Doručenie (posledná míľa)"
                    avg={analytics.timingMetrics.avgLastMileSeconds}
                    median={analytics.timingMetrics.medianLastMileSeconds}
                    samples={analytics.timingMetrics.lastMileSamples}
                  />
                  <TimingStat
                    label="Celkom k zákazníkovi"
                    avg={analytics.timingMetrics.avgDeliveredSeconds}
                    median={analytics.timingMetrics.medianDeliveredSeconds}
                    samples={analytics.timingMetrics.deliveredSamples}
                    emphasis
                  />
                </div>
              </Panel>
            </div>

            {/* Brand comparison */}
            {analytics.tenants && analytics.tenants.length > 0 && (
              <Panel>
                <PanelHeader title="Porovnanie brandov" hint="Rovnaké obdobie, rovnaká definícia tržieb" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                        <th className="pb-2 pr-3 font-black">Brand</th>
                        <th className="pb-2 pr-3 text-right font-black">Tržby</th>
                        <th className="pb-2 pr-3 text-right font-black">Podiel</th>
                        <th className="pb-2 pr-3 text-right font-black">Objednávky</th>
                        <th className="pb-2 pr-3 text-right font-black">Priem. košík</th>
                        <th className="pb-2 pr-3 text-right font-black">Stornované</th>
                        <th className="pb-2 text-right font-black">Nezaplatené</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.tenants.map((t) => {
                        const share = analytics.totalRevenue > 0 ? (t.totalRevenue / analytics.totalRevenue) * 100 : 0;
                        return (
                          <tr key={t.tenantId} className="border-t border-zinc-100">
                            <td className="py-2 pr-3 font-bold">{t.name}</td>
                            <td className="py-2 pr-3 text-right font-bold tabular-nums">{money(t.totalRevenue)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums text-zinc-600">
                              <span className="inline-flex items-center gap-2">
                                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                                  <span className="block h-full rounded-full bg-zinc-950" style={{ width: `${Math.min(share, 100)}%` }} />
                                </span>
                                {pct(share)}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums">{num(t.totalOrders)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{money(t.averageOrderValue)}</td>
                            <td className={`py-2 pr-3 text-right tabular-nums ${t.canceledCount > 0 ? 'text-red-700' : 'text-zinc-500'}`}>
                              {num(t.canceledCount)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-zinc-500">{num(t.unpaidCount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            <p className="pt-2 text-[12px] text-zinc-500">
              Tržby = všetky objednávky okrem zrušených a nezaplatených online objednávok. Dobierky sa počítajú od prijatia.
              Refundy sú zobrazené osobitne. Časy sú v pásme Europe/Bratislava.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 ${className}`}>{children}</div>;
}

function PanelHeader({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-black tracking-tight text-zinc-950">{title}</h2>
        {hint && <p className="text-[12px] text-zinc-500">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  changeSuffix,
  series,
}: {
  label: string;
  value: string;
  change: number | null;
  changeSuffix?: string;
  series: number[];
}) {
  const tone = change === null ? 'text-zinc-400' : change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-700' : 'text-zinc-500';
  return (
    <Panel>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">{value}</p>
      <p className={`mt-0.5 text-[12px] font-semibold tabular-nums ${tone}`}>
        {change === null ? 'bez porovnania' : `${signedPct(change)} vs. predch. obdobie`}
        {changeSuffix && change !== null && <span className="font-normal text-zinc-400"> ({changeSuffix})</span>}
      </p>
      <Sparkline values={series} className="mt-2 h-7 w-full" />
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-2.5 py-2 text-center">
      <p className="text-lg font-black tabular-nums tracking-tight">{value}</p>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
    </div>
  );
}

function TimingStat({
  label,
  avg,
  median,
  samples,
  emphasis = false,
}: {
  label: string;
  avg: number;
  median: number;
  samples: number;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-xl px-2.5 py-2 ${emphasis ? 'bg-zinc-950 text-white' : 'bg-zinc-50'}`}>
      <p className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${emphasis ? 'text-zinc-300' : 'text-zinc-500'}`}>{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums tracking-tight">{samples > 0 ? duration(avg) : '–'}</p>
      <p className={`text-[11px] tabular-nums ${emphasis ? 'text-zinc-300' : 'text-zinc-500'}`}>
        {samples > 0 ? `medián ${duration(median)} · ${num(samples)} obj.` : 'zatiaľ bez dát'}
      </p>
    </div>
  );
}

function RankList({ rows }: { rows: Array<{ key: string; label: string; value: string; share: number }> }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-semibold text-zinc-800" title={r.label}>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums text-zinc-600">{r.value}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-zinc-950" style={{ width: `${Math.max(2, Math.min(100, r.share * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PaymentsFootnote({ payments }: { payments: Record<PaymentMethod, { count: number; revenue: number }> }) {
  const parts = (Object.keys(PAYMENT_LABELS) as PaymentMethod[])
    .filter((k) => (payments[k]?.count || 0) > 0)
    .map((k) => `${PAYMENT_LABELS[k].toLowerCase()} ${money(payments[k].revenue)}`);
  if (parts.length === 0) return null;
  return <p className="mt-3 text-[12px] text-zinc-500">Tržby: {parts.join(' · ')}</p>;
}

function EmptyNote({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-zinc-500" style={{ height }}>
      Žiadne objednávky v tomto období.
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 xl:col-span-3" />
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 xl:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
