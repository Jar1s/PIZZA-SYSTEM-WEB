/**
 * Brand-specific image overrides.
 *
 * All brands share one product catalogue and one set of photos. A brand can
 * ship its own version of any shared image by placing a file at
 *   public/images/brands/<tenantSlug>/<same path as the shared image>
 * and listing the shared path here. Lookups are pure (no filesystem access in
 * the browser), so the list must be kept in sync with the files – see
 * scripts/brand-images.md. Missing entries simply fall back to the shared image.
 */

export const BRAND_IMAGE_OVERRIDES: Record<string, readonly string[]> = {
  partypizza: [
    '/images/hero/pizza-hero.jpg',
    '/images/pizzas/build-your-own.jpg',
    '/images/pizzas/classic/capri.jpg',
    '/images/pizzas/classic/fregata.jpg',
    '/images/pizzas/classic/gazdovska.jpg',
    '/images/pizzas/classic/korpus.jpg',
    '/images/pizzas/classic/margherita.jpg',
    '/images/pizzas/classic/pivarska.jpg',
    '/images/pizzas/classic/prosciutto.jpg',
    '/images/pizzas/classic/quattro-formaggi-bianco.jpg',
    '/images/pizzas/classic/quattro-formaggi.jpg',
    '/images/pizzas/classic/tonno.jpg',
    '/images/pizzas/premium/basil-pesto.jpg',
    '/images/pizzas/premium/bon-salami.jpg',
    '/images/pizzas/premium/calimero.jpg',
    '/images/pizzas/premium/da-vinci.jpg',
    '/images/pizzas/premium/diavola.jpg',
    '/images/pizzas/premium/hawaii.jpg',
    '/images/pizzas/premium/honey-chilli.jpg',
    '/images/pizzas/premium/mayday.jpg',
    '/images/pizzas/premium/picante.jpg',
    '/images/pizzas/premium/pollo-crema.jpg',
    '/images/pizzas/premium/prosciutto-crudo.jpg',
    '/images/pizzas/premium/prosciutto-funghi.jpg',
    '/images/pizzas/premium/provinciale.jpg',
    '/images/pizzas/premium/quattro-stagioni.jpg',
    '/images/pizzas/premium/vegetariana.jpg',
    '/images/stangle/stangle-gluten-free.jpg',
    '/images/stangle/stangle-regular.jpg',
    '/images/soups/tomato-soup.jpg',
    '/images/desserts/tiramissu.png',
    '/images/drinks/bonaqua-nesytena.png',
    '/images/drinks/bonaqua-sytena.png',
    '/images/drinks/coca-cola-1l.png',
    '/images/drinks/cola-zero-1l.png',
    '/images/drinks/fanta-1l.png',
    '/images/drinks/kofola.png',
    '/images/drinks/pepsi-1l.png',
    '/images/drinks/pepsi-cola-zero.png',
    '/images/drinks/sprite.png',
  ],
};

const overrideSets: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(BRAND_IMAGE_OVERRIDES).map(([slug, paths]) => [slug, new Set(paths)]),
);

function normalizeSlug(slug: string | null | undefined): string {
  return String(slug || '').trim().toLowerCase();
}

/**
 * Map a shared image path to the brand's own copy when one exists.
 * Accepts both the original (.jpg/.png) and the .webp variant of a shared path.
 */
export function resolveBrandImage(
  path: string | null | undefined,
  tenantSlug: string | null | undefined,
): string | undefined {
  if (!path) return path ?? undefined;
  const slug = normalizeSlug(tenantSlug);
  const set = slug ? overrideSets[slug] : undefined;
  if (!set || !path.startsWith('/images/')) return path;

  const candidates = [path, path.replace(/\.webp$/i, '.jpg'), path.replace(/\.webp$/i, '.png')];
  const match = candidates.find((candidate) => set.has(candidate));
  if (!match) return path;

  // Keep the requested extension (.webp stays .webp) but point into the brand folder.
  return path.replace(/^\/images\//, `/images/brands/${slug}/`);
}
