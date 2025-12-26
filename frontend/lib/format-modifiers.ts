import { getCustomizationOptions } from '@pizza-ecosystem/shared';
import type { CustomizationLabels } from '@pizza-ecosystem/shared';

/**
 * Removes emoji and special formatting from text
 */
function cleanName(name: string): string {
  return name
    .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '')
    .replace(/[🧀🫓🍅🧈🧩]/g, '')
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDefaultCategoryName(categoryId: string, language: 'sk' | 'en' = 'sk', customizationLabels?: CustomizationLabels): string {
  const override = customizationLabels?.categories?.[categoryId as keyof NonNullable<CustomizationLabels['categories']>];
  if (override) {
    const localized = language === 'en' ? override.en : override.sk;
    if (localized) return localized;
  }

  const categoryMap: Record<string, { sk: string; en: string }> = {
    'dough': { sk: 'Podklad', en: 'Dough' },
    'cheese': { sk: 'Syr', en: 'Cheese' },
    'sauce': { sk: 'Základ', en: 'Base' },
    'edge': { sk: 'Okraj', en: 'Edge' },
    'toppings': { sk: 'Extra', en: 'Extra' },
  };
  return categoryMap[categoryId]?.[language] || categoryId;
}

function getOptionLabel(optionId: string, optionName: string, language: 'sk' | 'en', customizationLabels?: CustomizationLabels): string {
  const override = customizationLabels?.options?.[optionId];
  if (override) {
    const localized = language === 'en' ? override.en : override.sk;
    if (localized) return localized;
  }

  let cleaned = cleanName(optionName);

  if (optionId === 'cheesy-edge') {
    const parts = cleaned.split('–');
    if (parts.length > 1) return parts[1].trim();
    return cleaned;
  }

  cleaned = cleaned.split('–')[0].trim();
  cleaned = cleaned.split('-')[0].trim();
  cleaned = cleaned.replace(/\s*\([^)]+\)/g, '');

  return cleaned.trim();
}

export function formatModifiers(
  modifiers: Record<string, any> | null | undefined,
  useDefaults: boolean = false,
  language: 'sk' | 'en' = 'sk',
  customizationLabels?: CustomizationLabels
): string[] {
  if (!modifiers || typeof modifiers !== 'object') {
    return [];
  }

  let parsedModifiers: Record<string, any>;
  if (typeof modifiers === 'string') {
    try {
      parsedModifiers = JSON.parse(modifiers);
    } catch (error) {
      console.error('[formatModifiers] Failed to parse JSON string:', error, modifiers);
      return [];
    }
  } else {
    parsedModifiers = modifiers;
  }

  if (Object.keys(parsedModifiers).length === 0) {
    return [];
  }

  const formatted: string[] = [];
  const pizzaCustomizations = getCustomizationOptions('PIZZA');
  const stangleCustomizations = getCustomizationOptions('STANGLE');
  const allCustomizations = [...pizzaCustomizations, ...stangleCustomizations];

  try {
    Object.entries(parsedModifiers).forEach(([categoryId, optionIds]) => {
      const category = allCustomizations.find(c => c.id === categoryId);
      if (!category) {
        console.warn('[formatModifiers] Category not found:', categoryId);
        return;
      }

      const optionIdsArray = Array.isArray(optionIds)
        ? optionIds
        : optionIds ? [optionIds] : [];

      if (optionIdsArray.length === 0) return;

      const optionNames = optionIdsArray
        .map((optionId: any) => {
          if (typeof optionId !== 'string') {
            console.warn('[formatModifiers] Option ID is not a string:', optionId);
            return null;
          }
          const option = category.options.find(o => o.id === optionId);
          if (!option) {
            console.warn('[formatModifiers] Option not found:', optionId, 'in category:', categoryId);
            return null;
          }

          if (useDefaults) {
            const nameToClean = language === 'en' ? option.nameEn : option.name;
            return getOptionLabel(optionId, nameToClean, language, customizationLabels);
          }
          return language === 'en' ? option.nameEn : option.name;
        })
        .filter(Boolean) as string[];

      if (optionNames.length > 0) {
        const categoryName = useDefaults
          ? getDefaultCategoryName(categoryId, language, customizationLabels)
          : (language === 'en' ? category.nameEn : category.name);
        formatted.push(`${categoryName}: ${optionNames.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Error formatting modifiers:', error);
    return [];
  }

  return formatted;
}
