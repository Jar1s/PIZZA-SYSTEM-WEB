'use client';

import { useMemo } from 'react';
import { WEEKDAYS_SHORT, num } from './format';

interface HeatmapProps {
  /** [weekday 0=Mon..6][hour 0..23] */
  data: number[][];
}

const ALWAYS_FROM = 10;
const ALWAYS_TO = 22;

export function Heatmap({ data }: HeatmapProps) {
  const { hours, max, total } = useMemo(() => {
    let first = ALWAYS_FROM;
    let last = ALWAYS_TO;
    let maxValue = 0;
    let sum = 0;
    data.forEach((row) =>
      row.forEach((value, hour) => {
        if (value > 0) {
          first = Math.min(first, hour);
          last = Math.max(last, hour);
          sum += value;
        }
        maxValue = Math.max(maxValue, value);
      }),
    );
    const list: number[] = [];
    for (let h = first; h <= last; h += 1) list.push(h);
    return { hours: list, max: maxValue, total: sum };
  }, [data]);

  if (total === 0) {
    return <div className="flex h-[168px] items-center justify-center text-sm text-zinc-500">Žiadne objednávky v tomto období.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] gap-[3px] text-[10px] text-zinc-500"
        style={{ gridTemplateColumns: `28px repeat(${hours.length}, minmax(0, 1fr))` }}
      >
        {data.map((row, weekday) => (
          <FragmentRow key={weekday} label={WEEKDAYS_SHORT[weekday]} row={row} hours={hours} max={max} />
        ))}
        <span />
        {hours.map((h) => (
          <span key={h} className="text-center tabular-nums">
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ label, row, hours, max }: { label: string; row: number[]; hours: number[]; max: number }) {
  return (
    <>
      <span className="self-center font-semibold text-zinc-600">{label}</span>
      {hours.map((h) => {
        const value = row[h] || 0;
        const intensity = max > 0 ? value / max : 0;
        return (
          <span
            key={h}
            title={`${label} ${h}:00–${h + 1}:00 · ${num(value)} obj.`}
            className="block h-[18px] rounded-[3px] bg-zinc-950"
            style={{ opacity: value === 0 ? 0.04 : 0.15 + intensity * 0.85 }}
          />
        );
      })}
    </>
  );
}
