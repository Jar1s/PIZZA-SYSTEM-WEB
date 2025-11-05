// Pizza customization options
// Based on PornoPizza menu customization

export interface CustomizationOption {
  id: string;
  name: string;
  nameEn: string;
  price: number; // in cents
}

export interface CustomizationCategory {
  id: string;
  name: string;
  nameEn: string;
  required: boolean;
  maxSelection: number;
  options: CustomizationOption[];
}

export const pizzaCustomizations: CustomizationCategory[] = [
  {
    id: 'dough',
    name: 'Cesto',
    nameEn: 'Dough',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'classic-32', name: 'Klasické 32cm (pšeničné)', nameEn: 'Classic 32cm (wheat)', price: 0 },
      { id: 'protein-28', name: 'Bezlepkové proteinové 28cm', nameEn: 'Gluten-free protein 28cm', price: 249 },
      { id: 'lactose-free-28', name: 'Bezlepkové bezlaktózové 28cm', nameEn: 'Gluten-free lactose-free 28cm', price: 249 },
      { id: 'american-cheese', name: 'Americké so syrovým okrajom', nameEn: 'American with cheese crust', price: 249 },
    ],
  },
  {
    id: 'cheese',
    name: 'Syr',
    nameEn: 'Cheese',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'mozzarella', name: 'Mozzarella', nameEn: 'Mozzarella', price: 0 },
      { id: 'vegan-cheese', name: 'Vegan/bezlaktózový', nameEn: 'Vegan/lactose-free', price: 299 },
      { id: 'no-cheese', name: 'Bez syra', nameEn: 'No cheese', price: 0 },
    ],
  },
  {
    id: 'sauce',
    name: 'Základ',
    nameEn: 'Base Sauce',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'tomato', name: 'Paradajkový', nameEn: 'Tomato', price: 0 },
      { id: 'cream', name: 'Smotanový', nameEn: 'Cream', price: 0 },
      { id: 'cream-lactose-free', name: 'Smotanový bezlaktózový', nameEn: 'Lactose-free cream', price: 149 },
      { id: 'honey-chilli', name: 'Med-chilli', nameEn: 'Honey-chilli', price: 0 },
      { id: 'bbq', name: 'BBQ paradajkový', nameEn: 'BBQ tomato', price: 0 },
      { id: 'no-sauce', name: 'Bez základu', nameEn: 'No sauce', price: 0 },
    ],
  },
  {
    id: 'edge',
    name: 'Okraj potrieť',
    nameEn: 'Edge Coating',
    required: false,
    maxSelection: 1,
    options: [
      { id: 'olive-oil', name: 'Olivovým olejom', nameEn: 'Olive oil', price: 0 },
      { id: 'garlic', name: 'Cesnakom', nameEn: 'Garlic', price: 0 },
    ],
  },
  {
    id: 'toppings',
    name: 'Príloha',
    nameEn: 'Toppings',
    required: false,
    maxSelection: 10,
    options: [
      { id: 'corn', name: 'Kukurica', nameEn: 'Corn', price: 179 },
      { id: 'onion', name: 'Cibuľa', nameEn: 'Onion', price: 179 },
      { id: 'lamb-horn', name: 'Baranie rohy', nameEn: 'Lamb horn peppers', price: 179 },
      { id: 'spinach', name: 'Baby špenát', nameEn: 'Baby spinach', price: 179 },
      { id: 'artichoke', name: 'Artičoky', nameEn: 'Artichokes', price: 179 },
      { id: 'parmesan', name: 'Parmezán', nameEn: 'Parmesan', price: 199 },
      { id: 'gorgonzola', name: 'Niva', nameEn: 'Gorgonzola', price: 199 },
      { id: 'egg', name: 'Vajce', nameEn: 'Egg', price: 199 },
      { id: 'sausage', name: 'Klobása', nameEn: 'Sausage', price: 199 },
      { id: 'goat-cheese', name: 'Kozí syr', nameEn: 'Goat cheese', price: 199 },
      { id: 'vegan-cheese-extra', name: 'Vegan / bezlaktózový syr', nameEn: 'Vegan / lactose-free cheese', price: 299 },
      { id: 'mushrooms', name: 'Šampióny', nameEn: 'Mushrooms', price: 179 },
      { id: 'olives', name: 'Olivy', nameEn: 'Olives', price: 179 },
      { id: 'tomatoes', name: 'Paradajky', nameEn: 'Tomatoes', price: 179 },
      { id: 'arugula', name: 'Rukola', nameEn: 'Arugula', price: 199 },
      { id: 'ham', name: 'Šunka', nameEn: 'Ham', price: 199 },
      { id: 'tuna', name: 'Tuniak', nameEn: 'Tuna', price: 199 },
      { id: 'chilli', name: 'Chilli', nameEn: 'Chilli', price: 199 },
      { id: 'ricotta', name: 'Ricotta', nameEn: 'Ricotta', price: 199 },
      { id: 'spicy-salami', name: 'Pikantná saláma', nameEn: 'Spicy salami', price: 249 },
      { id: 'prosciutto', name: 'Prosciutto crudo', nameEn: 'Prosciutto crudo', price: 299 },
      { id: 'pineapple', name: 'Ananás', nameEn: 'Pineapple', price: 179 },
      { id: 'pepperoncini', name: 'Feferóny', nameEn: 'Pepperoncini', price: 179 },
      { id: 'broccoli', name: 'Brokolica', nameEn: 'Broccoli', price: 179 },
      { id: 'garlic-topping', name: 'Cesnak', nameEn: 'Garlic', price: 179 },
      { id: 'mozzarella-extra', name: 'Mozzarella', nameEn: 'Mozzarella', price: 199 },
      { id: 'bacon', name: 'Slanina', nameEn: 'Bacon', price: 199 },
      { id: 'smoked-cheese', name: 'Údený syr', nameEn: 'Smoked cheese', price: 199 },
      { id: 'salami', name: 'Saláma', nameEn: 'Salami', price: 199 },
      { id: 'basil-pesto', name: 'Bazalkové pesto', nameEn: 'Basil pesto', price: 199 },
      { id: 'chicken', name: 'Kuracie prsia', nameEn: 'Chicken breast', price: 299 },
    ],
  },
];

