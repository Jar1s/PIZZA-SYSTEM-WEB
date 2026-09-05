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
});
