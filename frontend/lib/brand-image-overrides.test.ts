import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND_IMAGE_OVERRIDES, resolveBrandImage } from './brand-image-overrides';

describe('resolveBrandImage', () => {
  it('maps a shared image to the brand folder when the brand ships its own copy', () => {
    expect(resolveBrandImage('/images/pizzas/premium/diavola.jpg', 'partypizza')).toBe('/images/brands/partypizza/pizzas/premium/diavola.jpg');
    expect(resolveBrandImage('/images/pizzas/premium/diavola.webp', 'partypizza')).toBe('/images/brands/partypizza/pizzas/premium/diavola.webp');
    expect(resolveBrandImage('/images/hero/pizza-hero.jpg', 'PartyPizza')).toBe('/images/brands/partypizza/hero/pizza-hero.jpg');
    // drinks are listed as .png but served as .webp by toWebpIfLocal
    expect(resolveBrandImage('/images/drinks/kofola.webp', 'partypizza')).toBe('/images/brands/partypizza/drinks/kofola.webp');
  });

  it('resolves slug aliases (DB slug vs storefront slug) to the same brand folder', () => {
    expect(resolveBrandImage('/images/hero/pizza-hero.jpg', 'pizzavnudzi')).toBe('/images/brands/pizzavnudzi/hero/pizza-hero.jpg');
    expect(resolveBrandImage('/images/hero/pizza-hero.jpg', 'pizzavnudzi-sk')).toBe('/images/brands/pizzavnudzi/hero/pizza-hero.jpg');
    expect(resolveBrandImage('/images/drinks/sprite.webp', 'pizzavnudzi-sk')).toBe('/images/brands/pizzavnudzi/drinks/sprite.webp');
    expect(resolveBrandImage('/images/pizzas/premium/diavola.jpg', 'pizzaparty')).toBe('/images/brands/partypizza/pizzas/premium/diavola.jpg');
  });

  it('falls back to the shared image for other brands, unknown paths and remote URLs', () => {
    expect(resolveBrandImage('/images/pizzas/premium/diavola.jpg', 'pornopizza')).toBe('/images/pizzas/premium/diavola.jpg');
    expect(resolveBrandImage('/images/drinks/kofola.webp', 'unknown-brand')).toBe('/images/drinks/kofola.webp');
    expect(resolveBrandImage('/images/placeholder-pizza.webp', 'partypizza')).toBe('/images/placeholder-pizza.webp');
    expect(resolveBrandImage('https://cdn.example/x.jpg', 'partypizza')).toBe('https://cdn.example/x.jpg');
    expect(resolveBrandImage(undefined, 'partypizza')).toBeUndefined();
  });

  it('has a file on disk (original + .webp) for every listed override', () => {
    const publicDir = join(__dirname, '..', 'public');
    const missing: string[] = [];
    for (const [slug, paths] of Object.entries(BRAND_IMAGE_OVERRIDES)) {
      for (const shared of paths) {
        const branded = shared.replace(/^\/images\//, `/images/brands/${slug}/`);
        const webp = branded.replace(/\.(jpe?g|png)$/i, '.webp');
        for (const rel of [branded, webp]) {
          if (!existsSync(join(publicDir, rel))) missing.push(rel);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
