import { pizzaCustomizations, stangleCustomizations } from './customization-options';

/**
 * Removes emoji and special formatting from text
 */
function cleanName(name: string): string {
  // Remove emoji and special characters, keep only text
  return name
    .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '') // Remove emoji (UTF-16 surrogate pairs)
    .replace(/[🧀🫓🍅🧈🧩]/g, '') // Remove specific emoji
    .replace(/–/g, '-') // Replace em dash with regular dash
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Gets default category name (without emoji and special formatting)
 */
function getDefaultCategoryName(categoryId: string, language: 'sk' | 'en' = 'sk'): string {
  const categoryMap: Record<string, { sk: string; en: string }> = {
    'dough': { sk: 'Podklad', en: 'Dough' },
    'cheese': { sk: 'Syr', en: 'Cheese' },
    'sauce': { sk: 'Základ', en: 'Base' },
    'edge': { sk: 'Okraj', en: 'Edge' },
    'toppings': { sk: 'Extra', en: 'Extra' },
  };
  return categoryMap[categoryId]?.[language] || categoryId;
}

/**
 * Gets default option name (removes emoji and special text)
 */
function getDefaultOptionName(optionName: string, optionId?: string): string {
  // Remove emoji and special formatting
  let cleaned = cleanName(optionName);
  
  // Special case: cheesy-edge should show the part after dash
  if (optionId === 'cheesy-edge') {
    const parts = cleaned.split('–');
    if (parts.length > 1) {
      return parts[1].trim();
    }
    // Fallback if no dash found
    return cleaned;
  }
  
  // Remove everything after first dash (including the dash)
  // e.g. "Paradajkový – klasika, čo nikdy nesklame" -> "Paradajkový"
  cleaned = cleaned.split('–')[0].trim();
  cleaned = cleaned.split('-')[0].trim(); // Also handle regular dash
  
  // Remove parentheses and their content
  cleaned = cleaned.replace(/\s*\([^)]+\)/g, '');
  
  return cleaned.trim();
}

export function formatModifiers(
  modifiers: Record<string, any> | null | undefined,
  useDefaults: boolean = false,
  language: 'sk' | 'en' = 'sk'
): string[] {
  // Handle null, undefined, or empty modifiers
  if (!modifiers || typeof modifiers !== 'object') {
    return [];
  }

  // Handle string (JSON) - parse it
  let parsedModifiers: Record<string, any>;
  if (typeof modifiers === 'string') {
    try {
      parsedModifiers = JSON.parse(modifiers);
    } catch {
      return [];
    }
  } else {
    parsedModifiers = modifiers;
  }

  if (Object.keys(parsedModifiers).length === 0) {
    return [];
  }

  const formatted: string[] = [];
  const allCustomizations = [...pizzaCustomizations, ...stangleCustomizations];

  try {
    Object.entries(parsedModifiers).forEach(([categoryId, optionIds]) => {
      const category = allCustomizations.find(c => c.id === categoryId);
      if (!category) return;

      // Handle both array and single value
      const optionIdsArray = Array.isArray(optionIds) 
        ? optionIds 
        : optionIds ? [optionIds] : [];

      if (optionIdsArray.length === 0) return;

      const optionNames = optionIdsArray
        .map((optionId: any) => {
          if (typeof optionId !== 'string') return null;
          const option = category.options.find(o => o.id === optionId);
          if (!option) return null;
          
          // Use default name (cleaned) for admin/orders, or original for customer-facing
          if (useDefaults) {
            const nameToClean = language === 'en' ? option.nameEn : option.name;
            return getDefaultOptionName(nameToClean, optionId);
          } else {
            return language === 'en' ? option.nameEn : option.name;
          }
        })
        .filter(Boolean) as string[];

      if (optionNames.length > 0) {
        const categoryName = useDefaults
          ? getDefaultCategoryName(categoryId, language)
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

