import { describe, expect, it } from 'vitest';
import { resolveBrandImage } from './brand-image-overrides';

describe('resolveBrandImage', () => {
  it('maps a shared image to the brand folder when the brand ships its own copy', () => {
    expect(resolveBrandImage('/images/pizzas/premium/diavola.jpg', 'partypizza')).toBe('/images/brands/partypizza/pizzas/premium/diavola.jpg');
    expect(resolveBrandImage('/images/pizzas/premium/diavola.webp', 'partypizza')).toBe('/images/brands/partypizza/pizzas/premium/diavola.webp');
    expect(resolveBrandImage('/images/hero/pizza-hero.jpg', 'PartyPizza')).toBe('/images/brands/partypizza/hero/pizza-hero.jpg');
  });

  it('falls back to the shared image for other brands, unknown paths and remote URLs', () => {
    expect(resolveBrandImage('/images/pizzas/premium/diavola.jpg', 'pornopizza')).toBe('/images/pizzas/premium/diavola.jpg');
    expect(resolveBrandImage('/images/drinks/kofola.webp', 'partypizza')).toBe('/images/drinks/kofola.webp');
    expect(resolveBrandImage('https://cdn.example/x.jpg', 'partypizza')).toBe('https://cdn.example/x.jpg');
    expect(resolveBrandImage(undefined, 'partypizza')).toBeUndefined();
  });
});
