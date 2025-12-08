// Product translations for Slovak and English
// Maps product names to their translations
// Based on Mayday Pizza Bratislava menu: https://maydaypizzaba.sk/section:menu/pizza

import { Product } from '@pizza-ecosystem/shared';

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
  'Hawaii': {
    name: { sk: 'Hawai Crush', en: 'Hawai Crush' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, ananás – tropický flirt.',
      en: 'Tomato base, mozzarella, ham, pineapple – tropical flirt.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Hawai': {
    name: { sk: 'Hawai Crush', en: 'Hawai Crush' },
    description: {
      sk: 'Paradajkový základ, mozzarella, šunka, ananás – tropický flirt.',
      en: 'Tomato base, mozzarella, ham, pineapple – tropical flirt.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Pizza Hawai': {
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
  'Basil Pesto': {
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
  'Prosciutto Crudo': {
    name: { sk: 'Crudo Affair', en: 'Crudo Affair' },
    description: {
      sk: 'Paradajkový základ, mozzarella, prosciutto crudo, rukola, parmezán – talianska vášeň.',
      en: 'Tomato base, mozzarella, prosciutto crudo, arugula, parmesan – Italian passion.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'med chilli': {
    name: { sk: 'Honey Temptation', en: 'Honey Temptation' },
    description: {
      sk: 'Paradajkový základ, mozzarella, kuracie mäso, medovo-chilli omáčka – sweet & hot.',
      en: 'Tomato base, mozzarella, chicken, honey-chilli sauce – sweet & hot.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Med chilli': {
    name: { sk: 'Honey Temptation', en: 'Honey Temptation' },
    description: {
      sk: 'Paradajkový základ, mozzarella, kuracie mäso, medovo-chilli omáčka – sweet & hot.',
      en: 'Tomato base, mozzarella, chicken, honey-chilli sauce – sweet & hot.'
    },
    weight: '520g',
    allergens: ['1', '7']
  },
  'Med Chilli': {
    name: { sk: 'Honey Temptation', en: 'Honey Temptation' },
    description: {
      sk: 'Paradajkový základ, mozzarella, kuracie mäso, medovo-chilli omáčka – sweet & hot.',
      en: 'Tomato base, mozzarella, chicken, honey-chilli sauce – sweet & hot.'
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
      sk: '🥫 Zachráni aj po najdivokejšej noci.',
      en: '🥫 Saves even after the wildest night.'
    },
    weight: '300ml',
    allergens: ['1', '7']
  },
  'Paradajková polievka': {
    name: { sk: 'Paradajková polievka', en: 'Tomato Soup' },
    description: {
      sk: '🥫 Zachráni aj po najdivokejšej noci.',
      en: '🥫 Saves even after the wildest night.'
    },
    weight: '300ml',
    allergens: ['1', '7']
  },
  'Paradajkova polievka': {
    name: { sk: 'Paradajková polievka', en: 'Tomato Soup' },
    description: {
      sk: '🥫 Zachráni aj po najdivokejšej noci.',
      en: '🥫 Saves even after the wildest night.'
    },
    weight: '300ml',
    allergens: ['1', '7']
  },
  
  // Drinks - Based on Mayday Pizza menu
  'Coca Cola': {
    name: { sk: 'Coca Cola', en: 'Coca Cola' },
    description: { sk: 'Klasická Coca-Cola', en: 'Classic Coca-Cola' },
    weight: '1l',
    allergens: []
  },
  'Coca Cola 1l': {
    name: { sk: 'Coca Cola', en: 'Coca Cola' },
    description: { sk: 'Klasická Coca-Cola', en: 'Classic Coca-Cola' },
    weight: '1l',
    allergens: []
  },
  'Cola Zero 1l': {
    name: { sk: 'Cola Zero', en: 'Cola Zero' },
    description: { sk: 'Coca-Cola bez cukru', en: 'Zero sugar Coca-Cola' },
    weight: '1l',
    allergens: []
  },
  'Fanta': {
    name: { sk: 'Fanta', en: 'Fanta' },
    description: { sk: 'Pomarančová Fanta', en: 'Orange Fanta' },
    weight: '1l',
    allergens: []
  },
  'Fanta 1l': {
    name: { sk: 'Fanta', en: 'Fanta' },
    description: { sk: 'Pomarančová Fanta', en: 'Orange Fanta' },
    weight: '1l',
    allergens: []
  },
  'Sprite': {
    name: { sk: 'Sprite', en: 'Sprite' },
    description: { sk: 'Citrónovo-limetkový Sprite', en: 'Lemon-lime Sprite' },
    weight: '1l',
    allergens: []
  },
  'Sprite 1l': {
    name: { sk: 'Sprite', en: 'Sprite' },
    description: { sk: 'Citrónovo-limetkový Sprite', en: 'Lemon-lime Sprite' },
    weight: '1l',
    allergens: []
  },
  'Pepsi 1l': {
    name: { sk: 'Pepsi', en: 'Pepsi' },
    description: { sk: 'Klasická Pepsi', en: 'Classic Pepsi' },
    weight: '1l',
    allergens: []
  },
  'Pepsi Zero 1l': {
    name: { sk: 'Pepsi Zero', en: 'Pepsi Zero' },
    description: { sk: 'Pepsi bez cukru', en: 'Zero sugar Pepsi' },
    weight: '1l',
    allergens: []
  },
  'Kofola 2l': {
    name: { sk: 'Kofola', en: 'Kofola' },
    description: { sk: 'Klasická Kofola', en: 'Classic Kofola' },
    weight: '2l',
    allergens: []
  },
  'Bonaqua Nesýtená 1,5l': {
    name: { sk: 'Bonaqua Nesýtená', en: 'Bonaqua Still' },
    description: { sk: 'Nesýtená minerálna voda', en: 'Still mineral water' },
    weight: '1.5l',
    allergens: []
  },
  'Bonaqua Sýtená 1,5l': {
    name: { sk: 'Bonaqua Sýtená', en: 'Bonaqua Sparkling' },
    description: { sk: 'Sýtená minerálna voda', en: 'Sparkling mineral water' },
    weight: '1.5l',
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
    description: { sk: 'Nesýtená minerálna voda', en: 'Still mineral water' },
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
 * Get translated product name and description
 */
export function getProductTranslation(productName: string, language: 'sk' | 'en') {
  // First try exact match
  let translation = productTranslations[productName];
  let found = !!translation;
  
  // If not found, try case-insensitive match
  if (!translation) {
    const normalizedInput = normalizeProductName(productName);
    for (const [key, value] of Object.entries(productTranslations)) {
      if (normalizeProductName(key) === normalizedInput) {
        translation = value;
        found = true;
        break;
      }
    }
  }
  
  if (translation) {
    return {
      name: translation.name[language],
      description: translation.description[language],
      weight: translation.weight,
      allergens: translation.allergens,
      found: true, // Indicate that translation was found
    };
  }
  
  // Fallback to original if no translation found
  return {
    name: productName,
    description: '',
    weight: undefined,
    allergens: undefined,
    found: false, // Indicate that no translation was found
  };
}

/**
 * Centralized function to get product display name
 * Priority: DB displayName → translation mapping → original name
 * Use this everywhere: web, emails, orders, etc.
 * 
 * @param product - Product object or string (productName)
 * @param language - Language for fallback translation ('sk' | 'en'), defaults to 'sk'
 * @returns The display name to show on website
 */
export function getProductDisplayName(
  product: Product | string,
  language: 'sk' | 'en' = 'sk'
): string {
  // If product is a string, use static mapping
  if (typeof product === 'string') {
    const translation = getProductTranslation(product, language);
    return translation.name;
  }

  // If product is an object, check for DB displayName first
  if (product.displayName) {
    return product.displayName;
  }

  // Fallback to static translation mapping
  const translation = getProductTranslation(product.name, language);
  return translation.name;
}
