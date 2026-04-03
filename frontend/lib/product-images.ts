/**
 * Centralized product image fallback logic
 * Works regardless of product category - finds images by product name
 */

// Image maps for different product types
const dessertImageMap: Record<string, string> = {
  'tiramisu': '/images/desserts/tiramissu.png',
  'tiramissu': '/images/desserts/tiramissu.png',
};

const soupImageMap: Record<string, string> = {
  'tomato soup': '/images/soups/tomato-soup.jpg',
  'tomato-soup': '/images/soups/tomato-soup.jpg',
  'paradajková polievka': '/images/soups/tomato-soup.jpg',
  'paradajkova polievka': '/images/soups/tomato-soup.jpg',
  'paradajková': '/images/soups/tomato-soup.jpg',
  'paradajkova': '/images/soups/tomato-soup.jpg',
  'polievka': '/images/soups/tomato-soup.jpg',
};

const drinkImageMap: Record<string, string> = {
  'bonaqua nesýtená 1,5l': '/images/drinks/bonaqua-nesytena.png',
  'bonaqua nesytena 1,5l': '/images/drinks/bonaqua-nesytena.png',
  'bonaqua nesýtená': '/images/drinks/bonaqua-nesytena.png',
  'bonaqua nesytena': '/images/drinks/bonaqua-nesytena.png',
  'bon aqua nesýtená': '/images/drinks/bonaqua-nesytena.png',
  'bon aqua nesytena': '/images/drinks/bonaqua-nesytena.png',
  'bonaqua sýtená 1,5l': '/images/drinks/bonaqua-sytena.png',
  'bonaqua sytena 1,5l': '/images/drinks/bonaqua-sytena.png',
  'bonaqua sýtená': '/images/drinks/bonaqua-sytena.png',
  'bonaqua sytena': '/images/drinks/bonaqua-sytena.png',
  'bon aqua sýtená': '/images/drinks/bonaqua-sytena.png',
  'bon aqua sytena': '/images/drinks/bonaqua-sytena.png',
  'kofola 2l': '/images/drinks/kofola.png',
  'kofola': '/images/drinks/kofola.png',
  'pepsi 1l': '/images/drinks/pepsi-1l.png',
  'pepsi': '/images/drinks/pepsi-1l.png',
  'pepsi zero 1l': '/images/drinks/pepsi-cola-zero.png',
  'pepsi cola zero': '/images/drinks/pepsi-cola-zero.png',
  'pepsi cola zero 1l': '/images/drinks/pepsi-cola-zero.png',
  'pepsi zero': '/images/drinks/pepsi-cola-zero.png',
  'pepsi-cola-zero': '/images/drinks/pepsi-cola-zero.png',
  'pepsi-cola-zero-1l': '/images/drinks/pepsi-cola-zero.png',
  'sprite 1l': '/images/drinks/sprite.png',
  'sprite': '/images/drinks/sprite.png',
  'fanta 1l': '/images/drinks/fanta-1l.png',
  'fanta': '/images/drinks/fanta-1l.png',
  'coca cola 1l': '/images/drinks/coca-cola-1l.png',
  'coca-cola 1l': '/images/drinks/coca-cola-1l.png',
  'coca cola classic': '/images/drinks/coca-cola-1l.png',
  'coca-cola classic': '/images/drinks/coca-cola-1l.png',
  'cola zero 1l': '/images/drinks/cola-zero-1l.png',
  'coca cola zero': '/images/drinks/cola-zero-1l.png',
  'coca-cola zero': '/images/drinks/cola-zero-1l.png',
  'coca cola zero sugar': '/images/drinks/cola-zero-1l.png',
  'coca-cola zero sugar': '/images/drinks/cola-zero-1l.png',
};

const pizzaImageMap: Record<string, string> = {
  'vyskladaj si vlastnú pizzu': '/images/pizzas/build-your-own.jpg',
  'vyskladaj si vlastnu pizzu': '/images/pizzas/build-your-own.jpg',
  'build your own pizza': '/images/pizzas/build-your-own.jpg',
  'build-your-own': '/images/pizzas/build-your-own.jpg',
};

function toWebpIfLocal(path: string | undefined): string | undefined {
  if (!path) return path;
  if (path.startsWith('/images/')) {
    return path.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  return path;
}


/**
 * Get fallback image for a product based on its name
 * Works regardless of product category - finds images by product name
 * 
 * @param productName - The product name to search for
 * @param translatedName - Optional translated name to try as well
 * @returns Fallback image path or undefined if not found
 */
export function getProductFallbackImage(
  productName: string,
  translatedName?: string
): string | undefined {
  const key = productName.toLowerCase().trim();
  const translatedKey = translatedName?.toLowerCase().trim();
  
  // Try multiple variations
  const variations = [
    key,
    translatedKey,
    key.replace(/[.,]/g, ''), // Remove dots and commas
    translatedKey?.replace(/[.,]/g, ''),
    key.replace(/\s+/g, ' '), // Normalize spaces
    translatedKey?.replace(/\s+/g, ' '),
  ].filter(Boolean) as string[];
  
  // Check dessert image map first (works regardless of category - e.g., tiramisu)
  for (const variation of variations) {
    if (variation && dessertImageMap[variation]) {
      return toWebpIfLocal(dessertImageMap[variation]);
    }
  }
  
  // Check drink image map (works regardless of category)
  for (const variation of variations) {
    if (variation && drinkImageMap[variation]) {
      return toWebpIfLocal(drinkImageMap[variation]);
    }
  }
  
  // Check soup image map (works regardless of category)
  for (const variation of variations) {
    if (variation && soupImageMap[variation]) {
      return toWebpIfLocal(soupImageMap[variation]);
    }
  }
  
  // Check pizza image map (works regardless of category)
  for (const variation of variations) {
    if (variation && pizzaImageMap[variation]) {
      return toWebpIfLocal(pizzaImageMap[variation]);
    }
  }
  
  // Universal fallback for all products
  return toWebpIfLocal('/images/placeholder-pizza.webp');
}

/**
 * Get display image for a product
 * Returns product.image if available, otherwise fallback image
 * 
 * @param product - Product object with image and name
 * @param translatedName - Optional translated name for fallback lookup
 * @returns Image path to display
 */
export function getProductDisplayImage(
  product: { image?: string | null; name: string },
  translatedName?: string
): string | undefined {
  // Use product image if available and not empty
  if (product.image && product.image.trim() !== '') {
    return toWebpIfLocal(product.image);
  }
  
  // Otherwise use fallback
  return getProductFallbackImage(product.name, translatedName);
}
