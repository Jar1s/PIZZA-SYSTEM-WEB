import { autoFillStoryousModifierMappings } from './storyous-mapping.util';

describe('autoFillStoryousModifierMappings', () => {
  it('matches exact normalized labels to Storyous addition ids', () => {
    const result = autoFillStoryousModifierMappings([
      { additionId: '39', title: 'Ananás' },
      { additionId: '40', title: 'Artičoky' },
      { additionId: '41', title: 'Baby špenát' },
    ]);

    expect(result.mappings).toEqual(
      expect.arrayContaining([
        { optionId: 'pineapple', externalAdditionId: '39', labelOverride: null },
        { optionId: 'artichoke', externalAdditionId: '40', labelOverride: null },
        { optionId: 'spinach', externalAdditionId: '41', labelOverride: null },
      ]),
    );
  });

  it('leaves ambiguous labels unmatched', () => {
    const result = autoFillStoryousModifierMappings([
      { additionId: '10', title: 'Mozzarella' },
      { additionId: '11', title: 'Mozzarella' },
    ]);

    expect(result.mappings.find((item) => item.optionId === 'mozzarella')).toBeUndefined();
    expect(result.ambiguousOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          optionId: 'mozzarella',
          matches: expect.arrayContaining([
            expect.objectContaining({ additionId: '10' }),
            expect.objectContaining({ additionId: '11' }),
          ]),
        }),
      ]),
    );
  });

  it('ignores marketing suffixes and emoji when matching', () => {
    const result = autoFillStoryousModifierMappings([
      { additionId: '51', title: 'Paradajkový' },
      { additionId: '52', title: 'Smotanový' },
      { additionId: '53', title: 'Med-chilli' },
      { additionId: '54', title: 'BBQ paradajkový' },
      { additionId: '55', title: 'Bez základu' },
      { additionId: '56', title: 'Klasické 32 cm' },
    ]);

    expect(result.mappings).toEqual(
      expect.arrayContaining([
        { optionId: 'tomato', externalAdditionId: '51', labelOverride: null },
        { optionId: 'cream', externalAdditionId: '52', labelOverride: null },
        { optionId: 'honey-chilli', externalAdditionId: '53', labelOverride: null },
        { optionId: 'bbq', externalAdditionId: '54', labelOverride: null },
        { optionId: 'no-sauce', externalAdditionId: '55', labelOverride: null },
        { optionId: 'classic-32', externalAdditionId: '56', labelOverride: null },
      ]),
    );
  });

  it('supports safe synonyms for selected labels', () => {
    const result = autoFillStoryousModifierMappings([
      { additionId: '61', title: 'Špenát' },
      { additionId: '62', title: 'Gorgonzola' },
    ]);

    expect(result.mappings).toEqual(
      expect.arrayContaining([
        { optionId: 'spinach', externalAdditionId: '61', labelOverride: null },
        { optionId: 'gorgonzola', externalAdditionId: '62', labelOverride: null },
      ]),
    );
  });
});
