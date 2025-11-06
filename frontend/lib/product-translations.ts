// Product translations for Slovak and English
// Maps product names to their translations
// Based on Mayday Pizza Bratislava menu: https://maydaypizzaba.sk/section:menu/pizza

export interface ProductTranslation {
  name: {
    sk: string;
    en: string;
  };
  description: {
    sk: string;
    en: string;
  };
  weight?: string; // e.g., "450g"
  allergens?: string[]; // e.g., ["1", "7"]
}

export const productTranslations: Record<string, ProductTranslation> = {
  // Classic Pizzas - Presné informácie z Mayday Pizza
  'Margherita': {
    name: { sk: 'Pizza Margherita', en: 'Pizza Margherita' },
    description: {
      sk: 'Paradajkový základ, mozzarella',
      en: 'Tomato base, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Margharita': {
    name: { sk: 'Pizza Margharita', en: 'Pizza Margharita' },
    description: {
      sk: 'Paradajkový základ, mozzarella',
      en: 'Tomato base, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Capri': {
    name: { sk: 'Pizza Capri', en: 'Pizza Capri' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, kukurica, šampiňóny',
      en: 'Tomato base, mozzarella, ham, corn, mushrooms'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Fregata': {
    name: { sk: 'Pizza Fregata', en: 'Pizza Fregata' },
    description: {
      sk: 'Paradajkový základ, mozzarella, niva, šampiňóny, cibuľa, olivy, vajce',
      en: 'Tomato base, mozzarella, blue cheese, mushrooms, onion, olives, egg'
    },
    weight: '550g',
    allergens: ['1', '3', '7'] // lepok, vajíčka, mlieko
  },
  'Gazdovská': {
    name: { sk: 'Pizza Gazdovská', en: 'Pizza Country Style' },
    description: {
      sk: 'Paradajkový základ, mozzarella, slanina, cibuľa, šampiňóny, saláma',
      en: 'Tomato base, mozzarella, bacon, onion, mushrooms, salami'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Pivárska': {
    name: { sk: 'Pizza Pivárska', en: 'Pizza Beer Lovers' },
    description: {
      sk: 'Paradajkový základ, mozzarella, saláma, slanina, klobása, cibuľa, niva',
      en: 'Tomato base, mozzarella, salami, bacon, sausage, onion, blue cheese'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Korpus': {
    name: { sk: 'Pizza Korpus', en: 'Pizza Meat Feast' },
    description: {
      sk: 'Slanina, šunka, klobása, pepperoni',
      en: 'Bacon, ham, sausage, pepperoni'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Prosciutto': {
    name: { sk: 'Pizza Prosciutto', en: 'Pizza Prosciutto' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka',
      en: 'Tomato base, mozzarella, ham'
    },
    weight: '500g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi': {
    name: { sk: 'Pizza Quattro Formaggi', en: 'Pizza Quattro Formaggi' },
    description: {
      sk: 'Paradajkový základ, mozzarella, údený syr, niva, parmezán',
      en: 'Tomato base, mozzarella, smoked cheese, blue cheese, parmesan'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi Bianco': {
    name: { sk: 'Pizza Quattro Formaggi Bianco', en: 'Pizza Quattro Formaggi Bianco' },
    description: {
      sk: 'Smetanový základ, mozzarella, údený syr, niva, parmezán',
      en: 'Cream base, mozzarella, smoked cheese, blue cheese, parmesan'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Tonno': {
    name: { sk: 'Pizza Tuniaková', en: 'Pizza Tonno' },
    description: {
      sk: 'Paradajkový základ, mozzarella, tuniak, cibuľa',
      en: 'Tomato base, mozzarella, tuna, onion'
    },
    weight: '550g',
    allergens: ['1', '4', '7']
  },
  
  // Premium Pizzas
  'Basil Pesto Premium': {
    name: { sk: 'Pizza Bazila Pesto', en: 'Pizza Basil Pesto' },
    description: {
      sk: 'Paradajkový základ, mozzarella, bazalkové pesto, šunka, ricotta, paradajky, parmezán',
      en: 'Tomato base, mozzarella, basil pesto, ham, ricotta, tomatoes, parmesan'
    },
    weight: '450g',
    allergens: ['1', '7', '8'] // lepok, mlieko, orechy
  },
  'Bon Salami': {
    name: { sk: 'Pizza Bon Salami', en: 'Pizza Bon Salami' },
    description: {
      sk: 'Paradajkový základ, mozzarella, saláma',
      en: 'Tomato base, mozzarella, salami'
    },
    weight: '500g',
    allergens: ['1', '7']
  },
  'Calimero': {
    name: { sk: 'Pizza Calimero', en: 'Pizza Calimero' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, kukurica',
      en: 'Tomato base, mozzarella, ham, corn'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Da Vinci': {
    name: { sk: 'Pizza Da Vinci', en: 'Pizza Da Vinci' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, slanina, niva, olivy',
      en: 'Tomato base, mozzarella, ham, bacon, blue cheese, olives'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Diavola Premium': {
    name: { sk: 'Pizza Diavola', en: 'Pizza Diavola' },
    description: {
      sk: 'Paradajkový základ, chilli, mozzarella, pikantná saláma, baranie rohy, jalapenos',
      en: 'Tomato base, chilli, mozzarella, spicy salami, pickled peppers, jalapeños'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Hawaii Premium': {
    name: { sk: 'Pizza Hawai', en: 'Pizza Hawaii' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, ananás',
      en: 'Tomato base, mozzarella, ham, pineapple'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Mayday Special': {
    name: { sk: 'Pizza Mayday', en: 'Pizza Mayday' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, slanina, kukurica, vajce',
      en: 'Tomato base, mozzarella, ham, bacon, corn, egg'
    },
    weight: '550g',
    allergens: ['1', '7', '3'] // lepok, mlieko, vajce
  },
  'Honey Chilli': {
    name: { sk: 'Pizza Med-Chilli', en: 'Pizza Honey Chilli' },
    description: {
      sk: 'Paradajkový základ, chilli, mozzarella, med, kur.prsia, ananás, oregáno',
      en: 'Tomato base, chilli, mozzarella, honey, chicken breast, pineapple, oregano'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Picante': {
    name: { sk: 'Pizza Picante', en: 'Pizza Picante' },
    description: {
      sk: 'Paradajkový základ, mozzarella, pikantná saláma, jalapenos',
      en: 'Tomato base, mozzarella, spicy salami, jalapeños'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Pollo Crema': {
    name: { sk: 'Pizza Pollo crema', en: 'Pizza Pollo Crema' },
    description: {
      sk: 'Smetanový základ, mozzarella, kur.prsia, niva, kukurica, brokolica',
      en: 'Cream base, mozzarella, chicken breast, blue cheese, corn, broccoli'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Prosciutto Crudo Premium': {
    name: { sk: 'Pizza Prosciutto Crudo', en: 'Pizza Prosciutto Crudo' },
    description: {
      sk: 'Paradajkový základ, mozzarella, prosciutto crudo, cherry paradajky, rukola, parmezán',
      en: 'Tomato base, mozzarella, prosciutto crudo, cherry tomatoes, arugula, parmesan'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Prosciutto Funghi': {
    name: { sk: 'Pizza Prosciutto Funghi', en: 'Pizza Prosciutto Funghi' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, šampiňóny',
      en: 'Tomato base, mozzarella, ham, mushrooms'
    },
    weight: '530g',
    allergens: ['1', '7']
  },
  'Provinciale': {
    name: { sk: 'Pizza Provinciale', en: 'Pizza Provinciale' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, slanina, kukurica, baranie rohy',
      en: 'Tomato base, mozzarella, ham, bacon, corn, pickled peppers'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Quattro Stagioni': {
    name: { sk: 'Pizza Quattro Stagioni', en: 'Pizza Quattro Stagioni' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, šampiňóny, olivy, artičoky',
      en: 'Tomato base, mozzarella, ham, mushrooms, olives, artichokes'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Vegetariana Premium': {
    name: { sk: 'Pizza Vegetariana', en: 'Pizza Vegetariana' },
    description: {
      sk: 'Paradajkový základ, mozzarella, brokolica, kukurica, šampiňóny, baby špenát',
      en: 'Tomato base, mozzarella, broccoli, corn, mushrooms, baby spinach'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  
  // Štangle & Posúch
  'Pizza Štangle': {
    name: { sk: 'Pizza štangle', en: 'Breadsticks' },
    description: {
      sk: 'Tradičné štangle s cesnakom a bylinkami',
      en: 'Traditional breadsticks with garlic and herbs'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  'Pizza Štangle bezlepkové': {
    name: { sk: 'Pizza štangle bezlepkové', en: 'Gluten-free Breadsticks' },
    description: {
      sk: 'Bezlepkové štangle s cesnakom a bylinkami',
      en: 'Gluten-free breadsticks with garlic and herbs'
    },
    weight: '200g',
    allergens: ['7']
  },
  'Pizza Posúch': {
    name: { sk: 'Pizza posúch', en: 'Garlic Bread' },
    description: {
      sk: 'Tradiční posúch s cesnakom a bylinkami',
      en: 'Traditional garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  'Pizza Posúch bezlepkový': {
    name: { sk: 'Pizza posúch bezlepkový', en: 'Gluten-free Garlic Bread' },
    description: {
      sk: 'Bezlepkový posúch s cesnakom a bylinkami',
      en: 'Gluten-free garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['7']
  },
  'Pizza Posúch / Korpus': {
    name: { sk: 'Pizza posúch', en: 'Garlic Bread' },
    description: {
      sk: 'Tradiční posúch s cesnakom a bylinkami',
      en: 'Traditional garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  
  // Soups
  'Tomato Soup': {
    name: { sk: 'Paradajková polievka', en: 'Tomato Soup' },
    description: {
      sk: 'Klasická paradajková polievka s bazalkou',
      en: 'Classic tomato soup with basil'
    },
    weight: '300ml',
    allergens: ['1', '7']
  },
  
  // Drinks - Based on Mayday Pizza menu
  'Coca Cola': {
    name: { sk: 'Coca Cola 1l', en: 'Coca Cola 1l' },
    description: { sk: '1l', en: '1l' },
    weight: '1l',
    allergens: []
  },
  'Fanta': {
    name: { sk: 'Fanta 1l', en: 'Fanta 1l' },
    description: { sk: '1l', en: '1l' },
    weight: '1l',
    allergens: []
  },
  'Sprite': {
    name: { sk: 'Sprite 1l', en: 'Sprite 1l' },
    description: { sk: '1l', en: '1l' },
    weight: '1l',
    allergens: []
  },
  'Beer': {
    name: { sk: 'Pivo', en: 'Beer' },
    description: { sk: '0.5L', en: '0.5L' },
    weight: '0.5L',
    allergens: []
  },
  'Wine': {
    name: { sk: 'Víno', en: 'Wine' },
    description: { sk: '0.2L', en: '0.2L' },
    weight: '0.2L',
    allergens: []
  },
  'Water': {
    name: { sk: 'Bonaqua Nesýtená 1,5l', en: 'Bonaqua Still 1.5l' },
    description: { sk: '1.5l', en: '1.5l' },
    weight: '1.5l',
    allergens: []
  },
  
  // Desserts
  'Tiramisu': {
    name: { sk: 'Tiramisu', en: 'Tiramisu' },
    description: {
      sk: 'Klasický taliansky dezert s kávou a kakaom',
      en: 'Classic Italian dessert with coffee and cocoa'
    },
    weight: '150g',
    allergens: ['1', '3', '7']
  },
};

/**
 * Allergen descriptions
 */
export const allergenDescriptions: Record<string, { sk: string; en: string }> = {
  '1': { sk: 'Obilniny obsahujúce lepok', en: 'Cereals containing gluten' },
  '3': { sk: 'Vajcia', en: 'Eggs' },
  '4': { sk: 'Ryby', en: 'Fish' },
  '7': { sk: 'Mlieko', en: 'Milk' },
  '10': { sk: 'Ryby a výrobky z rýb', en: 'Fish and fish products' },
};

/**
 * Get allergen description
 */
export function getAllergenDescription(allergenCode: string, language: 'sk' | 'en'): string {
  return allergenDescriptions[allergenCode]?.[language] || allergenCode;
}

/**
 * Get translated product name and description
 */
export function getProductTranslation(productName: string, language: 'sk' | 'en') {
  const translation = productTranslations[productName];
  
  if (translation) {
    return {
      name: translation.name[language],
      description: translation.description[language],
      weight: translation.weight,
      allergens: translation.allergens,
    };
  }
  
  // Fallback to original if no translation found
  return {
    name: productName,
    description: '',
    weight: undefined,
    allergens: undefined,
  };
}
