'use client';

import { Product } from '@pizza-ecosystem/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { getProductTranslation } from '@/lib/product-translations';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import CustomizationModal from './CustomizationModal';

const drinkImageMap: Record<string, string> = {
  'bonaqua nesýtená 1,5l': '/images/drinks/bonaqua-nesytna.svg',
  'bonaqua nesytena 1,5l': '/images/drinks/bonaqua-nesytna.svg',
  'bonaqua sýtená 1,5l': '/images/drinks/bonaqua-sytena.jpg',
  'bonaqua sytena 1,5l': '/images/drinks/bonaqua-sytena.jpg',
  'bonaqua sýtená': '/images/drinks/bonaqua-sytena.jpg',
  'bonaqua sytena': '/images/drinks/bonaqua-sytena.jpg',
  'bon aqua sýtená': '/images/drinks/bonaqua-sytena.jpg',
  'bon aqua sytena': '/images/drinks/bonaqua-sytena.jpg',
  'kofola 2l': '/images/drinks/kofola-2l.svg',
  'pepsi 1l': '/images/drinks/pepsi-1l.svg',
  'pepsi zero 1l': '/images/drinks/pepsi-zero-1l.svg',
  'sprite 1l': '/images/drinks/sprite-1l.svg',
  'fanta 1l': '/images/drinks/fanta-1l.svg',
  'coca cola 1l': '/images/drinks/coca-cola-1l.jpg',
  'coca-cola 1l': '/images/drinks/coca-cola-1l.jpg',
  'coca cola classic': '/images/drinks/coca-cola-1l.jpg',
  'coca-cola classic': '/images/drinks/coca-cola-1l.jpg',
  'cola zero 1l': '/images/drinks/cola-zero-1l.svg',
};

interface ProductCardProps {
  product: Product;
  index?: number;
  isBestSeller?: boolean; // Indicates if this product is from Best Sellers section
  isDark?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, index = 0, isBestSeller = false, isDark = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { t, language } = useLanguage();
  const toast = useToastContext();
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const isPremium = useMemo(() => product.priceCents >= 1100, [product.priceCents]);
  
  // Reset image state when product changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setRetryCount(0);
  }, [product.image, product.name]);
  
  // Get tenant from context
  // Memoize computed values
  const price = useMemo(() => (product.priceCents / 100).toFixed(2), [product.priceCents]);
  
  // Get translated product name, description, weight and allergens
  const translation = useMemo(() => getProductTranslation(product.name, language), [product.name, language]);
  const displayName = useMemo(() => translation.name || product.name, [translation.name, product.name]);
  const displayDescription = useMemo(() => translation.description || product.description, [translation.description, product.description]);
  const fallbackImage = useMemo(() => {
    // Check if product is a drink and has a fallback image
    if (product.category === 'DRINKS') {
      const key = product.name.toLowerCase().trim();
      const translatedKey = translation.name?.toLowerCase().trim();
      // Try multiple variations
      const variations = [
        key,
        translatedKey,
        key.replace(/[.,]/g, ''), // Remove dots and commas
        translatedKey?.replace(/[.,]/g, ''),
        key.replace(/\s+/g, ' '), // Normalize spaces
        translatedKey?.replace(/\s+/g, ' '),
      ].filter(Boolean);
      
      for (const variation of variations) {
        if (variation && drinkImageMap[variation]) {
          console.log(`[ProductCard] Found fallback for "${product.name}": ${drinkImageMap[variation]} (matched: "${variation}")`);
          return drinkImageMap[variation];
        }
      }
      console.log(`[ProductCard] No fallback found for drink "${product.name}" (key: "${key}", translated: "${translatedKey}")`);
    }
    return undefined;
  }, [product.name, product.category, translation.name]);
  
  // Use fallback if image is null, empty string, or undefined
  const displayImage = (product.image && product.image.trim() !== '') ? product.image : fallbackImage;
  
  // Debug logging
  useEffect(() => {
    if (product.category === 'DRINKS') {
      console.log(`[ProductCard] Drink product:`, {
        name: product.name,
        category: product.category,
        image: product.image,
        fallbackImage,
        displayImage,
      });
    }
  }, [product.name, product.category, product.image, fallbackImage, displayImage]);
  
  // Check if product needs customization (PIZZA or STANGLE)
  const needsCustomization = useMemo(() => {
    return product.category === 'PIZZA' || product.category === 'STANGLE';
  }, [product.category]);
  
  const handleAddToCart = useCallback(() => {
    console.log('handleAddToCart called', { needsCustomization, product: product.name, category: product.category });
    if (needsCustomization) {
      // Open customization modal for pizzas and stangle products
      console.log('Opening customization modal');
      setShowCustomization(true);
    } else {
      // Direct add for items that don't need customization
      console.log('Adding product directly to cart', product);
      setIsAdding(true);
      addItem(product);
      toast.success(`${displayName} pridané do košíka!`);
      
      // Visual feedback
      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    }
  }, [needsCustomization, addItem, product, toast, displayName]);

  const handleCustomizedAdd = useCallback((customizations: Record<string, string[]>, totalPrice: number) => {
    setIsAdding(true);
    // Add item with customizations and custom price
    addItem(
      {
        ...product,
        priceCents: totalPrice,
      },
      customizations // Pass modifiers as second parameter
    );
    toast.success(`${displayName} pridané do košíka!`);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 800);
  }, [addItem, product, toast, displayName]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
      className={`group relative overflow-hidden transition-all duration-300 flex flex-col h-full rounded-3xl ${
          isDark
            ? 'card-sexy border border-white/10'
            : 'bg-white shadow-lg'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      {isDark && <span className="product-card-gradient" aria-hidden />}
      {/* Image Container */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-100 flex-shrink-0">
        {displayImage && !imageError ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
            
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 4 || isBestSeller}
              quality={85}
              loading={index < 4 ? "eager" : "lazy"}
              className={`object-cover group-hover:scale-110 transition-all duration-500 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                setImageLoading(false);
                setRetryCount(0);
              }}
              onError={(e) => {
                console.error('Image failed to load:', displayImage, 'Product:', product.name, 'Category:', product.category, 'Fallback:', fallbackImage, 'retry:', retryCount);
                
                // If we're using fallback and it fails, or if we tried product.image and it failed, try fallback
                if (displayImage === product.image && fallbackImage && retryCount === 0) {
                  // Try fallback image instead
                  console.log('Trying fallback image:', fallbackImage);
                  setRetryCount(1);
                  setImageLoading(true);
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = fallbackImage;
                  return;
                }
                
                // Retry logic - try again max 2 times
                if (retryCount < 2) {
                  setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    setImageLoading(true);
                    // Force reload by adding cache busting parameter
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src && !img.src.includes('retry=')) {
                      const separator = img.src.includes('?') ? '&' : '?';
                      img.src = `${displayImage}${separator}retry=${retryCount + 1}&t=${Date.now()}`;
                    }
                  }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
                } else {
                  // After 2 retries, show placeholder
                  console.log('All image loading attempts failed, showing placeholder');
                  setImageError(true);
                  setImageLoading(false);
                }
              }}
            />
            
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-6xl">🍕</span>
          </div>
        )}
        
        {/* Premium Badge */}
        {(isBestSeller || isPremium) && (
          <div className="absolute inset-x-0 top-2 sm:top-3 md:top-4 px-2 sm:px-3 md:px-4 flex justify-between items-start gap-1 sm:gap-2 z-10">
            {isBestSeller && (
              <span className={`${isDark ? 'hero-badge text-[0.5rem] sm:text-[0.6rem]' : 'rounded-full bg-red-600 text-white text-[0.6rem] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 shadow'} whitespace-nowrap flex-shrink-0`}>
                🔥 <span className="hidden sm:inline">{t.bestSellersTitle}</span>
              </span>
            )}
            {isPremium && (
              <span className={`ml-auto rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[0.6rem] sm:text-xs font-bold shadow flex-shrink-0 ${
                isDark ? 'bg-white/20 border border-white/40 text-white backdrop-blur-sm' : 'bg-red-500 text-white'
              }`}>
                {t.premium}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-grow min-h-[220px] sm:min-h-[240px] md:min-h-[260px] lg:min-h-[280px]">
        {/* Product Name - Fixed height to align descriptions */}
        <div className="h-16 mb-2 flex items-start">
          <h3 
            className={`text-2xl font-bold transition-colors ${isDark ? 'text-porno-glow' : 'text-gray-900 group-hover:text-primary'}`}
            style={isDark ? {
              color: '#FF9900',
              textShadow: 'none',
              letterSpacing: '0'
            } : {}}
          >
            {displayName}
          </h3>
        </div>
        
        {/* Description - Fixed height for consistent alignment */}
        <div className="h-12 mb-3">
          {displayDescription && (
            <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {displayDescription}
            </p>
          )}
        </div>
        
        {/* Spacer to push content to bottom */}
        <div className="flex-grow"></div>

        {/* Weight and Allergens - Just above price */}
        {/* Používame weightGrams a allergens z databázy, fallback na translation */}
        {(() => {
          const weight = (product as any).weightGrams ? `${(product as any).weightGrams}g` : translation.weight;
          const allergens = ((product as any).allergens && (product as any).allergens.length > 0) ? (product as any).allergens : translation.allergens;
          
          return (weight || allergens) ? (
            <div className={`flex items-center gap-4 mb-2 text-xs h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {weight && (
                <div className="flex items-center gap-1">
                  <span>⚖️</span>
                  <span>{weight}</span>
                </div>
              )}
              {allergens && allergens.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>{allergens.join(', ')}</span>
                </div>
              )}
            </div>
          ) : null;
        })()}

        {/* Price & Add Button - Always at bottom */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-4 overflow-hidden">
          <div className="flex-shrink-0 min-w-0 flex-1">
            <div 
              className="text-xl sm:text-2xl md:text-3xl font-bold truncate" 
              style={{ 
                color: 'var(--color-primary)',
                textShadow: 'none',
                letterSpacing: '0'
              }}
            >
              €{price}
            </div>
            {isPremium && (
              <p className="text-[0.6rem] sm:text-xs uppercase tracking-widest text-gray-400 hidden sm:block">{t.premium}</p>
            )}
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔵 Button clicked, calling handleAddToCart', { product: product.name, needsCustomization });
              handleAddToCart();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            disabled={isAdding}
            className={`relative z-10 flex-shrink-0 px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-bold text-[0.7rem] sm:text-xs md:text-sm lg:text-base text-white transition-all hover:scale-105 active:scale-95 touch-manipulation min-h-[36px] sm:min-h-[40px] md:min-h-[44px] whitespace-nowrap ${
              isAdding 
                ? 'bg-green-500' 
                : isDark
                  ? 'bg-gradient-to-r from-[#E91E63] via-[#ff0066] to-[#ff2d55] shadow-lg'
                  : 'shadow-md hover:shadow-lg'
            }`}
            style={!isAdding && !isDark ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            {isAdding ? (
              <span className="flex items-center gap-1 sm:gap-2">
                ✓ <span className="hidden sm:inline">{t.added}</span>
              </span>
            ) : (
              <span>{t.add}</span>
            )}
          </button>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 border-4 border-transparent group-hover:border-primary rounded-3xl transition-all duration-300 pointer-events-none z-0" style={{ borderColor: 'transparent' }} />

      {/* Customization Modal */}
      {needsCustomization && (
        <CustomizationModal
          product={product}
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          onAddToCart={handleCustomizedAdd}
          hideBackground={isBestSeller}
        />
      )}
    </motion.div>
  );
});
