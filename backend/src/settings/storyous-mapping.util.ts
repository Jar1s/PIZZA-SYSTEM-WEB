import { getCustomizationOptions } from '@pizza-ecosystem/shared';

export type StoryousCatalogAddition = {
  additionId: string;
  title: string;
  additionCategoryId?: string;
  categoryTitle?: string;
};

export type StoryousAutoFillOption = {
  optionId: string;
  label: string;
};

export type StoryousAutoFillResult = {
  mappings: Array<{
    optionId: string;
    externalAdditionId: string;
    labelOverride: null;
  }>;
  matchedCount: number;
  unmatchedOptions: StoryousAutoFillOption[];
  ambiguousOptions: Array<StoryousAutoFillOption & { matches: StoryousCatalogAddition[] }>;
  additionsCount: number;
};

function normalizeStoryousLabel(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'`]/g, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[–—-]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getStoryousMappingOptions(): StoryousAutoFillOption[] {
  const buckets = [
    ...getCustomizationOptions('PIZZA'),
    ...getCustomizationOptions('STANGLE'),
  ];
  const seen = new Set<string>();
  const result: StoryousAutoFillOption[] = [];

  for (const bucket of buckets) {
    for (const option of bucket.options) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      result.push({
        optionId: option.id,
        label: option.name,
      });
    }
  }

  return result.sort((a, b) => a.label.localeCompare(b.label, 'sk'));
}

export function autoFillStoryousModifierMappings(
  additions: StoryousCatalogAddition[],
): StoryousAutoFillResult {
  const options = getStoryousMappingOptions();
  const additionsByNormalizedTitle = new Map<string, StoryousCatalogAddition[]>();

  for (const addition of additions) {
    const normalizedTitle = normalizeStoryousLabel(addition.title);
    if (!normalizedTitle) continue;

    const current = additionsByNormalizedTitle.get(normalizedTitle) || [];
    current.push(addition);
    additionsByNormalizedTitle.set(normalizedTitle, current);
  }

  const mappings: StoryousAutoFillResult['mappings'] = [];
  const unmatchedOptions: StoryousAutoFillResult['unmatchedOptions'] = [];
  const ambiguousOptions: StoryousAutoFillResult['ambiguousOptions'] = [];

  for (const option of options) {
    const normalizedOption = normalizeStoryousLabel(option.label);
    const matches = additionsByNormalizedTitle.get(normalizedOption) || [];

    if (matches.length === 1) {
      mappings.push({
        optionId: option.optionId,
        externalAdditionId: matches[0].additionId,
        labelOverride: null,
      });
      continue;
    }

    if (matches.length > 1) {
      ambiguousOptions.push({
        ...option,
        matches,
      });
      continue;
    }

    unmatchedOptions.push(option);
  }

  return {
    mappings,
    matchedCount: mappings.length,
    unmatchedOptions,
    ambiguousOptions,
    additionsCount: additions.length,
  };
}
