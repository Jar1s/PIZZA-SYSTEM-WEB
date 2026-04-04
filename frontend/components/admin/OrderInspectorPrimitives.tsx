'use client';

import { ReactNode } from 'react';

interface InspectorSectionProps {
  className?: string;
  children: ReactNode;
  contentClassName?: string;
  description?: string;
  eyebrow?: string;
  headerClassName?: string;
  right?: ReactNode;
  title: string;
}

interface InspectorStatTileProps {
  className?: string;
  label: string;
  meta?: string;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
  value: string;
  valueClassName?: string;
}

interface InspectorAccordionProps {
  className?: string;
  children: ReactNode;
  contentClassName?: string;
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

export function InspectorSection({
  children,
  className,
  contentClassName,
  description,
  eyebrow,
  headerClassName,
  right,
  title,
}: InspectorSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_14px_34px_-30px_rgba(15,23,42,0.22)] ${className || ''}`}
    >
      <div
        className={`flex items-start justify-between gap-3 border-b border-zinc-200 px-3.5 py-2.5 ${headerClassName || ''}`}
      >
        <div>
          {eyebrow && (
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">{eyebrow}</p>
          )}
          <h3 className="mt-1 text-[15px] font-black tracking-tight text-zinc-950">{title}</h3>
          {description ? <p className="mt-1 text-[11px] text-zinc-500">{description}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className={`px-3.5 py-3 ${contentClassName || ''}`}>{children}</div>
    </section>
  );
}

export function InspectorStatTile({
  className,
  label,
  meta,
  tone = 'neutral',
  value,
  valueClassName,
}: InspectorStatTileProps) {
  return (
    <div className={`rounded-[16px] border px-3 py-2.5 ${TILE_TONE_CLASSNAME[tone]} ${className || ''}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className={`mt-1.5 text-[22px] font-black leading-none tracking-tight ${valueClassName || ''}`}>
        {value}
      </div>
      {meta ? <div className="mt-1 text-[10px] font-semibold opacity-80">{meta}</div> : null}
    </div>
  );
}

export function InspectorAccordion({
  children,
  className,
  contentClassName,
  onToggle,
  open,
  subtitle,
  title,
}: InspectorAccordionProps) {
  return (
    <section
      className={`overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_14px_34px_-30px_rgba(15,23,42,0.22)] ${className || ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">Klient</p>
          <h3 className="mt-1 truncate text-[15px] font-black tracking-tight text-zinc-950">{title}</h3>
          {subtitle ? <p className="mt-1 truncate text-[11px] text-zinc-500">{subtitle}</p> : null}
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[16px] border border-zinc-200 bg-zinc-50 text-base font-black text-zinc-700">
          {open ? '−' : '+'}
        </span>
      </button>

      {open ? (
        <div className={`border-t border-zinc-200 px-3.5 py-3 ${contentClassName || ''}`}>{children}</div>
      ) : null}
    </section>
  );
}
