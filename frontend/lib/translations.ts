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
    deliveryTime: '90 Minút',
    deliveryLabel: 'Čas doručenia',
    pizzasCount: '28+ Pizz',
    pizzasLabel: 'Na výber',
    rating: '4.8/5',
    ratingLabel: 'Hodnotenie zákazníkov',
    scrollToExplore: 'Posúvaj pre viac',
    
    // Best Sellers Section
    bestSellersTitle: 'Najpredávanejšie',
    bestSellersSubtitle: 'Naše najobľúbenejšie pizze, ktoré si zákazníci najčastejšie objednávajú',
    
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
    cookiePolicy: 'Zásady používania súborov cookie',
    termsOfService: 'Obchodné podmienky',
    privacyPolicy: 'Zásady ochrany osobných údajov',
    
    // Common
    loading: 'Načítavam...',
    error: 'Chyba',
    close: 'Zavrieť',
    
    // 404 Page
    notFoundTitle: '404: Stránka nenájdená',
    notFoundDescription: 'Stránka, ktorú hľadáte, neexistuje.',
    backToHome: 'Späť na domov',
    
    // SMS Verification
    smsVerification: 'SMS Overenie',
    smsVerificationTitle: 'Overenie telefónneho čísla',
    smsVerificationDescription: 'Poslali sme 6-miestny overovací kód na',
    enterPhoneNumber: 'Zadajte telefónne číslo',
    phoneNumberPlaceholder: '+421912345678',
    phoneNumberHint: 'Zadajte telefónne číslo s predvoľbou krajiny (napr. +421912345678)',
    sendCode: 'Poslať kód',
    resendCode: 'Poslať kód znova',
    resendCodeIn: 'Poslať kód znova za',
    verificationCode: 'Overovací kód',
    enterCode: 'Zadajte 6-miestny kód',
    verifyCode: 'Overiť kód',
    verifying: 'Overujem...',
    sending: 'Posielam...',
    codeSent: 'Kód bol úspešne odoslaný',
    codeVerified: 'Kód bol úspešne overený',
    invalidCode: 'Neplatný overovací kód',
    codeExpired: 'Overovací kód vypršal',
    resendCodeSuccess: 'Kód bol znovu odoslaný',
    changePhoneNumber: 'Zmeniť telefónne číslo',
    phoneRequired: 'Telefónne číslo je povinné',
    codeRequired: 'Overovací kód je povinný',
    codeSentTo: 'Kód bol odoslaný na',
    verify: 'Overiť',
    
    // Customer Auth
    customerLogin: 'Prihláste sa',
    customerLoginTitle: 'Prihláste sa do',
    loginWithGoogle: 'Prihláste sa pomocou Google',
    loginWithApple: 'Prihláste sa pomocou Apple',
    orEnterEmail: 'ALEBO ZADAJTE SVOJ EMAIL',
    yourEmail: 'Vaša e-mailová adresa',
    emailPlaceholder: 'email@example.com',
    next: 'Ďalej',
    checking: 'Kontrolujem...',
    password: 'Heslo',
    passwordPlaceholder: 'Zadajte heslo',
    login: 'Prihlásiť sa',
    loggingIn: 'Prihlasujem...',
    back: 'Späť',
    name: 'Meno',
    namePlaceholder: 'Vaše meno',
    register: 'Registrovať sa',
    registering: 'Registrujem...',
    registrationBenefits: 'Výhody registrácie:',
    loyaltyProgram: 'Výhody a odmeny vernostného programu',
    loyaltyProgramDesc: 'Získajte body za každú objednávku a vymeňte si ich za odmeny',
    fasterPayment: 'Jednoduchší a rýchlejší proces platby',
    fasterPaymentDesc: 'Uložte si platobné údaje pre rýchlejšie objednávky',
    additionalFeatures: 'Doplnkové funkcie',
    additionalFeaturesDesc: 'Prístup k exkluzívnym ponukám a funkciám',
    orderHistory: 'Prístup k histórii objednávok',
    orderHistoryDesc: 'Sledujte všetky svoje objednávky na jednom mieste',
    completeRegistration: 'Dokončiť registráciu',
    phone: 'Telefón',
    phoneDescription: 'Zadajte telefónne číslo pre budúce potvrdenia objednávok',
    phoneNumber: 'Telefónne číslo',
    phonePlaceholder: '900 123 456',
    
    // Account Management
    myAccount: 'Moje konto',
    myAddress: 'Moja adresa',
    settingsAndPersonalData: 'Nastavenia a osobné údaje',
    logout: 'Odhlásiť sa',
    streetAndBuilding: 'Ulica a číslo budovy',
    enterAddress: 'Zadajte adresu',
    addressDescription: 'Popis k adrese',
    addressDescriptionPlaceholder: 'Číslo bytu, Poschodie, Číslo vchodu',
    setAsPrimary: 'Nastaviť ako primárnu adresu',
    addAddress: 'Pridať adresu',
    email: 'E-mail',
    edit: 'Upraviť',
    save: 'Uložiť',
    cancel: 'Zrušiť',
    emptyList: 'Zoznam je prázdny',
    emptyOrderHistory: 'Je čas objednať si niečo nové, niečo, čo vás rozosmeje :)',
    noOrders: 'Zatiaľ nemáte žiadne objednávky',
    orderNumber: 'Číslo objednávky',
    orderDate: 'Dátum',
    orderTotal: 'Celková suma',
    orderStatus: 'Stav',
    viewOrder: 'Zobraziť objednávku',
    primaryAddress: 'Primárna adresa',
    delete: 'Zmazať',
    editAddress: 'Upraviť adresu',
    selectOnMap: 'Vybrať na mape',
    cannotFindAddress: 'Neviete nájsť adresu?',
    youCanSelectOnMap: 'Môžete si vybrať adresu na mape',
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
    deliveryTime: '90 Minutes',
    deliveryLabel: 'Delivery Time',
    pizzasCount: '28+ Pizzas',
    pizzasLabel: 'To Choose From',
    rating: '4.8/5',
    ratingLabel: 'Customer Rating',
    scrollToExplore: 'Scroll to explore',
    
    // Best Sellers Section
    bestSellersTitle: 'Best Sellers',
    bestSellersSubtitle: 'Our most popular pizzas that customers order most often',
    
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
    cookiePolicy: 'Cookie Policy',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    close: 'Close',
    
    // 404 Page
    notFoundTitle: '404: Page Not Found',
    notFoundDescription: 'The page you\'re looking for doesn\'t exist.',
    backToHome: 'Back to Home',
    
    // SMS Verification
    smsVerification: 'SMS Verification',
    smsVerificationTitle: 'Phone Number Verification',
    smsVerificationDescription: 'We\'ve sent a 6-digit verification code to',
    enterPhoneNumber: 'Enter your phone number',
    phoneNumberPlaceholder: '+421912345678',
    phoneNumberHint: 'Enter your phone number with country code (e.g., +421912345678)',
    sendCode: 'Send Code',
    resendCode: 'Resend Code',
    resendCodeIn: 'Resend code in',
    verificationCode: 'Verification Code',
    
    // Account Management
    myAccount: 'My Account',
    orderHistory: 'Order History',
    myAddress: 'My Address',
    settingsAndPersonalData: 'Settings and Personal Data',
    logout: 'Log Out',
    streetAndBuilding: 'Street and building number',
    enterAddress: 'Enter address',
    addressDescription: 'Address description',
    addressDescriptionPlaceholder: 'Apartment number, Floor, Entrance number',
    setAsPrimary: 'Set as primary address',
    addAddress: 'Add Address',
    phone: 'Phone',
    email: 'Email',
    name: 'Name',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    emptyList: 'List is empty',
    emptyOrderHistory: 'It\'s time to order something new, something that will make you smile :)',
    noOrders: 'You don\'t have any orders yet',
    orderNumber: 'Order Number',
    orderDate: 'Date',
    orderTotal: 'Total',
    orderStatus: 'Status',
    viewOrder: 'View Order',
    primaryAddress: 'Primary Address',
    delete: 'Delete',
    editAddress: 'Edit Address',
    selectOnMap: 'Select on Map',
    cannotFindAddress: 'Can\'t find the address?',
    youCanSelectOnMap: 'You can choose an address on the map',
    enterCode: 'Enter the 6-digit code',
    verifyCode: 'Verify Code',
    verifying: 'Verifying...',
    sending: 'Sending...',
    codeSent: 'Code sent successfully',
    codeVerified: 'Code verified successfully',
    invalidCode: 'Invalid verification code',
    codeExpired: 'Verification code expired',
    resendCodeSuccess: 'Code resent successfully',
    changePhoneNumber: 'Change phone number',
    phoneRequired: 'Phone number is required',
    codeRequired: 'Verification code is required',
    codeSentTo: 'Code sent to',
    verify: 'Verify',
    
    // Customer Auth
    customerLogin: 'Sign In',
    customerLoginTitle: 'Sign in to',
    loginWithGoogle: 'Sign in with Google',
    loginWithApple: 'Sign in with Apple',
    orEnterEmail: 'OR ENTER YOUR EMAIL',
    yourEmail: 'Your email address',
    emailPlaceholder: 'email@example.com',
    next: 'Next',
    checking: 'Checking...',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    login: 'Sign In',
    loggingIn: 'Signing in...',
    back: 'Back',
    namePlaceholder: 'Your name',
    register: 'Register',
    registering: 'Registering...',
    registrationBenefits: 'Registration Benefits:',
    loyaltyProgram: 'Loyalty program benefits and rewards',
    loyaltyProgramDesc: 'Earn points for every order and redeem them for rewards',
    fasterPayment: 'Simpler and faster payment process',
    fasterPaymentDesc: 'Save your payment details for faster orders',
    additionalFeatures: 'Additional features',
    additionalFeaturesDesc: 'Access to exclusive offers and features',
    orderHistoryDesc: 'Track all your orders in one place',
    completeRegistration: 'Complete Registration',
    phoneDescription: 'Enter your phone number for future order confirmations',
    phoneNumber: 'Phone number',
    phonePlaceholder: '900 123 456',
  },
};

export function getTranslations(lang: Language) {
  return translations[lang];
}

