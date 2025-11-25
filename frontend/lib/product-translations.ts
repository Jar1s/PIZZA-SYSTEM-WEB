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
  // Build Your Own Pizza
  'Vyskladaj si vlastnú pizzu': {
    name: { sk: 'Vyskladaj si vlastnú pizzu', en: 'Build Your Own Pizza' },
    description: {
      sk: 'Vytvor si vlastnú pizzu podľa svojich predstáv. Vyber si cesto, syr, základ a prílohy.',
      en: 'Create your own pizza according to your preferences. Choose dough, cheese, base sauce and toppings.'
    },
    weight: '450g',
    allergens: ['1', '7'] // Depends on selections
  },
  
  // 🔥 PREDOHRA / FOREPLAY
  'Margherita': {
    name: { sk: 'Margherita Nuda', en: 'Margherita Nuda' },
    description: {
      sk: 'Paradajkový základ, mozzarella – základ každého potešenia.',
      en: 'Tomato base, mozzarella – the foundation of every pleasure.'
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
  'Prosciutto': {
    name: { sk: 'Prosciutto Tease', en: 'Prosciutto Tease' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka – jemne vyzývavá.',
      en: 'Tomato base, mozzarella, ham – gently provocative.'
    },
    weight: '500g',
    allergens: ['1', '7']
  },
  'Bon Salami': {
    name: { sk: 'Salami 69', en: 'Salami 69' },
    description: {
      sk: 'Paradajkový základ, mozzarella, saláma – spicy in all the right places.',
      en: 'Tomato base, mozzarella, salami – spicy in all the right places.'
    },
    weight: '500g',
    allergens: ['1', '7']
  },
  'Picante': {
    name: { sk: 'Hot Fantasy', en: 'Hot Fantasy' },
    description: {
      sk: 'Paradajkový základ, mozzarella, feferóny, pikantná saláma – horúce spojenie.',
      en: 'Tomato base, mozzarella, peppers, spicy salami – hot connection.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Calimero': {
    name: { sk: 'Calimero Love', en: 'Calimero Love' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, vajce – rýchle, ale stojí za to.',
      en: 'Tomato base, mozzarella, ham, egg – quick, but worth it.'
    },
    weight: '520g',
    allergens: ['1', '3', '7']
  },
  'Prosciutto Funghi': {
    name: { sk: 'Shroom Affair', en: 'Shroom Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, šampiňóny – jemne zakázaná kombinácia, čo prekvapí každým sústom.',
      en: 'Tomato base, mozzarella, ham, mushrooms – gently forbidden combination that surprises with every bite.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Hawaii Premium': {
    name: { sk: 'Hawai Crush', en: 'Hawai Crush' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, ananás – tropický flirt.',
      en: 'Tomato base, mozzarella, ham, pineapple – tropical flirt.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Capri': {
    name: { sk: 'Capri Quickie', en: 'Capri Quickie' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, kukurica – sladká nevinnosť.',
      en: 'Tomato base, mozzarella, ham, corn – sweet innocence.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Da Vinci': {
    name: { sk: 'Da Vinci Desire', en: 'Da Vinci Desire' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, šampiňóny, kukurica.',
      en: 'Tomato base, mozzarella, ham, mushrooms, corn.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Quattro Stagioni': {
    name: { sk: 'Mixtape of Sins', en: 'Mixtape of Sins' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, šampiňóny, olivy, artičoky – všetko, čo by si nemal… ale chceš.',
      en: 'Tomato base, mozzarella, ham, mushrooms, olives, artichokes – everything you shouldn\'t have… but want.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  // 😈 MAIN ACTION / HLAVNÉ ČÍSLO
  'Mayday Special': {
    name: { sk: 'Bacon Affair', en: 'Bacon Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, slanina, vajce, cibuľa - guilty pleasure, čo nikdy nesklame.',
      en: 'Tomato base, mozzarella, ham, bacon, egg, onion - guilty pleasure that never fails.'
    },
    weight: '520g',
    allergens: ['1', '3', '7']
  },
  'Mayday': {
    name: { sk: 'Mayday Affair', en: 'Mayday Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, slanina, vajce, cibuľa - guilty pleasure, čo nikdy nesklame.',
      en: 'Tomato base, mozzarella, ham, bacon, egg, onion - guilty pleasure that never fails.'
    },
    weight: '520g',
    allergens: ['1', '3', '7']
  },
  'Gazdovská': {
    name: { sk: 'Gazda Deluxe', en: 'Gazda Deluxe' },
    description: {
      sk: 'Paradajkový základ, mozzarella, klobása, slanina, cibuľa - poriadna sila, keď potrebuješ viac.',
      en: 'Tomato base, mozzarella, sausage, bacon, onion - real power when you need more.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Pivárska': {
    name: { sk: 'Hotline Pizza', en: 'Hotline Pizza' },
    description: {
      sk: 'Paradajkový základ, mozzarella, saláma, slanina, klobása, cibuľa, niva',
      en: 'Tomato base, mozzarella, salami, bacon, sausage, onion, blue cheese'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  'Diavola Premium': {
    name: { sk: 'Hot Dominant', en: 'Hot Dominant' },
    description: {
      sk: 'Paradajkový základ, mozzarella, pikantná saláma, feferóny – trochu bolí, ale chceš viac.',
      en: 'Tomato base, mozzarella, spicy salami, peppers – it hurts a bit, but you want more.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Diavola': {
    name: { sk: 'Hot Dominant', en: 'Hot Dominant' },
    description: {
      sk: 'Paradajkový základ, mozzarella, pikantná saláma, feferóny – trochu bolí, ale chceš viac.',
      en: 'Tomato base, mozzarella, spicy salami, peppers – it hurts a bit, but you want more.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Provinciale': {
    name: { sk: 'Country Affair', en: 'Country Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, slanina, kukurica – jednoduché, ale maximálne uspokojivé.',
      en: 'Tomato base, mozzarella, ham, bacon, corn – simple, but maximally satisfying.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  
  // 💋 DELUXE FETISH
  'Fregata': {
    name: { sk: 'Fregata Missionary', en: 'Fregata Missionary' },
    description: {
      sk: 'Paradajkový základ, mozzarella, niva, šampiňóny, cibuľa, olivy, vajce',
      en: 'Tomato base, mozzarella, blue cheese, mushrooms, onion, olives, egg'
    },
    weight: '550g',
    allergens: ['1', '3', '7'] // lepok, vajíčka, mlieko
  },
  'Quattro Formaggi': {
    name: { sk: 'Four Cheese Fetish', en: 'Four Cheese Fetish' },
    description: {
      sk: 'Paradajkový základ, mozzarella, niva, eidam, parmezán – nebezpečne sýrové pokušenie.',
      en: 'Tomato base, mozzarella, blue cheese, edam, parmesan – dangerously cheesy temptation.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Quattro Formaggi Bianco': {
    name: { sk: 'White Dream', en: 'White Dream' },
    description: {
      sk: 'Smotanový základ, mozzarella, niva, eidam, parmezán – jemné, ale nebezpečne dobré.',
      en: 'Cream base, mozzarella, blue cheese, edam, parmesan – gentle, but dangerously good.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Tonno': {
    name: { sk: 'Tuna Affair', en: 'Tuna Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, tuniak, cibuľa – pre milovníkov morských radostí.',
      en: 'Tomato base, mozzarella, tuna, onion – for lovers of sea pleasures.'
    },
    weight: '520g',
    allergens: ['1', '4', '7']
  },
  'Tuniaková': {
    name: { sk: 'Tuna Affair', en: 'Tuna Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, tuniak, cibuľa – pre milovníkov morských radostí.',
      en: 'Tomato base, mozzarella, tuna, onion – for lovers of sea pleasures.'
    },
    weight: '520g',
    allergens: ['1', '4', '7']
  },
  'Vegetariana': {
    name: { sk: 'Veggie Pleasure', en: 'Veggie Pleasure' },
    description: {
      sk: 'Paradajkový základ, mozzarella, paprika, kukurica, cibuľa, olivy – čisté potešenie bez výčitiek.',
      en: 'Tomato base, mozzarella, peppers, corn, onion, olives – pure pleasure without guilt.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Vegetariana Premium': {
    name: { sk: 'Veggie Pleasure', en: 'Veggie Pleasure' },
    description: {
      sk: 'Paradajkový základ, mozzarella, paprika, kukurica, cibuľa, olivy – čisté potešenie bez výčitiek.',
      en: 'Tomato base, mozzarella, peppers, corn, onion, olives – pure pleasure without guilt.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Hot Missionary': {
    name: { sk: 'Hot Missionary', en: 'Hot Missionary' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, šampiňóny, feferóny – klasika, ale s poriadnou iskrou.',
      en: 'Tomato base, mozzarella, ham, mushrooms, peppers – classic, but with a proper spark.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  
  // 🍑 PREMIUM SINS
  'Basil Pesto Premium': {
    name: { sk: 'Pesto Affair', en: 'Pesto Affair' },
    description: {
      sk: 'Bazalkové pesto, mozzarella, cherry paradajky – green and naughty.',
      en: 'Basil pesto, mozzarella, cherry tomatoes – green and naughty.'
    },
    weight: '520g',
    allergens: ['1', '7', '8']
  },
  'Honey Chilli': {
    name: { sk: 'Honey Temptation', en: 'Honey Temptation' },
    description: {
      sk: 'Paradajkový základ, mozzarella, kuracie mäso, medovo-chilli omáčka – sweet & hot.',
      en: 'Tomato base, mozzarella, chicken, honey-chilli sauce – sweet & hot.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Pollo Crema': {
    name: { sk: 'Pollo Creamy Dream', en: 'Pollo Creamy Dream' },
    description: {
      sk: 'Smotanový základ, mozzarella, kuracie mäso, kukurica – jemné, ale nebezpečne návykové.',
      en: 'Cream base, mozzarella, chicken, corn – gentle, but dangerously addictive.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Prosciutto Crudo Premium': {
    name: { sk: 'Crudo Affair', en: 'Crudo Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, prosciutto crudo, rukola, parmezán – talianska vášeň.',
      en: 'Tomato base, mozzarella, prosciutto crudo, arugula, parmesan – Italian passion.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  
  // Extra products (not in main categories)
  'Korpus': {
    name: { sk: 'Pizza Korpus', en: 'Pizza Meat Feast' },
    description: {
      sk: 'Slanina, šunka, klobása, pepperoni',
      en: 'Bacon, ham, sausage, pepperoni'
    },
    weight: '450g',
    allergens: ['1', '7']
  },
  
  // Štangle & Posúch
  'Pizza štangle (4 ks)': {
    name: { sk: 'Pizza štangle (4 ks)', en: 'Breadsticks (4 pcs)' },
    description: {
      sk: 'Chrumkavé pizza tyčinky s bylinkami a olivovým olejom',
      en: 'Crispy pizza breadsticks with herbs and olive oil'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  'Pizza Štangle': {
    name: { sk: 'Pizza štangle (4 ks)', en: 'Breadsticks (4 pcs)' },
    description: {
      sk: 'Chrumkavé pizza tyčinky s bylinkami a olivovým olejom',
      en: 'Crispy pizza breadsticks with herbs and olive oil'
    },
    weight: '200g',
    allergens: ['1', '7']
  },
  'Bezlepkové štangle (4 ks)': {
    name: { sk: 'Bezlepkové štangle (4 ks)', en: 'Gluten-free Breadsticks (4 pcs)' },
    description: {
      sk: 'Bezlepkové chrumkavé pizza tyčinky s bylinkami',
      en: 'Gluten-free crispy pizza breadsticks with herbs'
    },
    weight: '300g',
    allergens: ['7']
  },
  'Pizza Štangle bezlepkové': {
    name: { sk: 'Bezlepkové štangle (4 ks)', en: 'Gluten-free Breadsticks (4 pcs)' },
    description: {
      sk: 'Bezlepkové chrumkavé pizza tyčinky s bylinkami',
      en: 'Gluten-free crispy pizza breadsticks with herbs'
    },
    weight: '300g',
    allergens: ['7']
  },
  'Pizza posúch': {
    name: { sk: 'Pizza posúch', en: 'Garlic Bread' },
    description: {
      sk: 'Tradiční posúch s cesnakom a bylinkami',
      en: 'Traditional garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['1', '7']
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
  'Bezlepkový posúch': {
    name: { sk: 'Bezlepkový posúch', en: 'Gluten-free Garlic Bread' },
    description: {
      sk: 'Bezlepkový posúch s cesnakom a bylinkami',
      en: 'Gluten-free garlic bread with garlic and herbs'
    },
    weight: '200g',
    allergens: ['7']
  },
  'Pizza Posúch bezlepkový': {
    name: { sk: 'Bezlepkový posúch', en: 'Gluten-free Garlic Bread' },
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
      sk: '☕️ Lebo každá dobrá vec si zaslúži šťastný koniec.',
      en: '☕️ Because every good thing deserves a happy ending.'
    },
    weight: '150g',
    allergens: ['3', '7']
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
