'use client';

interface DispatchQueueItemProps {
  accentClassName: string;
  brandInitials: string;
  createdLabel: string;
  headline: string;
  isCanceled: boolean;
  isFinished: boolean;
  isSelected: boolean;
  metaLine: string;
  onSelect: () => void;
  timerLabel: string;
  timerTone: 'success' | 'warning' | 'danger';
}

const TIMER_TONE_CLASSNAME: Record<DispatchQueueItemProps['timerTone'], string> = {
  success: 'border-emerald-500 text-emerald-700 bg-white',
  warning: 'border-amber-500 text-amber-700 bg-amber-50',
  danger: 'border-rose-500 text-rose-600 bg-rose-50',
};

export function DispatchQueueItem({
  accentClassName,
  brandInitials,
  createdLabel,
  headline,
  isCanceled,
  isFinished,
  isSelected,
  metaLine,
  onSelect,
  timerLabel,
  timerTone,
}: DispatchQueueItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`group relative w-full text-left transition-all duration-200 ${
        isSelected
          ? 'bg-orange-50/90 shadow-[inset_4px_0_0_0_#f97316]'
          : 'bg-transparent hover:bg-white'
      }`}
    >
      <div className="flex min-h-[76px] items-stretch">
        <div
          className={`flex w-9 shrink-0 items-center justify-center text-[8px] font-black tracking-[0.18em] text-white ${accentClassName}`}
        >
          <span className="-rotate-90">{brandInitials}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[13px] font-black leading-tight text-zinc-950">{headline}</p>
              {isFinished && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Hotovo
                </span>
              )}
              {isCanceled && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                  Zrusene
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate text-[11px] font-semibold text-zinc-600">{metaLine}</p>
            <p className="mt-1 text-[10px] font-medium text-zinc-500">{createdLabel}</p>
          </div>

          <div className="flex w-[56px] shrink-0 items-center justify-center">
            {isFinished ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-sm font-black text-emerald-600">
                ✓
              </span>
            ) : isCanceled ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-rose-500 bg-white text-sm font-black text-rose-600">
                ✕
              </span>
            ) : (
              <span
                className={`inline-flex h-11 min-w-[46px] items-center justify-center rounded-full border-2 px-2 text-[12px] font-black ${TIMER_TONE_CLASSNAME[timerTone]}`}
              >
                {timerLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
