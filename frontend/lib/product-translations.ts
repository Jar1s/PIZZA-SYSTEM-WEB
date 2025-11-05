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
  // Classic Pizzas
  'Margherita': {
    name: { sk: 'Margherita', en: 'Margherita' },
    description: {
      sk: 'Paradajkový základ, mozzarella',
      en: 'Tomato base, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Capri': {
    name: { sk: 'Capri', en: 'Capri' },
    description: {
      sk: 'Čerstvé paradajky, buvolia mozzarella, cherry paradajky, bazalka',
      en: 'Fresh tomatoes, buffalo mozzarella, cherry tomatoes, basil'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Fregata': {
    name: { sk: 'Fregata', en: 'Fregata' },
    description: {
      sk: 'Krevety, mušle, cesnak, biele víno',
      en: 'Shrimp, mussels, garlic, white wine'
    },
    weight: '450g',
    allergens: ['1', '7', '10']
  },
  'Gazdovská': {
    name: { sk: 'Gazdovská', en: 'Country Style' },
    description: {
      sk: 'Slanina, cibuľa, paprika, farmársky syr',
      en: 'Bacon, onions, peppers, farm cheese'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Pivárska': {
    name: { sk: 'Pivárska', en: 'Beer Lovers' },
    description: {
      sk: 'Klobása, cibuľa, horčičná omáčka',
      en: 'Sausage, onions, mustard sauce'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Korpus': {
    name: { sk: 'Korpus', en: 'Meat Feast' },
    description: {
      sk: 'Slanina, šunka, klobása, pepperoni',
      en: 'Bacon, ham, sausage, pepperoni'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Prosciutto': {
    name: { sk: 'Prosciutto', en: 'Prosciutto' },
    description: {
      sk: 'Talianska šunka, mozzarella, paradajkový základ, rukola',
      en: 'Italian ham, mozzarella, tomato base, arugula'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi': {
    name: { sk: 'Quattro Formaggi', en: 'Quattro Formaggi' },
    description: {
      sk: 'Mozzarella, gorgonzola, parmezán, kozí syr',
      en: 'Mozzarella, gorgonzola, parmesan, goat cheese'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi Bianco': {
    name: { sk: 'Quattro Formaggi Bianco', en: 'Quattro Formaggi Bianco' },
    description: {
      sk: 'Mozzarella, gorgonzola, parmezán, kozí syr, smotanový základ',
      en: 'Mozzarella, gorgonzola, parmesan, goat cheese, cream base'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Tonno': {
    name: { sk: 'Tonno', en: 'Tonno' },
    description: {
      sk: 'Tuniak, červená cibuľa, kapary, olivy, mozzarella',
      en: 'Tuna, red onions, capers, olives, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7', '10']
  },
  
  // Premium Pizzas
  'Basil Pesto Premium': {
    name: { sk: 'Basil Pesto Premium', en: 'Basil Pesto Premium' },
    description: {
      sk: 'Bazalkové pesto, cherry paradajky, mozzarella, parmezán',
      en: 'Basil pesto, cherry tomatoes, mozzarella, parmesan'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Bon Salami': {
    name: { sk: 'Bon Salami', en: 'Bon Salami' },
    description: {
      sk: 'Saláma, olivy, cesnak, mozzarella',
      en: 'Salami, olives, garlic, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Calimero': {
    name: { sk: 'Calimero', en: 'Calimero' },
    description: {
      sk: 'Kuracie prsia, šampiňóny, smotanový základ, mozzarella',
      en: 'Chicken breast, mushrooms, cream base, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Da Vinci': {
    name: { sk: 'Da Vinci', en: 'Da Vinci' },
    description: {
      sk: 'Talianska šunka, artičoky, rukola, parmezán',
      en: 'Italian ham, artichokes, arugula, parmesan'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Diavola Premium': {
    name: { sk: 'Diavola Premium', en: 'Diavola Premium' },
    description: {
      sk: 'Pikantná saláma, chilli, cesnak, mozzarella',
      en: 'Spicy salami, chilli, garlic, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Hawaii Premium': {
    name: { sk: 'Hawaii Premium', en: 'Hawaii Premium' },
    description: {
      sk: 'Šunka, ananás, mozzarella, paradajkový základ',
      en: 'Ham, pineapple, mozzarella, tomato base'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Mayday Special': {
    name: { sk: 'Mayday Special', en: 'Mayday Special' },
    description: {
      sk: 'Špeciálna zmes mäsa, zeleniny a prémiových ingrediencií',
      en: 'Special mix of meats, vegetables and premium ingredients'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Honey Chilli': {
    name: { sk: 'Med-Chilli', en: 'Honey Chilli' },
    description: {
      sk: 'Medovo-chilli základ, kuracie prsia, mozzarella',
      en: 'Honey-chilli base, chicken breast, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Picante': {
    name: { sk: 'Picante', en: 'Picante' },
    description: {
      sk: 'Pikantná saláma, chilli, paprika, mozzarella',
      en: 'Spicy salami, chilli, peppers, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Pollo Crema': {
    name: { sk: 'Pollo Crema', en: 'Pollo Crema' },
    description: {
      sk: 'Kuracie prsia, šampiňóny, smotanový základ, mozzarella',
      en: 'Chicken breast, mushrooms, cream base, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Prosciutto Crudo Premium': {
    name: { sk: 'Prosciutto Crudo Premium', en: 'Prosciutto Crudo Premium' },
    description: {
      sk: 'Prosciutto di Parma, burrata, cherry paradajky, rukola',
      en: 'Prosciutto di Parma, burrata, cherry tomatoes, arugula'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Prosciutto Funghi': {
    name: { sk: 'Prosciutto Funghi', en: 'Prosciutto Funghi' },
    description: {
      sk: 'Talianska šunka, zmiešané šampiňóny, truhľový olej, mozzarella',
      en: 'Italian ham, mixed mushrooms, truffle oil, mozzarella'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Provinciale': {
    name: { sk: 'Provinciale', en: 'Provinciale' },
    description: {
      sk: 'Brie, vlašské orechy, med, karamelizovaná cibuľa',
      en: 'Brie, walnuts, honey, caramelized onions'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Quattro Stagioni': {
    name: { sk: 'Quattro Stagioni', en: 'Quattro Stagioni' },
    description: {
      sk: 'Šunka, šampiňóny, artičoky, olivy',
      en: 'Ham, mushrooms, artichokes, olives'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Vegetariana Premium': {
    name: { sk: 'Vegetariana Premium', en: 'Vegetariana Premium' },
    description: {
      sk: 'Grilovaná zelenina, sušené paradajky, feta, olivy, pesto',
      en: 'Grilled vegetables, sun-dried tomatoes, feta, olives, pesto'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  
  // Štangle & Posúch
  'Pizza Štangle': {
    name: { sk: 'Pizza Štangle', en: 'Breadsticks' },
    description: {
      sk: 'Tradičné štangle s cesnakom a bylinkami',
      en: 'Traditional breadsticks with garlic and herbs'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  'Pizza Štangle bezlepkové': {
    name: { sk: 'Pizza Štangle bezlepkové', en: 'Gluten-free Breadsticks' },
    description: {
      sk: 'Bezlepkové štangle s cesnakom a bylinkami',
      en: 'Gluten-free breadsticks with garlic and herbs'
    },
    weight: '200g',
    allergens: ['7']
  },
  'Pizza Posúch': {
    name: { sk: 'Pizza Posúch', en: 'Garlic Bread' },
    description: {
      sk: 'Tradiční posúch s cesnakom a bylinkami',
      en: 'Traditional garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  'Pizza Posúch bezlepkový': {
    name: { sk: 'Pizza Posúch bezlepkový', en: 'Gluten-free Garlic Bread' },
    description: {
      sk: 'Bezlepkový posúch s cesnakom a bylinkami',
      en: 'Gluten-free garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['7']
  },
  'Pizza Posúch / Korpus': {
    name: { sk: 'Pizza Posúch', en: 'Garlic Bread' },
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
  
  // Drinks
  'Coca Cola': {
    name: { sk: 'Coca Cola', en: 'Coca Cola' },
    description: { sk: '0.5L', en: '0.5L' },
    weight: '0.5L',
    allergens: []
  },
  'Fanta': {
    name: { sk: 'Fanta', en: 'Fanta' },
    description: { sk: '0.5L', en: '0.5L' },
    weight: '0.5L',
    allergens: []
  },
  'Sprite': {
    name: { sk: 'Sprite', en: 'Sprite' },
    description: { sk: '0.5L', en: '0.5L' },
    weight: '0.5L',
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
    name: { sk: 'Voda', en: 'Water' },
    description: { sk: '0.5L', en: '0.5L' },
    weight: '0.5L',
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
