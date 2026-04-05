import { getCustomizationOptions } from '@pizza-ecosystem/shared';
import { TenantTheme } from '../types/tenant.types';

export type StoryousModifierSelection = {
  groupId: string;
  optionId: string;
  rawLabel: string;
  receiptLabel: string;
};

const CATEGORY_ORDER: Record<string, number> = {
  dough: 1,
  sauce: 2,
  cheese: 3,
  edge: 4,
  toppings: 5,
  extra: 6,
};

const RECEIPT_LABEL_OVERRIDES: Record<string, string> = {
  'classic-32': 'Klasické 32 cm',
  tomato: 'Paradajkovy',
  'cheesy-edge': 'Americké so syrovým okrajom',
  'olive-oil': 'Olivovým olejom',
};

export function formatStoryousReceiptModifierLabel(optionId: string, rawLabel: string): string {
  const override = RECEIPT_LABEL_OVERRIDES[optionId];
  if (override) {
    return override;
  }

  return String(rawLabel || '')
    .replace(/["']/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .split(/\s+[–-]\s+/)[0]
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildStoryousModifierSelections(
  modifiers: Record<string, any> | string | null | undefined,
  productCategory: string = 'PIZZA',
  tenantTheme?: TenantTheme,
): StoryousModifierSelection[] {
  if (!modifiers || typeof modifiers !== 'object') {
    if (typeof modifiers !== 'string') {
      return [];
    }
  }

  const parsedModifiers = typeof modifiers === 'string'
    ? (() => {
        try {
          return JSON.parse(modifiers);
        } catch {
          return {};
        }
      })()
    : modifiers;

  if (!parsedModifiers || typeof parsedModifiers !== 'object') {
    return [];
  }

  const category = String(productCategory || 'PIZZA').toUpperCase();
  const customizationOptions = getCustomizationOptions(category);
  const optionLabelOverrides = tenantTheme?.customizationLabels?.options || {};

  const groups = Object.keys(parsedModifiers).sort((a, b) => {
    const byPriority = (CATEGORY_ORDER[a] ?? 100) - (CATEGORY_ORDER[b] ?? 100);
    if (byPriority !== 0) return byPriority;
    return a.localeCompare(b);
  });

  const selections: StoryousModifierSelection[] = [];

  for (const groupId of groups) {
    const selected = Array.isArray((parsedModifiers as Record<string, any>)[groupId])
      ? (parsedModifiers as Record<string, any>)[groupId]
      : (parsedModifiers as Record<string, any>)[groupId]
        ? [(parsedModifiers as Record<string, any>)[groupId]]
        : [];

    if (selected.length === 0) continue;

    const group = customizationOptions.find((item) => item.id === groupId);

    for (const optionIdRaw of selected) {
      const optionId = String(optionIdRaw || '').trim();
      if (!optionId) continue;

      const option = group?.options?.find((item) => item.id === optionId);
      const overrideLabel = optionLabelOverrides[optionId]?.sk;
      const rawLabel = String(overrideLabel || option?.name || optionId).trim();
      const receiptLabel = formatStoryousReceiptModifierLabel(optionId, rawLabel);

      if (!receiptLabel) continue;

      selections.push({
        groupId,
        optionId,
        rawLabel,
        receiptLabel,
      });
    }
  }

  return selections;
}
