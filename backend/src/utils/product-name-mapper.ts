// Product name mapping utility for backend
// Maps database product names to display names (as shown on website)
// Based on frontend/lib/product-translations.ts

interface ProductNameMapping {
  sk: string;
  en: string;
}

// Product name mappings - maps database names to display names
const productNameMappings: Record<string, ProductNameMapping> = {
  // Build Your Own Pizza
  'Vyskladaj si vlastnú pizzu': {
    sk: 'Vyskladaj si vlastnú pizzu',
    en: 'Build Your Own Pizza',
  },
  
  // 🔥 PREDOHRA / FOREPLAY
  'Margherita': {
    sk: 'Margherita Nuda',
    en: 'Margherita Nuda',
  },
  'Margharita': {
    sk: 'Pizza Margharita',
    en: 'Pizza Margharita',
  },
  'Prosciutto': {
    sk: 'Prosciutto Tease',
    en: 'Prosciutto Tease',
  },
  'Bon Salami': {
    sk: 'Salami 69',
    en: 'Salami 69',
  },
  'Picante': {
    sk: 'Hot Fantasy',
    en: 'Hot Fantasy',
  },
  'Calimero': {
    sk: 'Calimero Love',
    en: 'Calimero Love',
  },
  'Prosciutto Funghi': {
    sk: 'Shroom Affair',
    en: 'Shroom Affair',
  },
  'Hawaii Premium': {
    sk: 'Hawai Crush',
    en: 'Hawai Crush',
  },
  'Hawaii': {
    sk: 'Hawai Crush',
    en: 'Hawai Crush',
  },
  'Hawai': {
    sk: 'Hawai Crush',
    en: 'Hawai Crush',
  },
  'Pizza Hawai': {
    sk: 'Hawai Crush',
    en: 'Hawai Crush',
  },
  'Capri': {
    sk: 'Capri Quickie',
    en: 'Capri Quickie',
  },
  'Da Vinci': {
    sk: 'Da Vinci Desire',
    en: 'Da Vinci Desire',
  },
  'Quattro Stagioni': {
    sk: 'Mixtape of Sins',
    en: 'Mixtape of Sins',
  },
  
  // 😈 MAIN ACTION / HLAVNÉ ČÍSLO
  'Mayday Special': {
    sk: 'Bacon Affair',
    en: 'Bacon Affair',
  },
  'Mayday': {
    sk: 'Mayday Affair',
    en: 'Mayday Affair',
  },
  'Gazdovská': {
    sk: 'Gazda Deluxe',
    en: 'Gazda Deluxe',
  },
  'Pivárska': {
    sk: 'Hotline Pizza',
    en: 'Hotline Pizza',
  },
  'Diavola Premium': {
    sk: 'Hot Dominant',
    en: 'Hot Dominant',
  },
  'Diavola': {
    sk: 'Hot Dominant',
    en: 'Hot Dominant',
  },
  'Provinciale': {
    sk: 'Country Affair',
    en: 'Country Affair',
  },
  
  // 💋 DELUXE FETISH
  'Fregata': {
    sk: 'Fregata Missionary',
    en: 'Fregata Missionary',
  },
  'Quattro Formaggi': {
    sk: 'Four Cheese Fetish',
    en: 'Four Cheese Fetish',
  },
  'Quattro Formaggi Bianco': {
    sk: 'White Dream',
    en: 'White Dream',
  },
  'Tonno': {
    sk: 'Tuna Affair',
    en: 'Tuna Affair',
  },
  'Tuniaková': {
    sk: 'Tuna Affair',
    en: 'Tuna Affair',
  },
  'Vegetariana': {
    sk: 'Veggie Pleasure',
    en: 'Veggie Pleasure',
  },
  'Vegetariana Premium': {
    sk: 'Veggie Pleasure',
    en: 'Veggie Pleasure',
  },
  'Hot Missionary': {
    sk: 'Hot Missionary',
    en: 'Hot Missionary',
  },
  
  // 🍑 PREMIUM SINS
  'Basil Pesto Premium': {
    sk: 'Pesto Affair',
    en: 'Pesto Affair',
  },
  'Basil Pesto': {
    sk: 'Pesto Affair',
    en: 'Pesto Affair',
  },
  'Honey Chilli': {
    sk: 'Honey Temptation',
    en: 'Honey Temptation',
  },
  'Pollo Crema': {
    sk: 'Pollo Creamy Dream',
    en: 'Pollo Creamy Dream',
  },
  'Prosciutto Crudo Premium': {
    sk: 'Crudo Affair',
    en: 'Crudo Affair',
  },
  'Prosciutto Crudo': {
    sk: 'Crudo Affair',
    en: 'Crudo Affair',
  },
  'med chilli': {
    sk: 'Honey Temptation',
    en: 'Honey Temptation',
  },
  'Med chilli': {
    sk: 'Honey Temptation',
    en: 'Honey Temptation',
  },
  'Med Chilli': {
    sk: 'Honey Temptation',
    en: 'Honey Temptation',
  },
  
  // Extra products
  'Korpus': {
    sk: 'Pizza Korpus',
    en: 'Pizza Meat Feast',
  },
  
  // Štangle & Posúch
  'Pizza štangle (4 ks)': {
    sk: 'Pizza štangle (4 ks)',
    en: 'Breadsticks (4 pcs)',
  },
  'Pizza Štangle': {
    sk: 'Pizza štangle (4 ks)',
    en: 'Breadsticks (4 pcs)',
  },
  'Bezlepkové štangle (4 ks)': {
    sk: 'Bezlepkové štangle (4 ks)',
    en: 'Gluten-free Breadsticks (4 pcs)',
  },
  'Pizza Štangle bezlepkové': {
    sk: 'Bezlepkové štangle (4 ks)',
    en: 'Gluten-free Breadsticks (4 pcs)',
  },
  'Pizza posúch': {
    sk: 'Pizza posúch',
    en: 'Garlic Bread',
  },
  'Pizza Posúch': {
    sk: 'Pizza posúch',
    en: 'Garlic Bread',
  },
  'Bezlepkový posúch': {
    sk: 'Bezlepkový posúch',
    en: 'Gluten-free Garlic Bread',
  },
  'Pizza Posúch bezlepkový': {
    sk: 'Bezlepkový posúch',
    en: 'Gluten-free Garlic Bread',
  },
  'Pizza Posúch / Korpus': {
    sk: 'Pizza posúch',
    en: 'Garlic Bread',
  },
  
  // Soups
  'Tomato Soup': {
    sk: 'Paradajková polievka',
    en: 'Tomato Soup',
  },
  'Paradajková polievka': {
    sk: 'Paradajková polievka',
    en: 'Tomato Soup',
  },
  'Paradajkova polievka': {
    sk: 'Paradajková polievka',
    en: 'Tomato Soup',
  },
  
  // Drinks
  'Coca Cola': {
    sk: 'Coca Cola',
    en: 'Coca Cola',
  },
  'Coca Cola 1l': {
    sk: 'Coca Cola',
    en: 'Coca Cola',
  },
  'Cola Zero 1l': {
    sk: 'Cola Zero',
    en: 'Cola Zero',
  },
  'Fanta': {
    sk: 'Fanta',
    en: 'Fanta',
  },
  'Fanta 1l': {
    sk: 'Fanta',
    en: 'Fanta',
  },
  'Sprite': {
    sk: 'Sprite',
    en: 'Sprite',
  },
  'Sprite 1l': {
    sk: 'Sprite',
    en: 'Sprite',
  },
  'Pepsi 1l': {
    sk: 'Pepsi',
    en: 'Pepsi',
  },
  'Pepsi Zero 1l': {
    sk: 'Pepsi Zero',
    en: 'Pepsi Zero',
  },
  'Kofola 2l': {
    sk: 'Kofola',
    en: 'Kofola',
  },
  'Bonaqua Nesýtená 1,5l': {
    sk: 'Bonaqua Nesýtená',
    en: 'Bonaqua Still',
  },
  'Bonaqua Sýtená 1,5l': {
    sk: 'Bonaqua Sýtená',
    en: 'Bonaqua Sparkling',
  },
  'Beer': {
    sk: 'Pivo',
    en: 'Beer',
  },
  'Wine': {
    sk: 'Víno',
    en: 'Wine',
  },
  'Water': {
    sk: 'Bonaqua Nesýtená 1,5l',
    en: 'Bonaqua Still 1.5l',
  },
  
  // Desserts
  'Tiramisu': {
    sk: 'Tiramisu',
    en: 'Tiramisu',
  },
};

/**
 * Normalize product name for matching (remove diacritics, lowercase, trim)
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

/**
 * Get mapped product display name
 * Maps database product names to display names as shown on website
 * 
 * @param productName - The product name from database (e.g., "Fregata", "Pizza Fregata")
 * @param language - Language for the display name ('sk' | 'en'), defaults to 'sk'
 * @returns The mapped display name (e.g., "Fregata Missionary") or original name if no mapping found
 */
export function getProductDisplayName(
  productName: string,
  language: 'sk' | 'en' = 'sk',
): string {
  if (!productName) {
    return productName;
  }

  // First try exact match
  let mapping = productNameMappings[productName];
  
  // If not found, try case-insensitive match
  if (!mapping) {
    const normalizedInput = normalizeProductName(productName);
    for (const [key, value] of Object.entries(productNameMappings)) {
      if (normalizeProductName(key) === normalizedInput) {
        mapping = value;
        break;
      }
    }
  }
  
  // Also try removing "Pizza " prefix if present
  if (!mapping && productName.startsWith('Pizza ')) {
    const nameWithoutPizza = productName.substring(6); // Remove "Pizza "
    mapping = productNameMappings[nameWithoutPizza];
    
    // Try normalized match for name without prefix
    if (!mapping) {
      const normalizedInput = normalizeProductName(nameWithoutPizza);
      for (const [key, value] of Object.entries(productNameMappings)) {
        if (normalizeProductName(key) === normalizedInput) {
          mapping = value;
          break;
        }
      }
    }
  }
  
  // Return mapped name if found, otherwise return original
  if (mapping) {
    return mapping[language];
  }
  
  return productName;
}
