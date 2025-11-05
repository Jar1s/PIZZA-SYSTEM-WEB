// Product translations for Slovak and English
// Maps product names to their translations

export interface ProductTranslation {
  name: {
    sk: string;
    en: string;
  };
  description: {
    sk: string;
    en: string;
  };
}

export const productTranslations: Record<string, ProductTranslation> = {
  // Classic Pizzas
  'Margherita': {
    name: { sk: 'Margherita', en: 'Margherita' },
    description: {
      sk: 'Klasický paradajkový základ, mozzarella, čerstvá bazalka, olivový olej',
      en: 'Classic tomato sauce, mozzarella, fresh basil, olive oil'
    }
  },
  'Capri': {
    name: { sk: 'Capri', en: 'Capri' },
    description: {
      sk: 'Čerstvé paradajky, buvolia mozzarella, cherry paradajky, bazalka',
      en: 'Fresh tomatoes, buffalo mozzarella, cherry tomatoes, basil'
    }
  },
  'Fregata': {
    name: { sk: 'Fregata', en: 'Fregata' },
    description: {
      sk: 'Morské špeciality s krevety, mušľami, cesnakom, bielym vínom',
      en: 'Seafood special with shrimp, mussels, garlic, white wine sauce'
    }
  },
  'Gazdovská': {
    name: { sk: 'Gazdovská', en: 'Country Style' },
    description: {
      sk: 'Vidiecky štýl so slaninou, cibuľou, paprikou, farmárskym syrom',
      en: 'Country style with bacon, onions, peppers, farm cheese'
    }
  },
  'Pivárska': {
    name: { sk: 'Pivárska', en: 'Beer Lovers' },
    description: {
      sk: 'Špeciál pre milovníkov piva s klobásou, cibuľou, horčičnou omáčkou',
      en: 'Beer lovers special with sausage, onions, mustard sauce'
    }
  },
  'Korpus': {
    name: { sk: 'Korpus', en: 'Meat Feast' },
    description: {
      sk: 'Výdatná zmes mäsa, slanina, šunka, klobása, pepperoni',
      en: 'Hearty mix of meats, bacon, ham, sausage, pepperoni'
    }
  },
  'Prosciutto': {
    name: { sk: 'Prosciutto', en: 'Prosciutto' },
    description: {
      sk: 'Talianska šunka, mozzarella, paradajková omáčka, rukola',
      en: 'Italian ham, mozzarella, tomato sauce, arugula'
    }
  },
  'Quattro Formaggi': {
    name: { sk: 'Quattro Formaggi', en: 'Quattro Formaggi' },
    description: {
      sk: 'Štyri druhy syra: mozzarella, gorgonzola, parmezán, kozí syr',
      en: 'Four cheese blend: mozzarella, gorgonzola, parmesan, goat cheese'
    }
  },
  'Quattro Formaggi Bianco': {
    name: { sk: 'Quattro Formaggi Bianco', en: 'Quattro Formaggi Bianco' },
    description: {
      sk: 'Biela pizza so štyrmi druhmi prémiového syra a smotanovou omáčkou',
      en: 'White pizza with four premium cheeses and cream base'
    }
  },
  'Tonno': {
    name: { sk: 'Tonno', en: 'Tonno' },
    description: {
      sk: 'Tuniak, červená cibuľa, kapary, olivy, mozzarella, paradajková omáčka',
      en: 'Tuna, red onions, capers, olives, mozzarella, tomato sauce'
    }
  },
  
  // Premium Pizzas
  'Basil Pesto Premium': {
    name: { sk: 'Basil Pesto Premium', en: 'Basil Pesto Premium' },
    description: {
      sk: 'Čerstvé bazalkové pesto, cherry paradajky, mozzarella, parmezán',
      en: 'Fresh basil pesto, cherry tomatoes, mozzarella, parmesan'
    }
  },
  'Bon Salami': {
    name: { sk: 'Bon Salami', en: 'Bon Salami' },
    description: {
      sk: 'Prémiová saláma, olivy, cesnak, mozzarella',
      en: 'Premium salami, olives, garlic, mozzarella'
    }
  },
  'Calimero': {
    name: { sk: 'Calimero', en: 'Calimero' },
    description: {
      sk: 'Kuracie prsia, šampiňóny, smotanová omáčka, mozzarella',
      en: 'Chicken breast, mushrooms, cream sauce, mozzarella'
    }
  },
  'Da Vinci': {
    name: { sk: 'Da Vinci', en: 'Da Vinci' },
    description: {
      sk: 'Talianska šunka, artičoky, rukola, parmezán',
      en: 'Italian ham, artichokes, arugula, parmesan'
    }
  },
  'Diavola Premium': {
    name: { sk: 'Diavola Premium', en: 'Diavola Premium' },
    description: {
      sk: 'Pikantná saláma, chilli, cesnak, mozzarella',
      en: 'Spicy salami, chilli, garlic, mozzarella'
    }
  },
  'Hawaii Premium': {
    name: { sk: 'Hawaii Premium', en: 'Hawaii Premium' },
    description: {
      sk: 'Šunka, ananás, mozzarella, paradajková omáčka',
      en: 'Ham, pineapple, mozzarella, tomato sauce'
    }
  },
  'Mayday Special': {
    name: { sk: 'Mayday Special', en: 'Mayday Special' },
    description: {
      sk: 'Špeciálna zmes mäsa, zeleniny a prémiových ingrediencií',
      en: 'Special mix of meats, vegetables and premium ingredients'
    }
  },
  'Honey Chilli': {
    name: { sk: 'Med-Chilli', en: 'Honey Chilli' },
    description: {
      sk: 'Medovo-chilli kombinácia, kuracie prsia, mozzarella',
      en: 'Honey-chilli combination, chicken breast, mozzarella'
    }
  },
  'Picante': {
    name: { sk: 'Picante', en: 'Picante' },
    description: {
      sk: 'Pikantná pizza s chilli, paprikou, salámou',
      en: 'Spicy pizza with chilli, peppers, salami'
    }
  },
  'Pollo Crema': {
    name: { sk: 'Pollo Crema', en: 'Pollo Crema' },
    description: {
      sk: 'Kuracie prsia, smotanová omáčka, šampiňóny, mozzarella',
      en: 'Chicken breast, cream sauce, mushrooms, mozzarella'
    }
  },
  'Prosciutto Crudo Premium': {
    name: { sk: 'Prosciutto Crudo Premium', en: 'Prosciutto Crudo Premium' },
    description: {
      sk: 'Prosciutto di Parma, burrata, cherry paradajky, rukola',
      en: 'Prosciutto di Parma, burrata, cherry tomatoes, arugula'
    }
  },
  'Prosciutto Funghi': {
    name: { sk: 'Prosciutto Funghi', en: 'Prosciutto Funghi' },
    description: {
      sk: 'Talianska šunka, zmiešané šampiňóny, truhľový olej, mozzarella',
      en: 'Italian ham, mixed mushrooms, truffle oil, mozzarella'
    }
  },
  'Provinciale': {
    name: { sk: 'Provinciale', en: 'Provinciale' },
    description: {
      sk: 'Brie, vlašské orechy, med, karamelizovaná cibuľa',
      en: 'Brie, walnuts, honey, caramelized onions'
    }
  },
  'Quattro Stagioni': {
    name: { sk: 'Quattro Stagioni', en: 'Quattro Stagioni' },
    description: {
      sk: 'Rozdelené na štyri štvrtiny: šunka, šampiňóny, artičoky, olivy',
      en: 'Divided into four quarters: ham, mushrooms, artichokes, olives'
    }
  },
  'Vegetariana Premium': {
    name: { sk: 'Vegetariana Premium', en: 'Vegetariana Premium' },
    description: {
      sk: 'Grilovaná zelenina, sušené paradajky, feta, olivy, pesto',
      en: 'Grilled vegetables, sun-dried tomatoes, feta, olives, pesto'
    }
  },
  
  // Štangle & Posúch
  'Pizza Štangle': {
    name: { sk: 'Pizza Štangle', en: 'Breadsticks' },
    description: {
      sk: 'Tradičné štangle s cesnakom a bylinkami',
      en: 'Traditional breadsticks with garlic and herbs'
    }
  },
  'Pizza Štangle bezlepkové': {
    name: { sk: 'Pizza Štangle bezlepkové', en: 'Gluten-free Breadsticks' },
    description: {
      sk: 'Bezlepkové štangle s cesnakom a bylinkami',
      en: 'Gluten-free breadsticks with garlic and herbs'
    }
  },
  'Pizza Posúch': {
    name: { sk: 'Pizza Posúch', en: 'Garlic Bread' },
    description: {
      sk: 'Tradiční posúch s cesnakom a bylinkami',
      en: 'Traditional garlic bread with garlic and herbs'
    }
  },
  'Pizza Posúch bezlepkový': {
    name: { sk: 'Pizza Posúch bezlepkový', en: 'Gluten-free Garlic Bread' },
    description: {
      sk: 'Bezlepkový posúch s cesnakom a bylinkami',
      en: 'Gluten-free garlic bread with garlic and herbs'
    }
  },
  'Pizza Posúch / Korpus': {
    name: { sk: 'Pizza Posúch', en: 'Garlic Bread' },
    description: {
      sk: 'Tradiční posúch s cesnakom a bylinkami',
      en: 'Traditional garlic bread with garlic and herbs'
    }
  },
  
  // Soups
  'Tomato Soup': {
    name: { sk: 'Paradajková polievka', en: 'Tomato Soup' },
    description: {
      sk: 'Klasická paradajková polievka s bazalkou',
      en: 'Classic tomato soup with basil'
    }
  },
  
  // Drinks
  'Coca Cola': {
    name: { sk: 'Coca Cola', en: 'Coca Cola' },
    description: { sk: '0.5L', en: '0.5L' }
  },
  'Fanta': {
    name: { sk: 'Fanta', en: 'Fanta' },
    description: { sk: '0.5L', en: '0.5L' }
  },
  'Sprite': {
    name: { sk: 'Sprite', en: 'Sprite' },
    description: { sk: '0.5L', en: '0.5L' }
  },
  'Beer': {
    name: { sk: 'Pivo', en: 'Beer' },
    description: { sk: '0.5L', en: '0.5L' }
  },
  'Wine': {
    name: { sk: 'Víno', en: 'Wine' },
    description: { sk: '0.2L', en: '0.2L' }
  },
  'Water': {
    name: { sk: 'Voda', en: 'Water' },
    description: { sk: '0.5L', en: '0.5L' }
  },
  
  // Desserts
  'Tiramisu': {
    name: { sk: 'Tiramisu', en: 'Tiramisu' },
    description: {
      sk: 'Klasický taliansky dezert s kávou a kakaom',
      en: 'Classic Italian dessert with coffee and cocoa'
    }
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
    };
  }
  
  // Fallback to original if no translation found
  return {
    name: productName,
    description: '',
  };
}

