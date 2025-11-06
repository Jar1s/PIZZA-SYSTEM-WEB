// Translation system for PornoPizza
// Primary language: Slovak (sk)
// Secondary language: English (en)

export type Language = 'sk' | 'en';

export const translations = {
  sk: {
    // Navigation & Header
    cart: 'Košík',
    items: 'položiek',
    
    // Hero Section
    heroTitle: 'Vitajte v',
    heroSubtitle: 'Pravá talianska pizza priamo k vám domov. Vyberte si z lahodných špecialít pripravených s láskou.',
    orderNow: 'Objednať teraz',
    viewMenu: 'Zobraziť menu',
    
    // Hero Stats
    deliveryTime: '30 Minút',
    deliveryLabel: 'Čas doručenia',
    pizzasCount: '28+ Pizz',
    pizzasLabel: 'Na výber',
    rating: '4.8/5',
    ratingLabel: 'Hodnotenie zákazníkov',
    scrollToExplore: 'Posúvaj pre viac',
    
    // Menu Section
    menuTitle: 'Naše Kompletné Menu',
    menuSubtitle: 'Od pravej talianskej pizze až po lahodné dezerty a osviežujúce nápoje',
    
    // Categories
    allMenu: 'Celé Menu',
    pizzas: 'Pizze',
    stangle: 'Štangle & Posúch',
    soups: 'Polievky',
    drinks: 'Nápoje',
    desserts: 'Dezerty',
    sauces: 'Omáčky',
    
    // Product Card
    add: 'Pridať',
    added: 'Pridané',
    premium: 'Premium',
    
    // Empty State
    noPizzasFound: 'Žiadne pizze',
    tryDifferentFilter: 'Skúste iný filter',
    noItemsFound: 'Žiadne položky',
    tryDifferentCategory: 'Skúste inú kategóriu',
    
    // Footer
    footerTagline: 'Pravá talianska pizza priamo k vám domov.',
    quickLinks: 'Rýchle odkazy',
    home: 'Domov',
    menu: 'Menu',
    orderNow2: 'Objednať',
    trackOrder: 'Sledovať objednávku',
    contact: 'Kontakt',
    followUs: 'Sledujte nás',
    allRightsReserved: 'Všetky práva vyhradené.',
    
    // Common
    loading: 'Načítavam...',
    error: 'Chyba',
    close: 'Zavrieť',
    
    // 404 Page
    notFoundTitle: '404: Stránka nenájdená',
    notFoundDescription: 'Stránka, ktorú hľadáte, neexistuje.',
    backToHome: 'Späť na domov',
  },
  
  en: {
    // Navigation & Header
    cart: 'Cart',
    items: 'items',
    
    // Hero Section  
    heroTitle: 'Welcome to',
    heroSubtitle: 'Authentic Italian pizza delivered hot to your door. Choose from delicious varieties made with love.',
    orderNow: 'Order Now',
    viewMenu: 'View Menu',
    
    // Hero Stats
    deliveryTime: '30 Minutes',
    deliveryLabel: 'Delivery Time',
    pizzasCount: '28+ Pizzas',
    pizzasLabel: 'To Choose From',
    rating: '4.8/5',
    ratingLabel: 'Customer Rating',
    scrollToExplore: 'Scroll to explore',
    
    // Menu Section
    menuTitle: 'Our Complete Menu',
    menuSubtitle: 'From authentic Italian pizzas to delicious desserts and refreshing drinks',
    
    // Categories
    allMenu: 'Full Menu',
    pizzas: 'Pizzas',
    stangle: 'Breadsticks',
    soups: 'Soups',
    drinks: 'Drinks',
    desserts: 'Desserts',
    sauces: 'Sauces',
    
    // Product Card
    add: 'Add',
    added: 'Added',
    premium: 'Premium',
    
    // Empty State
    noPizzasFound: 'No pizzas found',
    tryDifferentFilter: 'Try a different filter',
    noItemsFound: 'No items found',
    tryDifferentCategory: 'Try a different category',
    
    // Footer
    footerTagline: 'Authentic Italian pizza delivered hot to your door.',
    quickLinks: 'Quick Links',
    home: 'Home',
    menu: 'Menu',
    orderNow2: 'Order Now',
    trackOrder: 'Track Order',
    contact: 'Contact',
    followUs: 'Follow Us',
    allRightsReserved: 'All rights reserved.',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    close: 'Close',
    
    // 404 Page
    notFoundTitle: '404: Page Not Found',
    notFoundDescription: 'The page you\'re looking for doesn\'t exist.',
    backToHome: 'Back to Home',
  },
};

export function getTranslations(lang: Language) {
  return translations[lang];
}

