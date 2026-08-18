import { getProductCustomizations, calculateProductModifierPrice, getCustomizationOptions } from '@pizza-ecosystem/shared';

describe('product-aware customization resolution', () => {
  it('offers only the product-defined modifiers when the product has its own (STANGLE case)', () => {
    const posuch = {
      category: 'STANGLE',
      modifiers: [
        { id: 'edge', name: 'OKRAJ', type: 'single' as const, required: true, options: [
          { id: 'garlic', name: 'Cesnakom', priceCents: 0 },
          { id: 'olive-oil', name: 'Olejom', priceCents: 0 },
          { id: 'none', name: 'Raw', priceCents: 0 },
        ] },
      ],
    };
    const cats = getProductCustomizations(posuch);
    expect(cats.map((c) => c.id)).toEqual(['edge']);
    // presentation is enriched from the preset (emoji label), ids stay from DB
    expect(cats[0].options.map((o) => o.id)).toEqual(['garlic', 'olive-oil', 'none']);
  });

  it('falls back to the category preset when the product has no modifiers (PIZZA case)', () => {
    const pizza = { category: 'PIZZA', modifiers: [] };
    expect(getProductCustomizations(pizza)).toEqual(getCustomizationOptions('PIZZA'));
    expect(getProductCustomizations(pizza).map((c) => c.id)).toEqual(['dough', 'cheese', 'sauce', 'edge', 'toppings']);
  });

  it('prices from the same source it validates against', () => {
    const pizza = { category: 'PIZZA', modifiers: null };
    const glutenFreeUpcharge = getCustomizationOptions('PIZZA').find((c) => c.id === 'dough')!.options.find((o) => o.id === 'gluten-free-28')!.price;
    expect(calculateProductModifierPrice({ dough: ['gluten-free-28'] }, pizza)).toBe(glutenFreeUpcharge);
    const posuch = { category: 'STANGLE', modifiers: [{ id: 'edge', name: 'OKRAJ', options: [{ id: 'garlic', name: 'Cesnakom', priceCents: 0 }] }] };
    // a selection the product does not define contributes nothing (backend rejects it anyway)
    expect(calculateProductModifierPrice({ dough: ['classic-32'], edge: ['garlic'] }, posuch)).toBe(0);
  });
});
