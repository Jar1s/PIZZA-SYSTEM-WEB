import {
  buildStoryousModifierSelections,
  formatStoryousReceiptModifierLabel,
} from './storyous-modifier.util';

describe('storyous-modifier.util', () => {
  it('formats known receipt-safe overrides', () => {
    expect(formatStoryousReceiptModifierLabel('classic-32', 'Klasické 32 cm – pšeničné')).toBe(
      'Klasické 32 cm',
    );
    expect(
      formatStoryousReceiptModifierLabel(
        'tomato',
        'Paradajkový – klasika, čo nikdy nesklame',
      ),
    ).toBe('Paradajkovy');
  });

  it('removes quotes and parenthetical suffixes for generic labels', () => {
    expect(formatStoryousReceiptModifierLabel('custom', '"Mozzarella" (extra)')).toBe(
      'Mozzarella',
    );
  });

  it('builds ordered modifier selections with receipt labels', () => {
    const selections = buildStoryousModifierSelections(
      {
        sauce: ['tomato'],
        dough: ['classic-32'],
        cheese: ['mozzarella'],
        edge: ['olive-oil'],
      },
      'PIZZA',
    );

    expect(selections.map((selection) => selection.receiptLabel)).toEqual([
      'Klasické 32 cm',
      'Paradajkovy',
      'Mozzarella',
      'Olivovým olejom',
    ]);
  });
});
