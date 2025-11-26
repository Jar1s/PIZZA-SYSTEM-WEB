'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, Tenant } from '@pizza-ecosystem/shared';
import { ProductCard } from '@/components/menu/ProductCard';
import { HeroSection } from '@/components/home/HeroSection';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useCart } from '@/hooks/useCart';
import { getProductTranslation } from '@/lib/product-translations';
import { motion } from 'framer-motion';
import { isDarkTheme as resolveDarkTheme, getBackgroundClass, getSectionShellClass, getBodyBackgroundClass } from '@/lib/tenant-utils';
import { isCurrentlyOpen } from '@/lib/opening-hours';
import Image from 'next/image';

// Import Cart directly instead of lazy loading to avoid chunk loading issues
import { Cart } from '@/components/cart/Cart';

type CategoryFilter = 'all' | 'PIZZA' | 'STANGLE' | 'SOUPS' | 'SIDES' | 'DRINKS' | 'DESSERTS' | 'SAUCES';

interface HomePageClientProps {
  products: Product[];
  tenant: Tenant;
}

export function HomePageClient({ products, tenant }: HomePageClientProps) {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const toast = useToastContext();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('PIZZA');

  // Debug: Log prices for specific products when component mounts
  useEffect(() => {
    const productsToDebug = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium', 'Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
    productsToDebug.forEach(name => {
      const p = products.find(pr => pr.name === name);
      if (p) {
        console.log(`[HomePageClient] ${p.name}: ${p.priceCents} cents = €${(p.priceCents / 100).toFixed(2)}`);
      }
    });
  }, [products]);

  // Group products by category (memoized)
  const productsByCategory = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const category = product.category || 'OTHER';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
    
    // Sort products within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (category === 'PIZZA') {
          const aIsBuildYourOwn = a.name === 'Vyskladaj si vlastnú pizzu' || a.name === 'Build Your Own Pizza';
          const bIsBuildYourOwn = b.name === 'Vyskladaj si vlastnú pizzu' || b.name === 'Build Your Own Pizza';
          
          if (aIsBuildYourOwn && !bIsBuildYourOwn) return -1;
          if (!aIsBuildYourOwn && bIsBuildYourOwn) return 1;
        }
        
        return a.name.localeCompare(b.name);
      });
    });
    
    return grouped;
  }, [products]);

  // Get filtered products (memoized)
  const filteredProducts = useMemo(() => {
    return categoryFilter === 'all' 
      ? products 
      : products.filter(p => p.category === categoryFilter);
  }, [products, categoryFilter]);

  // Category counts (memoized)
  const categoryCounts = useMemo<Record<CategoryFilter, number>>(() => ({
    all: products.length,
    PIZZA: productsByCategory.PIZZA?.length || 0,
    STANGLE: productsByCategory.STANGLE?.length || 0,
    SOUPS: productsByCategory.SOUPS?.length || 0,
    DRINKS: productsByCategory.DRINKS?.length || 0,
    DESSERTS: productsByCategory.DESSERTS?.length || 0,
    SIDES: productsByCategory.SIDES?.length || 0,
    SAUCES: productsByCategory.SAUCES?.length || 0,
  }), [products.length, productsByCategory]);

  // Category emoji map
  const categoryEmoji: Record<string, string> = {
    all: '🍕',
    PIZZA: '🍕',
    STANGLE: '🥖',
    SOUPS: '🍲',
    DRINKS: '🥤',
    DESSERTS: '🍰',
  };

  // Category labels (memoized)
  const categoryLabels = useMemo<Record<string, string>>(() => ({
    all: t.allMenu,
    PIZZA: t.pizzas,
    STANGLE: t.stangle,
    SOUPS: t.soups,
    DRINKS: t.drinks,
    DESSERTS: t.desserts,
    SAUCES: t.sauces,
  }), [t]);

  // Category display order
  const categoryOrder = useMemo(() => ['PIZZA', 'STANGLE', 'SOUPS', 'DRINKS', 'DESSERTS'], []);
  
  // Get ordered categories that have products
  const orderedCategories = useMemo(() => {
    return categoryOrder.filter(cat => productsByCategory[cat]?.length > 0);
  }, [productsByCategory, categoryOrder]);

  // Debug: Log category counts and SOUPS products
  useEffect(() => {
    console.log('[HomePageClient] Category counts:', categoryCounts);
    console.log('[HomePageClient] Products by category:', Object.keys(productsByCategory).map(cat => `${cat}: ${productsByCategory[cat]?.length || 0}`));
    const soups = products.filter(p => p.category === 'SOUPS');
    console.log('[HomePageClient] SOUPS products:', soups.map(p => `${p.name} (active: ${p.isActive})`));
    console.log('[HomePageClient] Will show SOUPS category?', categoryCounts.SOUPS > 0);
  }, [products, categoryCounts, productsByCategory]);

  // Pizza sub-category mapping - moved inside useMemo to fix dependency warning
  const productsBySubCategory = useMemo(() => {
    const pizzaSubCategoryMap: Record<string, 'FOREPLAY' | 'MAIN_ACTION' | 'DELUXE_FETISH' | 'PREMIUM_SINS'> = {
      // 🔥 PREDOHRA / FOREPLAY
      'Margherita': 'FOREPLAY',
      'Pizza Margherita': 'FOREPLAY',
      'Prosciutto': 'FOREPLAY',
      'Pizza Prosciutto': 'FOREPLAY',
      'Bon Salami': 'FOREPLAY',
      'Pizza Bon Salami': 'FOREPLAY',
      'Picante': 'FOREPLAY',
      'Pizza Picante': 'FOREPLAY',
      'Calimero': 'FOREPLAY',
      'Pizza Calimero': 'FOREPLAY',
      'Prosciutto Funghi': 'FOREPLAY',
      'Pizza Prosciutto Funghi': 'FOREPLAY',
      'Hawaii Premium': 'FOREPLAY',
      'Hawaii': 'FOREPLAY',
      'Pizza Hawai': 'FOREPLAY',
      'Capri': 'FOREPLAY',
      'Pizza Capri': 'FOREPLAY',
      'Da Vinci': 'FOREPLAY',
      'Pizza Da Vinci': 'FOREPLAY',
      'Quattro Stagioni': 'FOREPLAY',
      'Pizza Quattro Stagioni': 'FOREPLAY',
      // 😈 MAIN ACTION / HLAVNÉ ČÍSLO
      'Mayday Special': 'MAIN_ACTION',
      'Mayday': 'MAIN_ACTION',
      'Pizza Mayday': 'MAIN_ACTION',
      'Gazdovská': 'MAIN_ACTION',
      'Pizza Gazdovská': 'MAIN_ACTION',
      'Pivárska': 'MAIN_ACTION',
      'Pizza Pivárska': 'MAIN_ACTION',
      'Diavola Premium': 'MAIN_ACTION',
      'Diavola': 'MAIN_ACTION',
      'Pizza Diavola': 'MAIN_ACTION',
      'Provinciale': 'MAIN_ACTION',
      'Pizza Provinciale': 'MAIN_ACTION',
      // 💋 DELUXE FETISH
      'Fregata': 'DELUXE_FETISH',
      'Pizza Fregata': 'DELUXE_FETISH',
      'Quattro Formaggi': 'DELUXE_FETISH',
      'Pizza Quattro Formaggi': 'DELUXE_FETISH',
      'Quattro Formaggi Bianco': 'DELUXE_FETISH',
      'Pizza Quattro Formaggi Bianco': 'DELUXE_FETISH',
      'Tonno': 'DELUXE_FETISH',
      'Pizza Tonno': 'DELUXE_FETISH',
      'Tuniaková': 'DELUXE_FETISH',
      'Pizza Tuniaková': 'DELUXE_FETISH',
      'Vegetariana': 'DELUXE_FETISH',
      'Pizza Vegetariana': 'DELUXE_FETISH',
      'Vegetariana Premium': 'DELUXE_FETISH',
      'Hot Missionary': 'DELUXE_FETISH',
      'Pizza Hot Missionary': 'DELUXE_FETISH',
      // 🍑 PREMIUM SINS
      'Basil Pesto Premium': 'PREMIUM_SINS',
      'Pizza Bazila Pesto': 'PREMIUM_SINS',
      'Honey Chilli': 'PREMIUM_SINS',
      'Pizza Med-Chilli': 'PREMIUM_SINS',
      'Pollo Crema': 'PREMIUM_SINS',
      'Pizza Pollo Crema': 'PREMIUM_SINS',
      'Prosciutto Crudo Premium': 'PREMIUM_SINS',
      'Pizza Prosciutto Crudo': 'PREMIUM_SINS',
    };

    const pizzas = productsByCategory.PIZZA || [];
    const grouped: Record<string, Product[]> = {
      FOREPLAY: [],
      MAIN_ACTION: [],
      DELUXE_FETISH: [],
      PREMIUM_SINS: [],
      OTHER: [],
    };
    
    pizzas.forEach(pizza => {
      if (pizza.name === 'Vyskladaj si vlastnú pizzu' || pizza.name === 'Build Your Own Pizza') {
        return;
      }
      
      const subCat = pizzaSubCategoryMap[pizza.name];
      if (subCat) {
        grouped[subCat].push(pizza);
      } else {
        grouped.FOREPLAY.push(pizza);
      }
    });
    
    return grouped;
  }, [productsByCategory.PIZZA]);

  // Category filter handler
  const handleCategoryFilter = useCallback((category: CategoryFilter) => {
    setCategoryFilter(category);
  }, []);

  const isDarkTheme = resolveDarkTheme(tenant);
  const backgroundClass = getBackgroundClass(tenant);
  const sectionShellClass = getSectionShellClass(tenant);
  const bodyBackgroundClass = getBodyBackgroundClass(tenant);

  // Get primary color (use PornoPizza brand pink/red as default)
  const primaryColor = tenant.theme?.primaryColor || '#E91E63';

  // Check maintenance mode (manual or automatic based on opening hours)
  const manualMaintenanceMode = tenant.theme?.maintenanceMode === true;
  const openingHours = (tenant.theme as any)?.openingHours;
  const autoMaintenanceMode = openingHours ? !isCurrentlyOpen(openingHours) : false;
  const maintenanceMode = manualMaintenanceMode || autoMaintenanceMode;

  // Apply background class to body
  useEffect(() => {
    if (!bodyBackgroundClass) {
      document.body.classList.remove('bg-porno-vibe');
      return;
    }
    const classes = bodyBackgroundClass.split(' ').filter(Boolean);
    classes.forEach(cls => document.body.classList.add(cls));
    return () => {
      classes.forEach(cls => document.body.classList.remove(cls));
    };
  }, [bodyBackgroundClass]);

  return (
    <div
      className={`${backgroundClass} ${isDarkTheme ? 'text-white' : 'text-gray-900'} min-h-screen relative`}
    >
      <Header tenant={tenant} />
      
      {maintenanceMode && (
        <div
          className={`relative overflow-hidden border-b ${
            isDarkTheme
              ? 'bg-[#100505]/95 border-white/10 text-white'
              : 'text-gray-900'
          }`}
          style={!isDarkTheme ? {
            backgroundColor: `${primaryColor}15`,
            borderColor: `${primaryColor}30`
          } : undefined}
        >
          {isDarkTheme && (
            <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(120deg, rgba(255,0,102,0.12), transparent), radial-gradient(circle at top, rgba(255,94,0,0.35), transparent 55%)',
                }}
              />
            </div>
          )}
          <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 flex items-center justify-center rounded-2xl border ${
                    isDarkTheme ? 'border-white/20 bg-black/60' : 'bg-white'
                  }`}
                  style={!isDarkTheme ? {
                    borderColor: `${primaryColor}30`
                  } : undefined}
                  aria-hidden
                >
                  <svg
                    className={`w-6 h-6 ${isDarkTheme ? 'text-white' : ''}`}
                    style={!isDarkTheme ? { color: 'var(--color-primary)' } : undefined}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">
                    {t.maintenanceModeTitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <HeroSection 
        tenantName={tenant.name} 
        primaryColor={primaryColor}
        isDark={isDarkTheme}
      />

      {/* Best Sellers Section */}
      {products.length > 0 && (() => {
        // Get products marked as best sellers from ALL categories
        const bestSellerProducts = products.filter(
          p => p.isBestSeller === true && p.isActive === true
        ).slice(0, 4);
        
        // If no best sellers, use first 4 pizzas as fallback
        const productsToShow = bestSellerProducts.length > 0 
          ? bestSellerProducts 
          : (productsByCategory.PIZZA || []).filter(
              p => p.name !== 'Vyskladaj si vlastnú pizzu' && p.name !== 'Build Your Own Pizza'
            ).slice(0, 4);
        
        if (productsToShow.length === 0) return null;
        
        return (
          <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16" style={{ position: 'relative', zIndex: 10 }}>
            <div className={sectionShellClass}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4"
                  style={{ 
                    color: 'var(--color-primary)',
                    textShadow: 'none',
                    letterSpacing: '0'
                  }}
                >
                  {t.bestSellersTitle}
                </h2>
                <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>
                  {t.bestSellersSubtitle}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
              >
                {productsToShow.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} isBestSeller={true} isDark={isDarkTheme} />
                ))}
              </motion.div>
            </div>
          </section>
        );
      })()}

      {/* Menu Section - Continue with rest of the component */}
      <section id="menu" className="container mx-auto px-4 py-16" style={{ position: 'relative', zIndex: 10 }}>
        <div className={sectionShellClass}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 
              className="text-5xl md:text-6xl font-bold mb-4"
              style={{ 
                color: 'var(--color-primary)',
                textShadow: 'none',
                letterSpacing: '0'
              }}
            >
              {t.menuTitle}
            </h2>
            <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>
              {t.menuSubtitle}
            </p>
          </motion.div>

          {/* Category Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto overflow-y-visible pb-4 sm:pb-4 pt-2 sm:pt-2 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide mb-8 sm:mb-12 justify-start sm:justify-center"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overscrollBehaviorX: 'none',
            }}
            onWheel={(e) => {
              // Prevent horizontal scroll when scrolling vertically
              // Only allow horizontal scroll if user is intentionally scrolling horizontally
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                // User is scrolling vertically - completely prevent horizontal scroll
                e.preventDefault();
                // Manually scroll the page vertically instead
                window.scrollBy({
                  top: e.deltaY,
                  behavior: 'auto'
                });
              }
            }}
          >
            {(Object.keys(categoryCounts) as CategoryFilter[]).map((category) => {
              if (categoryCounts[category] === 0 || category === 'all') return null;
              
              const chipClass = isDarkTheme
                ? `rounded-full font-bold transition-all ${
                    categoryFilter === category
                      ? 'category-chip category-chip--active'
                      : 'category-chip hover:border-white/25'
                  }`
                : `px-6 py-3 rounded-lg font-bold transition-all ${
                    categoryFilter === category
                      ? 'text-white shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-gray-100 shadow bg-white'
                  }`;

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`${chipClass} px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base touch-manipulation min-h-[44px] whitespace-nowrap flex-shrink-0`}
                  style={categoryFilter === category && !isDarkTheme 
                    ? { backgroundColor: tenant.theme.primaryColor }
                    : {}
                  }
                >
                  <span className="mr-1 sm:mr-2">{categoryEmoji[category]}</span>
                  {categoryLabels[category]}
                </button>
              );
            })}
          </motion.div>

          {/* Products by Category */}
          {categoryFilter === 'PIZZA' ? (
            <>
              {(() => {
                const buildYourOwnPizza = productsByCategory.PIZZA?.find(
                  p => p.name === 'Vyskladaj si vlastnú pizzu' || p.name === 'Build Your Own Pizza'
                );
                
                const buildYourOwnTranslation = buildYourOwnPizza 
                  ? getProductTranslation(buildYourOwnPizza.name, language)
                  : null;
                
                return (
                  <div className="mb-16" style={{ position: 'relative', zIndex: 1 }}>
                    {/* FOREPLAY */}
                    {productsBySubCategory.FOREPLAY.length > 0 && (
                      <div className="mb-16">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="mb-8 text-center"
                        >
                          <h3 
                            className={`text-4xl md:text-5xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                            style={{ 
                              color: isDarkTheme ? '#FF6B9D' : primaryColor,
                              textShadow: isDarkTheme 
                                ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            🔥 {t.foreplay}
                          </h3>
                          <p className={`mb-4 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>{t.foreplayDesc}</p>
                          <div className="h-1 w-32 rounded mx-auto" style={{ backgroundColor: primaryColor }}></div>
                        </motion.div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                          {productsBySubCategory.FOREPLAY.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} isDark={isDarkTheme} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MAIN ACTION */}
                    {productsBySubCategory.MAIN_ACTION.length > 0 && (
                      <div className="mb-16">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="mb-8 text-center"
                        >
                          <h3 
                            className={`text-4xl md:text-5xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                            style={{ 
                              color: isDarkTheme ? '#FF6B9D' : primaryColor,
                              textShadow: isDarkTheme 
                                ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            😈 {t.mainAction}
                          </h3>
                          <p className={`mb-4 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>{t.mainActionDesc}</p>
                          <div className="h-1 w-32 rounded mx-auto" style={{ backgroundColor: primaryColor }}></div>
                        </motion.div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                          {productsBySubCategory.MAIN_ACTION.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} isDark={isDarkTheme} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DELUXE FETISH */}
                    {productsBySubCategory.DELUXE_FETISH.length > 0 && (
                      <div className="mb-16">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="mb-8 text-center"
                        >
                          <h3 
                            className={`text-4xl md:text-5xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                            style={{ 
                              color: isDarkTheme ? '#FF6B9D' : primaryColor,
                              textShadow: isDarkTheme 
                                ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            💋 {t.deluxeFetish}
                          </h3>
                          <p className={`mb-4 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>{t.deluxeFetishDesc}</p>
                          <div className="h-1 w-32 rounded mx-auto" style={{ backgroundColor: primaryColor }}></div>
                        </motion.div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                          {productsBySubCategory.DELUXE_FETISH.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} isDark={isDarkTheme} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PREMIUM SINS */}
                    {productsBySubCategory.PREMIUM_SINS.length > 0 && (
                      <div className="mb-16">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="mb-8 text-center"
                        >
                          <h3 
                            className={`text-4xl md:text-5xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                            style={{ 
                              color: isDarkTheme ? '#FF6B9D' : primaryColor,
                              textShadow: isDarkTheme 
                                ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            🍑 {t.premiumSins}
                          </h3>
                          <p className={`mb-4 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>{t.premiumSinsDesc}</p>
                          <div className="h-1 w-32 rounded mx-auto" style={{ backgroundColor: primaryColor }}></div>
                        </motion.div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                          {productsBySubCategory.PREMIUM_SINS.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} isDark={isDarkTheme} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Build Your Own Pizza */}
                    {buildYourOwnPizza && (
                      <div className="mb-16">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="mb-8 text-center"
                        >
                          <h3 
                            className={`text-4xl md:text-5xl font-black mb-2 flex items-center justify-center gap-3 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                            style={{ 
                              color: isDarkTheme ? '#FF6B9D' : primaryColor,
                              textShadow: isDarkTheme 
                                ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            <span className="text-5xl">🍕</span>
                            {buildYourOwnTranslation?.name || 'Vyskladaj si vlastnú pizzu'}
                          </h3>
                          <div className="h-1 w-32 rounded mx-auto" style={{ backgroundColor: primaryColor }}></div>
                        </motion.div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                          <ProductCard key={buildYourOwnPizza.id} product={buildYourOwnPizza} index={0} isDark={isDarkTheme} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {/* Category Title and Subtitle for DRINKS */}
              {categoryFilter === 'DRINKS' && filteredProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-8 text-center"
                >
                  <h3 
                    className={`text-3xl md:text-4xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                    style={{ 
                      color: isDarkTheme ? '#FF6B9D' : primaryColor,
                      textShadow: isDarkTheme 
                        ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {t.drinksTitle}
                  </h3>
                  <p className={`mb-2 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>
                    {t.drinksSubtitle}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
                    {t.drinksDeposit}
                  </p>
                  <div className="h-1 w-32 rounded mx-auto mt-4" style={{ backgroundColor: primaryColor }}></div>
                </motion.div>
              )}

              {/* Category Title and Subtitle for STANGLE */}
              {categoryFilter === 'STANGLE' && filteredProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-8 text-center"
                >
                  <h3 
                    className={`text-3xl md:text-4xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                    style={{ 
                      color: isDarkTheme ? '#FF6B9D' : primaryColor,
                      textShadow: isDarkTheme 
                        ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    🥖 {t.stangleTitle}
                  </h3>
                  <p className={`mb-2 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>
                    💬 {t.stangleSubtitle}
                  </p>
                  <div className="h-1 w-32 rounded mx-auto mt-4" style={{ backgroundColor: primaryColor }}></div>
                </motion.div>
              )}

              {/* Category Title and Subtitle for SOUPS */}
              {categoryFilter === 'SOUPS' && filteredProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-8 text-center"
                >
                  <h3 
                    className={`text-3xl md:text-4xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                    style={{ 
                      color: isDarkTheme ? '#FF6B9D' : primaryColor,
                      textShadow: isDarkTheme 
                        ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    🥴 {t.soupsTitle}
                  </h3>
                  <p className={`mb-2 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>
                    {t.soupsSubtitle}
                  </p>
                  <div className="h-1 w-32 rounded mx-auto mt-4" style={{ backgroundColor: primaryColor }}></div>
                </motion.div>
              )}

              {/* Category Title and Subtitle for DESSERTS */}
              {categoryFilter === 'DESSERTS' && filteredProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-8 text-center"
                >
                  <h3 
                    className={`text-3xl md:text-4xl font-black mb-2 ${isDarkTheme ? 'text-porno-glow' : ''}`}
                    style={{ 
                      color: isDarkTheme ? '#FF6B9D' : primaryColor,
                      textShadow: isDarkTheme 
                        ? '0 0 20px rgba(255, 107, 157, 0.7), 0 0 40px rgba(255, 107, 157, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {t.dessertsTitle}
                  </h3>
                  <p className={`mb-2 text-lg ${isDarkTheme ? 'text-gray-400' : ''}`} style={{ color: isDarkTheme ? '#999' : '#666666' }}>
                    {t.dessertsSubtitle}
                  </p>
                  <div className="h-1 w-32 rounded mx-auto mt-4" style={{ backgroundColor: primaryColor }}></div>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} isDark={isDarkTheme} />
                ))}
              </div>
            </>
          )}

          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">😕</div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-700'}`}>No items found</h3>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>Try a different category</p>
            </motion.div>
          )}
        </div>
      </section>

      <Footer tenantName={tenant.name} primaryColor={tenant.theme.primaryColor} />
      <Cart tenant={tenant} isDark={isDarkTheme} />
    </div>
  );
}
