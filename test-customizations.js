// Test script to show all customization options as they appear in admin dashboard

const pizzaCustomizations = [
  {
    id: 'dough',
    name: '🫓 PODKLAD NA HRIECHY',
    options: [
      { id: 'classic-32', name: 'Klasické 32 cm – pšeničné' },
      { id: 'gluten-free-28', name: 'Bezlepkové 28 cm' },
      { id: 'gluten-lactose-free-28', name: 'Bezlepkové bezlaktózové 28 cm' },
      { id: 'cheesy-edge', name: 'Cheesy Edge – americké so syrovým okrajom' },
    ],
  },
  {
    id: 'cheese',
    name: '🧀 SYR – HRIEŠNE DOBRÝ',
    options: [
      { id: 'mozzarella', name: 'Mozzarella' },
      { id: 'vegan-cheese', name: 'Vegan / bezlaktózový' },
      { id: 'no-cheese', name: 'Bez syra – pre tých, čo sa boja záväzkov 😄' },
    ],
  },
  {
    id: 'sauce',
    name: '🍅 ZÁKLAD – CHUTE, KTORÉ ROZOHREJÚ',
    options: [
      { id: 'tomato', name: 'Paradajkový – klasika, čo nikdy nesklame' },
      { id: 'cream', name: 'Smotanový – pre jemnejšie chute' },
      { id: 'cream-lactose-free', name: 'Smotanový bezlaktózový' },
      { id: 'honey-chilli', name: 'Med–chilli – jemne pikantný twist 🍯🔥' },
      { id: 'bbq', name: 'BBQ paradajkový – dymová vášeň' },
      { id: 'no-sauce', name: 'Bez základu – nahé potešenie' },
    ],
  },
  {
    id: 'edge',
    name: '🧈 OKRAJ – DOTYK NAVYŠE',
    options: [
      { id: 'olive-oil', name: 'Olivovým olejom' },
      { id: 'garlic', name: 'Cesnakom' },
      { id: 'none', name: 'Nepotierať (raw version)' },
    ],
  },
  {
    id: 'toppings',
    name: '🧩 EXTRA – TVOJA FANTÁZIA',
    options: [
      { id: 'corn', name: 'Kukurica' },
      { id: 'onion', name: 'Cibuľa' },
      { id: 'lamb-horn', name: 'Baranie rohy' },
      { id: 'spinach', name: 'Baby špenát' },
      { id: 'artichoke', name: 'Artičoky' },
      { id: 'parmesan', name: 'Parmezán' },
      { id: 'gorgonzola', name: 'Niva' },
      { id: 'egg', name: 'Vajce' },
      { id: 'sausage', name: 'Klobása' },
      { id: 'goat-cheese', name: 'Kozí syr' },
      { id: 'vegan-cheese-extra', name: 'Vegan / bezlaktózový syr' },
      { id: 'mushrooms', name: 'Šampióny' },
      { id: 'olives', name: 'Olivy' },
      { id: 'tomatoes', name: 'Paradajky' },
      { id: 'arugula', name: 'Rukola' },
      { id: 'ham', name: 'Šunka' },
      { id: 'tuna', name: 'Tuniak' },
      { id: 'chilli', name: 'Chilli' },
      { id: 'ricotta', name: 'Ricotta' },
      { id: 'spicy-salami', name: 'Pikantná saláma' },
      { id: 'prosciutto', name: 'Prosciutto crudo' },
      { id: 'pineapple', name: 'Ananás' },
      { id: 'pepperoncini', name: 'Feferóny' },
      { id: 'broccoli', name: 'Brokolica' },
      { id: 'garlic-topping', name: 'Cesnak' },
      { id: 'mozzarella-extra', name: 'Mozzarella' },
      { id: 'bacon', name: 'Slanina' },
      { id: 'smoked-cheese', name: 'Údený syr' },
      { id: 'salami', name: 'Saláma' },
      { id: 'basil-pesto', name: 'Bazalkové pesto' },
      { id: 'chicken', name: 'Kuracie prsia' },
    ],
  },
];

const stangleCustomizations = [
  {
    id: 'edge',
    name: '🧈 OKRAJ – DOTYK NAVYŠE',
    options: [
      { id: 'olive-oil', name: 'Olivovým olejom' },
      { id: 'garlic', name: 'Cesnakom' },
      { id: 'none', name: 'Nepotierať (raw version)' },
    ],
  },
];

function cleanName(name) {
  return name
    .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '')
    .replace(/[🧀🫓🍅🧈🧩]/g, '')
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDefaultCategoryName(categoryId) {
  const categoryMap = {
    'dough': 'Podklad',
    'cheese': 'Syr',
    'sauce': 'Základ',
    'edge': 'Okraj',
    'toppings': 'Extra',
  };
  return categoryMap[categoryId] || categoryId;
}

function getDefaultOptionName(optionName) {
  let cleaned = cleanName(optionName);
  cleaned = cleaned.split('–')[0].trim();
  cleaned = cleaned.split('-')[0].trim();
  cleaned = cleaned.replace(/\s*\([^)]+\)/g, '');
  return cleaned.trim();
}

console.log('=== CUSTOMIZÁCIE V ADMIN DASHBOARDE ===\n');

[...pizzaCustomizations, ...stangleCustomizations].forEach(category => {
  const categoryName = getDefaultCategoryName(category.id);
  console.log(`${categoryName}:`);
  category.options.forEach(option => {
    const defaultName = getDefaultOptionName(option.name);
    console.log(`  • ${defaultName}`);
  });
  console.log('');
});









