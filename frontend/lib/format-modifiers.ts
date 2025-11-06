import { pizzaCustomizations } from './customization-options';

export function formatModifiers(modifiers: Record<string, any> | null | undefined): string[] {
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

  try {
    Object.entries(parsedModifiers).forEach(([categoryId, optionIds]) => {
      const category = pizzaCustomizations.find(c => c.id === categoryId);
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
          return option ? option.name : null;
        })
        .filter(Boolean) as string[];

      if (optionNames.length > 0) {
        formatted.push(`${category.name}: ${optionNames.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Error formatting modifiers:', error);
    return [];
  }

  return formatted;
}

