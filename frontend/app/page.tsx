'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getProducts, getTenant } from '@/lib/api';
import { Product, Tenant } from '@/shared';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductSkeleton } from '@/components/menu/ProductSkeleton';
import { HeroSection } from '@/components/home/HeroSection';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

// Lazy load Cart component (only loads when needed)
const Cart = dynamic(() => import('@/components/cart/Cart').then(mod => ({ default: mod.Cart })), {
  ssr: false,
});

type CategoryFilter = 'all' | 'PIZZA' | 'SIDES' | 'DRINKS' | 'DESSERTS' | 'SAUCES';

export default function HomePage() {
  const { t } = useLanguage();
  const toast = useToastContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        // Get tenant slug from hostname
        const hostname = window.location.hostname;
        let tenantSlug = 'pornopizza'; // default
        
        if (hostname.includes('pornopizza')) {
          tenantSlug = 'pornopizza';
        } else if (hostname.includes('pizzavnudzi')) {
          tenantSlug = 'pizzavnudzi';
        } else if (hostname.includes('localhost')) {
          // Check for tenant query param or default
          const params = new URLSearchParams(window.location.search);
          tenantSlug = params.get('tenant') || 'pornopizza';
        }
        
        console.log('Loading data for tenant:', tenantSlug);
        
        const [productsData, tenantData] = await Promise.all([
          getProducts(tenantSlug),
          getTenant(tenantSlug),
        ]);
        
        console.log('Data loaded:', { products: productsData.length, tenant: tenantData.name });
        
        setProducts(productsData);
        setTenant(tenantData);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        const errorMessage = error.message || 'Nepodarilo sa načítať dáta. Skontrolujte, či beží backend na http://localhost:3000';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    // "Vyskladaj si vlastnú pizzu" should be first in PIZZA category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        // Special handling for PIZZA category
        if (category === 'PIZZA') {
          const aIsBuildYourOwn = a.name === 'Vyskladaj si vlastnú pizzu' || a.name === 'Build Your Own Pizza';
          const bIsBuildYourOwn = b.name === 'Vyskladaj si vlastnú pizzu' || b.name === 'Build Your Own Pizza';
          
          if (aIsBuildYourOwn && !bIsBuildYourOwn) return -1;
          if (!aIsBuildYourOwn && bIsBuildYourOwn) return 1;
        }
        
        // Default: sort by name
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

  // Category emoji map (static)
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

  // Category display order (pizzas first!)
  const categoryOrder = useMemo(() => ['PIZZA', 'STANGLE', 'SOUPS', 'DRINKS', 'DESSERTS'], []);
  
  // Get ordered categories that have products (memoized)
  const orderedCategories = useMemo(() => {
    return categoryOrder.filter(cat => productsByCategory[cat]?.length > 0);
  }, [productsByCategory, categoryOrder]);

  // Memoize category filter handler
  const handleCategoryFilter = useCallback((category: CategoryFilter) => {
    setCategoryFilter(category);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-[600px] bg-gray-300 animate-pulse" />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nepodarilo sa načítať dáta</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const hostname = window.location.hostname;
                let tenantSlug = 'pornopizza';
                
                if (hostname.includes('pornopizza')) {
                  tenantSlug = 'pornopizza';
                } else if (hostname.includes('pizzavnudzi')) {
                  tenantSlug = 'pizzavnudzi';
                } else if (hostname.includes('localhost')) {
                  const params = new URLSearchParams(window.location.search);
                  tenantSlug = params.get('tenant') || 'pornopizza';
                }
                
                const [productsData, tenantData] = await Promise.all([
                  getProducts(tenantSlug),
                  getTenant(tenantSlug),
                ]);
                
                setProducts(productsData);
                setTenant(tenantData);
              } catch (error: any) {
                const errorMessage = error.message || 'Nepodarilo sa načítať dáta';
                setError(errorMessage);
                toast.error(errorMessage);
              } finally {
                setLoading(false);
              }
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
            style={{ backgroundColor: tenant?.theme.primaryColor || '#FF6B00' }}
          >
            Skúsiť znova
          </button>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tenant nenájdený</h2>
          <p className="text-gray-600 mb-6 text-sm">Nepodarilo sa načítať informácie o tenantovi.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            Obnoviť stránku
          </button>
        </div>
      </div>
    );
  }

  // Check maintenance mode
  const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
    ? tenant.theme as any
    : {};
  const maintenanceMode = theme.maintenanceMode === true;

  // Get tenant slug for conditional styling - use tenant data directly
  const isPornopizza = tenant.slug === 'pornopizza' || tenant.subdomain === 'pornopizza' || tenant.name?.toLowerCase().includes('pornopizza');
  
  // Skin tone background for PornoPizza, white for others - darker for more contrast
  const backgroundClass = isPornopizza ? 'bg-skin-tone' : 'bg-gray-50'; // Warmer, darker skin tone with animated pattern

  return (
    <div className={`${backgroundClass}`} style={isPornopizza ? { minHeight: '100vh', position: 'relative' } : {}}>
      {/* Header with Cart */}
      <Header tenant={tenant} />
      
      {/* Maintenance Banner */}
      {maintenanceMode && (
        <div className="bg-[#fefaf5] border-b border-orange-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#f97316] mb-1">
                  Momentálne neprijímame nové objednávky!
                </h2>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs">Príprava na začatie práce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <HeroSection 
        tenantName={tenant.name} 
        primaryColor={tenant.theme.primaryColor} 
      />

      {/* Best Sellers Section */}
      {productsByCategory.PIZZA && productsByCategory.PIZZA.length > 0 && (() => {
        // Filter out "Vyskladaj si vlastnú pizzu" from Best Sellers
        const bestSellerPizzas = productsByCategory.PIZZA.filter(
          p => p.name !== 'Vyskladaj si vlastnú pizzu' && p.name !== 'Build Your Own Pizza'
        ).slice(0, 4);
        
        if (bestSellerPizzas.length === 0) return null;
        
        return (
          <section className="container mx-auto px-4 py-16" style={{ position: 'relative', zIndex: 10 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl font-bold mb-4" style={{ color: tenant.theme.primaryColor }}>
                {t.bestSellersTitle}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t.bestSellersSubtitle}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {bestSellerPizzas.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          </section>
        );
      })()}

      {/* Menu Section */}
      <section id="menu" className="container mx-auto px-4 py-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold mb-4" style={{ color: tenant.theme.primaryColor }}>
            {t.menuTitle}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.menuSubtitle}
          </p>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {(Object.keys(categoryCounts) as CategoryFilter[]).map((category) => {
            // Skip categories with 0 products
            if (categoryCounts[category] === 0) return null;
            
            return (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  categoryFilter === category
                    ? 'text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-gray-100 shadow bg-white'
                }`}
                style={categoryFilter === category 
                  ? { backgroundColor: tenant.theme.primaryColor }
                  : {}
                }
              >
                <span className="mr-2">{categoryEmoji[category]}</span>
                {categoryLabels[category]}
              </button>
            );
          })}
        </motion.div>

        {/* Products by Category */}
        {categoryFilter === 'all' ? (
          // Show all categories separately (pizzas first!)
          <>
            {orderedCategories.map((category) => {
              const categoryProducts = productsByCategory[category];
              return (
              <div key={category} className="mb-16">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <h3 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: tenant.theme.primaryColor }}>
                    <span className="text-5xl">{categoryEmoji[category]}</span>
                    {categoryLabels[category]}
                    <span className="text-2xl text-gray-500 font-normal">
                      ({categoryProducts.length})
                    </span>
                  </h3>
                  <div className="h-1 w-32 rounded" style={{ backgroundColor: tenant.theme.primaryColor }}></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              </div>
            )})}
          </>
        ) : (
          // Show filtered category only
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">Try a different category</p>
          </motion.div>
        )}
      </section>

      {/* Footer */}
      <Footer tenantName={tenant.name} primaryColor={tenant.theme.primaryColor} />
      
      {/* Cart Sidebar */}
      <Cart />
    </div>
  );
}
