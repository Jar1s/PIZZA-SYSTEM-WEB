'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isWeekend, money, num, shortDate, shortDateWithWeekday } from './format';
import { PAYMENT_COLORS, PAYMENT_LABELS, type PaymentMethod } from './types';

// Recharts is imported directly here (not through next/dynamic per component):
// it inspects the type of its children, so wrapped XAxis/YAxis would silently
// stop rendering. The page loads this whole module with ssr:false instead.

export type TrendMetric = 'revenue' | 'orders';

interface TrendChartProps {
  data: Array<{ date: string; orders: number; revenue: number }>;
  metric: TrendMetric;
}

export function TrendChart({ data, metric }: TrendChartProps) {
  const rows = data.map((d) => ({
    ...d,
    value: metric === 'revenue' ? d.revenue / 100 : d.orders,
    weekend: isWeekend(d.date),
  }));
  const tickEvery = rows.length > 45 ? 7 : rows.length > 20 ? 3 : rows.length > 10 ? 2 : 1;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="#E4E4E7" strokeDasharray="2 4" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          interval={tickEvery - 1}
          tick={{ fontSize: 11, fill: '#71717A' }}
          axisLine={{ stroke: '#E4E4E7' }}
          tickLine={false}
        />
        <YAxis
          width={metric === 'revenue' ? 56 : 32}
          tick={{ fontSize: 11, fill: '#71717A' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={(v: number) => (metric === 'revenue' ? `${num(Math.round(v))} €` : num(v))}
        />
        <Tooltip
          cursor={{ fill: 'rgba(24,24,27,0.05)' }}
          contentStyle={{ borderRadius: 12, border: '1px solid #E4E4E7', boxShadow: '0 8px 24px -16px rgba(0,0,0,.3)', fontSize: 12 }}
          labelFormatter={(label: string) => shortDateWithWeekday(label)}
          formatter={(value: number, _name: string, item: any) => {
            const row = item?.payload;
            if (!row) return [String(value), ''];
            return metric === 'revenue'
              ? [`${money(row.revenue)} · ${num(row.orders)} obj.`, 'Tržby']
              : [`${num(row.orders)} obj. · ${money(row.revenue)}`, 'Objednávky'];
          }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {rows.map((row) => (
            <Cell key={row.date} fill={row.weekend ? '#18181B' : '#3B82F6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface HourlyChartProps {
  data: Array<{ hour: number; orders: number; revenue: number }>;
  metric: TrendMetric;
}

/** One-day view: revenue/orders per local hour (10:00–23:00 always shown, wider if there is data). */
export function HourlyChart({ data, metric }: HourlyChartProps) {
  let first = 10;
  let last = 22;
  data.forEach((d) => {
    if (d.orders > 0) {
      first = Math.min(first, d.hour);
      last = Math.max(last, d.hour);
    }
  });
  const rows = data
    .filter((d) => d.hour >= first && d.hour <= last)
    .map((d) => ({ ...d, label: `${d.hour}:00`, value: metric === 'revenue' ? d.revenue / 100 : d.orders }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="#E4E4E7" strokeDasharray="2 4" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={{ stroke: '#E4E4E7' }} tickLine={false} interval={rows.length > 14 ? 1 : 0} />
        <YAxis
          width={metric === 'revenue' ? 56 : 32}
          tick={{ fontSize: 11, fill: '#71717A' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={(v: number) => (metric === 'revenue' ? `${num(Math.round(v))} €` : num(v))}
        />
        <Tooltip
          cursor={{ fill: 'rgba(24,24,27,0.05)' }}
          contentStyle={{ borderRadius: 12, border: '1px solid #E4E4E7', boxShadow: '0 8px 24px -16px rgba(0,0,0,.3)', fontSize: 12 }}
          labelFormatter={(label: string) => `${label}–${label.replace(':00', '')}:59`}
          formatter={(value: number, _name: string, item: any) => {
            const row = item?.payload;
            if (!row) return [String(value), ''];
            return metric === 'revenue'
              ? [`${money(row.revenue)} · ${num(row.orders)} obj.`, 'Tržby']
              : [`${num(row.orders)} obj. · ${money(row.revenue)}`, 'Objednávky'];
          }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false} fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PaymentsDonutProps {
  payments: Record<PaymentMethod, { count: number; revenue: number }>;
}

export function PaymentsDonut({ payments }: PaymentsDonutProps) {
  const rows = (Object.keys(PAYMENT_LABELS) as PaymentMethod[])
    .map((key) => ({ key, name: PAYMENT_LABELS[key], value: payments[key]?.count || 0, revenue: payments[key]?.revenue || 0 }))
    .filter((r) => r.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (total === 0) {
    return <div className="flex h-[132px] items-center justify-center text-sm text-zinc-500">Žiadne platby v tomto období.</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-[120px] w-[120px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={38} outerRadius={56} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.key} fill={PAYMENT_COLORS[r.key]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E4E4E7', fontSize: 12 }}
              formatter={(value: number, name: string, item: any) => [
                `${num(value)} obj. (${Math.round((value / total) * 100)} %) · ${money(item?.payload?.revenue || 0)}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-[13px]">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-zinc-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: PAYMENT_COLORS[r.key] }} />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-zinc-950">{Math.round((r.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
