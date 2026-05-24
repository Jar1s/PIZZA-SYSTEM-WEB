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

const LABEL_SYNONYMS: Record<string, string[]> = {
  'baby spenat': ['spenat'],
  niva: ['gorgonzola'],
  gorgonzola: ['niva'],
};

function stripMarketingSuffix(value: string): string {
  return String(value || '')
    .replace(/\s+[–—-]\s+.*$/u, '')
    .trim();
}

function stripParentheticalContent(value: string): string {
  return String(value || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

function normalizeStoryousLabel(value: string): string {
  const stripped = stripParentheticalContent(stripMarketingSuffix(String(value || '')));

  return stripped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'`]/g, '')
    .replace(/[^\p{L}\p{N}\s–—-]/gu, ' ')
    .replace(/\s+[–—-]\s+/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getCandidateLabels(value: string): string[] {
  const primary = normalizeStoryousLabel(value);
  if (!primary) return [];

  const candidates = new Set<string>([primary]);
  for (const alias of LABEL_SYNONYMS[primary] || []) {
    const normalizedAlias = normalizeStoryousLabel(alias);
    if (normalizedAlias) {
      candidates.add(normalizedAlias);
    }
  }

  return Array.from(candidates);
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
    const matches = new Map<string, StoryousCatalogAddition>();

    for (const candidate of getCandidateLabels(option.label)) {
      for (const match of additionsByNormalizedTitle.get(candidate) || []) {
        matches.set(match.additionId, match);
      }
    }

    const matchList = Array.from(matches.values());

    if (matchList.length === 1) {
      mappings.push({
        optionId: option.optionId,
        externalAdditionId: matchList[0].additionId,
        labelOverride: null,
      });
      continue;
    }

    if (matchList.length > 1) {
      ambiguousOptions.push({
        ...option,
        matches: matchList,
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
