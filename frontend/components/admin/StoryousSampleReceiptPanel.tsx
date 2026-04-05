'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoryousSampleReceiptPreview, StoryousReceiptPreview as StoryousReceiptPreviewData } from '@/lib/api';
import { StoryousReceiptPreview } from '@/components/admin/StoryousReceiptPreview';

type StoryousSampleReceiptPanelProps = {
  tenantSlug?: string | null;
  tenantName?: string | null;
  className?: string;
};

export function StoryousSampleReceiptPanel({
  tenantSlug,
  tenantName,
  className,
}: StoryousSampleReceiptPanelProps) {
  const [preview, setPreview] = useState<StoryousReceiptPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!tenantSlug) {
      setPreview(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getStoryousSampleReceiptPreview(tenantSlug);
      setPreview(data);
    } catch (loadError: any) {
      setPreview(null);
      setError(loadError?.message || 'Nepodarilo sa načítať Storyous preview.');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  return (
    <StoryousReceiptPreview
      preview={preview}
      loading={loading}
      error={error}
      onReload={tenantSlug ? loadPreview : undefined}
      title="Aktuálny výstup Storyous kolku"
      subtitle={
        tenantSlug
          ? `Preview používa rovnaký backend builder ako reálny Storyous sync pre brand ${tenantName || tenantSlug}.`
          : 'Vyber brand, aby sa načítal Storyous preview.'
      }
      headerLeftLabel="Stôl: CD"
      className={className}
    />
  );
}
