'use client';

import { ReactNode } from 'react';

interface InspectorSectionProps {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  right?: ReactNode;
  title: string;
}

interface InspectorStatTileProps {
  label: string;
  meta?: string;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
  value: string;
}

interface InspectorAccordionProps {
  children: ReactNode;
  onToggle: () => void;
  open: boolean;
  subtitle?: string;
  title: string;
}

const TILE_TONE_CLASSNAME: Record<NonNullable<InspectorStatTileProps['tone']>, string> = {
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-950',
  warning: 'border-orange-200 bg-orange-50 text-orange-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
};

export function InspectorSection({ children, description, eyebrow, right, title }: InspectorSectionProps) {
  return (
    <section className="rounded-[24px] border border-zinc-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.28)]">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600">{eyebrow}</p>
          )}
          <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">{title}</h3>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function InspectorStatTile({ label, meta, tone = 'neutral', value }: InspectorStatTileProps) {
  return (
    <div className={`rounded-[20px] border px-4 py-3 ${TILE_TONE_CLASSNAME[tone]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className="mt-2 text-3xl font-black leading-none tracking-tight">{value}</div>
      {meta ? <div className="mt-2 text-[11px] font-semibold opacity-80">{meta}</div> : null}
    </div>
  );
}

export function InspectorAccordion({ children, onToggle, open, subtitle, title }: InspectorAccordionProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.28)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600">Klient</p>
          <h3 className="mt-1 truncate text-lg font-black tracking-tight text-zinc-950">{title}</h3>
          {subtitle ? <p className="mt-1 truncate text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-lg font-black text-zinc-700">
          {open ? '−' : '+'}
        </span>
      </button>

      {open ? <div className="border-t border-zinc-200 px-5 py-5">{children}</div> : null}
    </section>
  );
}
