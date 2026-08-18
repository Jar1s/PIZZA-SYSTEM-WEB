// Pizza customization options
// Based on PornoPizza menu customization
// Shared between frontend and backend

export interface CustomizationOption {
  id: string;
  name: string;
  nameEn: string;
  price: number; // in cents
  priceCents?: number; // alias for price (for backward compatibility)
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
    name: '🫓 PODKLAD NA HRIECHY',
    nameEn: '🫓 DOUGH FOR SINS',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'classic-32', name: 'Klasické 32 cm – pšeničné', nameEn: 'Classic 32 cm – wheat', price: 0 },
      { id: 'gluten-free-28', name: 'Bezlepkové 28 cm', nameEn: 'Gluten-free 28 cm', price: 249 },
      { id: 'gluten-lactose-free-28', name: 'Bezlepkové bezlaktózové 28 cm', nameEn: 'Gluten-free lactose-free 28 cm', price: 249 },
      { id: 'cheesy-edge', name: 'Cheesy Edge – americké so syrovým okrajom', nameEn: 'Cheesy Edge – American with cheese crust', price: 249 },
    ],
  },
  {
    id: 'cheese',
    name: '🧀 SYR – HRIEŠNE DOBRÝ',
    nameEn: '🧀 CHEESE – SINfully GOOD',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'mozzarella', name: 'Mozzarella', nameEn: 'Mozzarella', price: 0 },
      { id: 'vegan-cheese', name: 'Vegan / bezlaktózový', nameEn: 'Vegan / lactose-free', price: 299 },
      { id: 'no-cheese', name: 'Bez syra – pre tých, čo sa boja záväzkov 😄', nameEn: 'No cheese – for those afraid of commitment 😄', price: 0 },
    ],
  },
  {
    id: 'sauce',
    name: '🍅 ZÁKLAD – CHUTE, KTORÉ ROZOHREJÚ',
    nameEn: '🍅 BASE – FLAVORS THAT HEAT UP',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'tomato', name: 'Paradajkový – klasika, čo nikdy nesklame', nameEn: 'Tomato – classic that never fails', price: 0 },
      { id: 'cream', name: 'Smotanový – pre jemnejšie chute', nameEn: 'Cream – for gentler flavors', price: 0 },
      { id: 'cream-lactose-free', name: 'Smotanový bezlaktózový', nameEn: 'Lactose-free cream', price: 149 },
      { id: 'honey-chilli', name: 'Med–chilli – jemne pikantný twist 🍯🔥', nameEn: 'Honey–chilli – gently spicy twist 🍯🔥', price: 0 },
      { id: 'bbq', name: 'BBQ paradajkový – dymová vášeň', nameEn: 'BBQ tomato – smoky passion', price: 0 },
      { id: 'no-sauce', name: 'Bez základu – nahé potešenie', nameEn: 'No sauce – naked pleasure', price: 0 },
    ],
  },
  {
    id: 'edge',
    name: '🧈 OKRAJ – DOTYK NAVYŠE',
    nameEn: '🧈 EDGE – EXTRA TOUCH',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'olive-oil', name: 'Olivovým olejom', nameEn: 'Olive oil', price: 0 },
      { id: 'garlic', name: 'Cesnakom', nameEn: 'Garlic', price: 0 },
      { id: 'none', name: 'Nepotierať (raw version)', nameEn: 'Don\'t brush (raw version)', price: 0 },
    ],
  },
  {
    id: 'toppings',
    name: '🧩 EXTRA – TVOJA FANTÁZIA',
    nameEn: '🧩 EXTRA – YOUR FANTASY',
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

export const stangleCustomizations: CustomizationCategory[] = [
  {
    id: 'dough',
    name: '🫓 PODKLAD',
    nameEn: '🫓 DOUGH',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'classic-32', name: 'Klasické 32 cm', nameEn: 'Classic 32 cm', price: 0 },
      { id: 'gluten-free-28', name: 'Bezlepkové 28 cm', nameEn: 'Gluten-free 28 cm', price: 249 },
    ],
  },
  {
    id: 'cheese',
    name: '🧀 SYR',
    nameEn: '🧀 CHEESE',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'mozzarella', name: 'Mozzarella', nameEn: 'Mozzarella', price: 0 },
      { id: 'vegan-cheese', name: 'Vegan / bezlaktózový', nameEn: 'Vegan / lactose-free', price: 299 },
    ],
  },
  {
    id: 'sauce',
    name: '🍅 ZÁKLAD',
    nameEn: '🍅 BASE',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'tomato', name: 'Paradajkový', nameEn: 'Tomato', price: 0 },
      { id: 'cream', name: 'Smotanový', nameEn: 'Cream', price: 0 },
    ],
  },
  {
    id: 'edge',
    name: '🧈 OKRAJ',
    nameEn: '🧈 EDGE',
    required: true,
    maxSelection: 1,
    options: [
      { id: 'garlic', name: 'Cesnakom', nameEn: 'Garlic', price: 0 },
      { id: 'olive-oil', name: 'Olejom', nameEn: 'Olive oil', price: 0 },
      { id: 'none', name: 'Raw (nepotierať)', nameEn: 'Raw (dont brush)', price: 0 },
    ],
  },
];

// Helper function to get customization options based on product category
export function getCustomizationOptions(category: string): CustomizationCategory[] {
  if (category === 'STANGLE') {
    return stangleCustomizations;
  } else if (category === 'PIZZA') {
    return pizzaCustomizations;
  }
  return [];
}

// Helper function to calculate modifier price
export function calculateModifierPrice(
  modifiers: Record<string, string[]> | undefined | null,
  productCategory: string | undefined
): number {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return 0;
  }

  const customizations = getCustomizationOptions(productCategory || '');
  if (customizations.length === 0) {
    return 0;
  }

  let totalPrice = 0;

  Object.entries(modifiers).forEach(([categoryId, optionIds]) => {
    const category = customizations.find(c => c.id === categoryId);
    if (!category) {
      return;
    }

    optionIds.forEach(optionId => {
      const option = category.options.find(o => o.id === optionId);
      if (option) {
        // Support both price and priceCents
        totalPrice += option.price || option.priceCents || 0;
      }
    });
  });

  return totalPrice;
}


// ---------------------------------------------------------------------------
// Product-aware resolution
//
// The backend validates an order item's modifiers against the PRODUCT's own
// `modifiers` column when it is non-empty, and only falls back to the category
// preset when the product has none. The storefront must offer exactly the same
// set, otherwise it can build a selection the backend rejects (this happened
// for STANGLE: category preset offered dough/cheese/sauce/edge, the products
// only allow edge). Use this everywhere the customer picks options.
// ---------------------------------------------------------------------------

type ProductLike = {
  category?: string | null;
  modifiers?: Array<{
    id: string;
    name: string;
    type?: 'single' | 'multiple';
    required?: boolean;
    options: Array<{ id: string; name: string; priceCents?: number; price?: number }>;
  }> | null;
};

export function getProductCustomizations(product: ProductLike): CustomizationCategory[] {
  const own = Array.isArray(product?.modifiers) ? product.modifiers : [];
  if (own.length === 0) {
    return getCustomizationOptions(product?.category || '');
  }
  const preset = getCustomizationOptions(product?.category || '');
  return own.map((m) => {
    // Prefer the preset's richer presentation (emoji label, EN name, option
    // labels) when the ids match; fall back to the DB definition otherwise.
    const presetCat = preset.find((c) => c.id === m.id);
    const options: CustomizationOption[] = (m.options || []).map((o) => {
      const presetOpt = presetCat?.options.find((po) => po.id === o.id);
      const price = typeof o.priceCents === 'number' ? o.priceCents : typeof o.price === 'number' ? o.price : presetOpt?.price ?? 0;
      return {
        id: o.id,
        name: o.name || presetOpt?.name || o.id,
        nameEn: presetOpt?.nameEn || o.name || o.id,
        price,
        priceCents: price,
      };
    });
    return {
      id: m.id,
      name: m.name || presetCat?.name || m.id,
      nameEn: presetCat?.nameEn || m.name || m.id,
      required: typeof m.required === 'boolean' ? m.required : presetCat?.required ?? false,
      maxSelection: m.type === 'multiple' ? presetCat?.maxSelection ?? 10 : 1,
      options,
    };
  });
}

/** Modifier price that mirrors the backend: product modifiers first, category preset as fallback. */
export function calculateProductModifierPrice(
  modifiers: Record<string, string[]> | undefined | null,
  product: ProductLike,
): number {
  if (!modifiers || Object.keys(modifiers).length === 0) return 0;
  const customizations = getProductCustomizations(product);
  let total = 0;
  for (const [categoryId, optionIds] of Object.entries(modifiers)) {
    const category = customizations.find((c) => c.id === categoryId);
    if (!category) continue;
    for (const optionId of optionIds || []) {
      const option = category.options.find((o) => o.id === optionId);
      if (option) total += option.price || 0;
    }
  }
  return total;
}
