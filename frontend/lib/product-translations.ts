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
  'Capri': {
    name: { sk: 'Pizza Capri', en: 'Pizza Capri' },
    description: {
      sk: 'Čerstvé paradajky, buvolia mozzarella, cherry paradajky, bazalka',
      en: 'Fresh tomatoes, buffalo mozzarella, cherry tomatoes, basil'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Fregata': {
    name: { sk: 'Pizza Fregata', en: 'Pizza Fregata' },
    description: {
      sk: 'Krevety, mušle, cesnak, biele víno',
      en: 'Shrimp, mussels, garlic, white wine'
    },
    weight: '550g',
    allergens: ['1', '3', '7']
  },
  'Gazdovská': {
    name: { sk: 'Pizza Gazdovská', en: 'Pizza Country Style' },
    description: {
      sk: 'Slanina, cibuľa, paprika, farmársky syr',
      en: 'Bacon, onions, peppers, farm cheese'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Pivárska': {
    name: { sk: 'Pizza Pivárska', en: 'Pizza Beer Lovers' },
    description: {
      sk: 'Klobása, cibuľa, horčičná omáčka',
      en: 'Sausage, onions, mustard sauce'
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
      sk: 'Talianska šunka, mozzarella, paradajkový základ, rukola',
      en: 'Italian ham, mozzarella, tomato base, arugula'
    },
    weight: '500g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi': {
    name: { sk: 'Pizza Quattro Formaggi', en: 'Pizza Quattro Formaggi' },
    description: {
      sk: 'Mozzarella, gorgonzola, parmezán, kozí syr',
      en: 'Mozzarella, gorgonzola, parmesan, goat cheese'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi Bianco': {
    name: { sk: 'Pizza Quattro Formaggi Bianco', en: 'Pizza Quattro Formaggi Bianco' },
    description: {
      sk: 'Mozzarella, gorgonzola, parmezán, kozí syr, smotanový základ',
      en: 'Mozzarella, gorgonzola, parmesan, goat cheese, cream base'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Tonno': {
    name: { sk: 'Pizza Tuniaková', en: 'Pizza Tonno' },
    description: {
      sk: 'Tuniak, červená cibuľa, kapary, olivy, mozzarella',
      en: 'Tuna, red onions, capers, olives, mozzarella'
    },
    weight: '550g',
    allergens: ['1', '4', '7']
  },
  
  // Premium Pizzas
  'Basil Pesto Premium': {
    name: { sk: 'Pizza Bazila Pesto', en: 'Pizza Basil Pesto' },
    description: {
      sk: 'Bazalkové pesto, cherry paradajky, mozzarella, parmezán',
      en: 'Basil pesto, cherry tomatoes, mozzarella, parmesan'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Bon Salami': {
    name: { sk: 'Pizza Bon Salami', en: 'Pizza Bon Salami' },
    description: {
      sk: 'Saláma, olivy, cesnak, mozzarella',
      en: 'Salami, olives, garlic, mozzarella'
    },
    weight: '500g',
    allergens: ['1', '7']
  },
  'Calimero': {
    name: { sk: 'Pizza Calimero', en: 'Pizza Calimero' },
    description: {
      sk: 'Kuracie prsia, šampiňóny, smotanový základ, mozzarella',
      en: 'Chicken breast, mushrooms, cream base, mozzarella'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Da Vinci': {
    name: { sk: 'Pizza Da Vinci', en: 'Pizza Da Vinci' },
    description: {
      sk: 'Talianska šunka, artičoky, rukola, parmezán',
      en: 'Italian ham, artichokes, arugula, parmesan'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Diavola Premium': {
    name: { sk: 'Pizza Diavola', en: 'Pizza Diavola' },
    description: {
      sk: 'Pikantná saláma, chilli, cesnak, mozzarella',
      en: 'Spicy salami, chilli, garlic, mozzarella'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Hawaii Premium': {
    name: { sk: 'Pizza Hawai', en: 'Pizza Hawaii' },
    description: {
      sk: 'Šunka, ananás, mozzarella, paradajkový základ',
      en: 'Ham, pineapple, mozzarella, tomato base'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Mayday Special': {
    name: { sk: 'Pizza Mayday', en: 'Pizza Mayday' },
    description: {
      sk: 'Špeciálna zmes mäsa, zeleniny a prémiových ingrediencií',
      en: 'Special mix of meats, vegetables and premium ingredients'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Honey Chilli': {
    name: { sk: 'Pizza Med-Chilli', en: 'Pizza Honey Chilli' },
    description: {
      sk: 'Medovo-chilli základ, kuracie prsia, mozzarella',
      en: 'Honey-chilli base, chicken breast, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Picante': {
    name: { sk: 'Pizza Picante', en: 'Pizza Picante' },
    description: {
      sk: 'Pikantná saláma, chilli, paprika, mozzarella',
      en: 'Spicy salami, chilli, peppers, mozzarella'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Pollo Crema': {
    name: { sk: 'Pizza Pollo crema', en: 'Pizza Pollo Crema' },
    description: {
      sk: 'Kuracie prsia, šampiňóny, smotanový základ, mozzarella',
      en: 'Chicken breast, mushrooms, cream base, mozzarella'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Prosciutto Crudo Premium': {
    name: { sk: 'Pizza Prosciutto Crudo', en: 'Pizza Prosciutto Crudo' },
    description: {
      sk: 'Prosciutto di Parma, burrata, cherry paradajky, rukola',
      en: 'Prosciutto di Parma, burrata, cherry tomatoes, arugula'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Prosciutto Funghi': {
    name: { sk: 'Pizza Prosciutto Funghi', en: 'Pizza Prosciutto Funghi' },
    description: {
      sk: 'Talianska šunka, zmiešané šampiňóny, truhľový olej, mozzarella',
      en: 'Italian ham, mixed mushrooms, truffle oil, mozzarella'
    },
    weight: '530g',
    allergens: ['1', '7']
  },
  'Provinciale': {
    name: { sk: 'Pizza Provinciale', en: 'Pizza Provinciale' },
    description: {
      sk: 'Brie, vlašské orechy, med, karamelizovaná cibuľa',
      en: 'Brie, walnuts, honey, caramelized onions'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Quattro Stagioni': {
    name: { sk: 'Pizza Quattro Stagioni', en: 'Pizza Quattro Stagioni' },
    description: {
      sk: 'Šunka, šampiňóny, artičoky, olivy',
      en: 'Ham, mushrooms, artichokes, olives'
    },
    weight: '550g',
    allergens: ['1', '7']
  },
  'Vegetariana Premium': {
    name: { sk: 'Pizza Vegetariana', en: 'Pizza Vegetariana' },
    description: {
      sk: 'Grilovaná zelenina, sušené paradajky, feta, olivy, pesto',
      en: 'Grilled vegetables, sun-dried tomatoes, feta, olives, pesto'
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
