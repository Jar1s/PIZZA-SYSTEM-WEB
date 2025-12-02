import { pizzaCustomizations, stangleCustomizations, CustomizationCategory } from './customization-options';

/**
 * Calculates the total price of modifiers for a product
 * @param modifiers - Record<string, string[]> where keys are modifier category IDs and values are arrays of selected option IDs
 * @param productCategory - Product category ('PIZZA' or 'STANGLE')
 * @returns Total price of all modifiers in cents
 */
export function calculateModifierPrice(
  modifiers: Record<string, string[]> | undefined | null,
  productCategory: string | undefined
): number {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return 0;
  }

  // Select the appropriate customization options based on product category
  let customizations: CustomizationCategory[];
  if (productCategory === 'STANGLE') {
    customizations = stangleCustomizations;
  } else if (productCategory === 'PIZZA') {
    customizations = pizzaCustomizations;
  } else {
    // For other categories, no modifiers are supported
    return 0;
  }

  let totalPrice = 0;

  // Iterate through each modifier category in the modifiers object
  Object.entries(modifiers).forEach(([categoryId, optionIds]) => {
    // Find the customization category
    const category = customizations.find(c => c.id === categoryId);
    if (!category) {
      return; // Skip if category not found
    }

    // For each selected option ID, find its price
    optionIds.forEach(optionId => {
      const option = category.options.find(o => o.id === optionId);
      if (option) {
        totalPrice += option.price;
      }
    });
  });

  return totalPrice;
}

