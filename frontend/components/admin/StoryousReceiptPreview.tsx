'use client';

import type { StoryousReceiptPreview as StoryousReceiptPreviewData } from '@/lib/api';

interface StoryousReceiptPreviewProps {
  preview: StoryousReceiptPreviewData | null;
  loading: boolean;
  error: string | null;
  onReload?: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
  headerLeftLabel?: string;
}

export function StoryousReceiptPreview({
  preview,
  loading,
  error,
  onReload,
  title = 'Náhľad Storyous kolku',
  subtitle = 'Preview používa rovnaké receipt riadky ako backend pri Storyous syncu.',
  className,
  headerLeftLabel = 'Stôl: CD',
}: StoryousReceiptPreviewProps) {
  return (
    <div className={['rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]', className].filter(Boolean).join(' ')}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-black tracking-tight text-gray-900">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
        </div>
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Nacitavam...' : 'Obnovit'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {preview && preview.warnings.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {preview.warnings.map((warning, index) => (
            <div key={`${warning}-${index}`}>• {warning}</div>
          ))}
        </div>
      ) : null}

      {loading && !preview ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Nacitavam nahlad kolku...
        </div>
      ) : null}

      {preview && (
        <div className="mx-auto max-w-[420px] rounded-sm border border-stone-300 bg-[#f9f7f1] px-5 py-4 text-black shadow-sm">
          <div className="flex items-end justify-between">
            <span className="text-[22px] font-semibold tracking-tight">{headerLeftLabel}</span>
            <span className="text-[70px] font-semibold leading-none tracking-[-0.06em]">{preview.printedTime}</span>
          </div>

          <div className="mt-2 border-t border-stone-500" />

          <div className="mt-1 flex justify-end">
            <span className="text-[28px] font-semibold tracking-[-0.04em]">{preview.printedDate}</span>
          </div>

          {preview.title && (
            <div className="mt-3 text-center text-5xl font-bold tracking-wide">
              {preview.title}
            </div>
          )}

          <div className="mt-3 border-t border-stone-500" />

          <div className="mt-6 space-y-4">
            {preview.items.map((item, index) => (
              <div key={`${item.name}-${index}`}>
                <div className="text-[34px] font-semibold leading-tight tracking-[-0.04em]">
                  {item.quantity}×{item.name}
                </div>
                {item.modifierLines.length > 0 && (
                  <div className="mt-2 space-y-1 pl-7">
                    {item.modifierLines.map((line, lineIndex) => (
                      <div
                        key={`${line}-${lineIndex}`}
                        className="text-[28px] leading-[1.15] tracking-[-0.03em]"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="my-5 border-t border-stone-500" />

          <div className="space-y-1">
            {preview.noteLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="text-[26px] font-semibold leading-[1.1] tracking-[-0.03em]"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-1">
            {preview.customerDetailLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="text-[26px] leading-[1.15] tracking-[-0.03em]"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
