import { pizzaCustomizations } from './customization-options';

export function formatModifiers(modifiers: Record<string, any> | null): string[] {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return [];
  }

  const formatted: string[] = [];

  Object.entries(modifiers).forEach(([categoryId, optionIds]) => {
    const category = pizzaCustomizations.find(c => c.id === categoryId);
    if (!category || !Array.isArray(optionIds)) return;

    const optionNames = optionIds
      .map((optionId: string) => {
        const option = category.options.find(o => o.id === optionId);
        return option ? option.name : null;
      })
      .filter(Boolean) as string[];

    if (optionNames.length > 0) {
      formatted.push(`${category.name}: ${optionNames.join(', ')}`);
    }
  });

  return formatted;
}

