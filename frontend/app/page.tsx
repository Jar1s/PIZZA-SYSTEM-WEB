'use client';

import { useEffect, useState } from 'react';
import { getProducts, getTenant } from '@/lib/api';
import { Product, Tenant } from '@/shared';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductSkeleton } from '@/components/menu/ProductSkeleton';
import { HeroSection } from '@/components/home/HeroSection';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Cart } from '@/components/cart/Cart';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

type CategoryFilter = 'all' | 'PIZZA' | 'SIDES' | 'DRINKS' | 'DESSERTS' | 'SAUCES';

export default function HomePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
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
        
        const [productsData, tenantData] = await Promise.all([
          getProducts(tenantSlug),
          getTenant(tenantSlug),
        ]);
        setProducts(productsData);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Get filtered products
  const filteredProducts = categoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  // Category counts
  const categoryCounts = {
    all: products.length,
    PIZZA: productsByCategory.PIZZA?.length || 0,
    STANGLE: productsByCategory.STANGLE?.length || 0,
    SOUPS: productsByCategory.SOUPS?.length || 0,
    DRINKS: productsByCategory.DRINKS?.length || 0,
    DESSERTS: productsByCategory.DESSERTS?.length || 0,
  };

  // Category emoji map
  const categoryEmoji: Record<string, string> = {
    all: '🍕',
    PIZZA: '🍕',
    STANGLE: '🥖',
    SOUPS: '🍲',
    DRINKS: '🥤',
    DESSERTS: '🍰',
  };

  // Category labels
  const categoryLabels: Record<string, string> = {
    all: t.allMenu,
    PIZZA: t.pizzas,
    STANGLE: t.stangle,
    SOUPS: t.soups,
    DRINKS: t.drinks,
    DESSERTS: t.desserts,
  };

  // Category display order (pizzas first!)
  const categoryOrder = ['PIZZA', 'STANGLE', 'SOUPS', 'DRINKS', 'DESSERTS'];
  
  // Get ordered categories that have products
  const orderedCategories = categoryOrder.filter(cat => productsByCategory[cat]?.length > 0);

  if (loading || !tenant) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Cart */}
      <Header tenant={tenant} />
      
      {/* Hero Section */}
      <HeroSection 
        tenantName={tenant.name} 
        primaryColor={tenant.theme.primaryColor} 
      />

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
          {(Object.keys(categoryCounts) as CategoryFilter[]).map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                categoryFilter === category
                  ? 'text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
              style={categoryFilter === category ? { backgroundColor: tenant.theme.primaryColor } : {}}
            >
              <span className="mr-2">{categoryEmoji[category]}</span>
              {categoryLabels[category]} ({categoryCounts[category]})
            </button>
          ))}
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
