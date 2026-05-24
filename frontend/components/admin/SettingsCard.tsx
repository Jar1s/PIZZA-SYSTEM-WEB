import { ReactNode } from 'react';

type SettingsCardProps = {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'accent' | 'soft-dark';
};

type SettingsCardHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
};

type SettingsBadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  className?: string;
};

const toneClasses: Record<NonNullable<SettingsCardProps['tone']>, string> = {
  default: 'border-zinc-200 bg-white text-zinc-900',
  accent: 'border-orange-200 bg-orange-50/70 text-zinc-900',
  'soft-dark': 'border-zinc-900 bg-zinc-950 text-white',
};

const badgeToneClasses: Record<NonNullable<SettingsBadgeProps['tone']>, string> = {
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  accent: 'border-orange-200 bg-orange-50 text-orange-700',
};

export function SettingsCard({
  children,
  className,
  tone = 'default',
}: SettingsCardProps) {
  return (
    <section
      className={[
        'rounded-[28px] border p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}

export function SettingsCardHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: SettingsCardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-black tracking-tight text-inherit">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 self-start">{action}</div> : null}
    </div>
  );
}

export function SettingsBadge({
  children,
  tone = 'neutral',
  className,
}: SettingsBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        badgeToneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

export function SettingsToggle({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-orange-500' : 'bg-zinc-200',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

export function SettingsIconButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}
