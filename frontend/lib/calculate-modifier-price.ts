import { getCustomizationOptions } from '@/shared/types/customization-options';

export function calculateModifierPrice(
  modifiers: Record<string, string[]> | undefined | null,
  productCategory: string | undefined
): number {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return 0;
  }

  const customizations = getCustomizationOptions(productCategory || '');
  if (customizations.length === 0) {
    return 0;
  }

  let totalPrice = 0;

  Object.entries(modifiers).forEach(([categoryId, optionIds]) => {
    const category = customizations.find((c) => c.id === categoryId);
    if (!category) return;

    optionIds.forEach((optionId) => {
      const option = category.options.find((o) => o.id === optionId);
      if (option) {
        totalPrice += option.price || option.priceCents || 0;
      }
    });
  });

  return totalPrice;
}
