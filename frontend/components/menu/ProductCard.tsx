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
  }, [product.image]);
  
  // Get tenant from context
  // Memoize computed values
  const price = useMemo(() => (product.priceCents / 100).toFixed(2), [product.priceCents]);
  
  // Get translated product name, description, weight and allergens
  const translation = useMemo(() => getProductTranslation(product.name, language), [product.name, language]);
  const displayName = useMemo(() => translation.name || product.name, [translation.name, product.name]);
  const displayDescription = useMemo(() => translation.description || product.description, [translation.description, product.description]);
  
  // Check if product is a pizza that needs customization
  const isPizza = useMemo(() => product.category === 'PIZZA', [product.category]);
  
  const handleAddToCart = useCallback(() => {
    console.log('handleAddToCart called', { isPizza, product: product.name });
    if (isPizza) {
      // Open customization modal for pizzas
      console.log('Opening customization modal');
      setShowCustomization(true);
    } else {
      // Direct add for non-pizza items
      console.log('Adding product directly to cart', product);
      setIsAdding(true);
      addItem(product);
      toast.success(`${displayName} pridané do košíka!`);
      
      // Visual feedback
      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    }
  }, [isPizza, addItem, product, toast, displayName]);

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
        {product.image && !imageError ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
            
            <Image
              src={product.image}
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
                console.error('Image failed to load:', product.image, product.name, 'retry:', retryCount);
                
                // Retry logic - try again max 2 times
                if (retryCount < 2) {
                  setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    setImageLoading(true);
                    // Force reload by adding cache busting parameter
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src && !img.src.includes('retry=')) {
                      const separator = img.src.includes('?') ? '&' : '?';
                      img.src = `${product.image}${separator}retry=${retryCount + 1}&t=${Date.now()}`;
                    }
                  }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
                } else {
                  // After 2 retries, show placeholder
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
          <div className="absolute inset-x-0 top-4 px-4 flex justify-between gap-2">
            {isBestSeller && (
              <span className={`${isDark ? 'hero-badge text-[0.6rem]' : 'rounded-full bg-red-600 text-white text-xs font-semibold px-3 py-1 shadow'} whitespace-nowrap`}>
                🔥 {t.bestSellersTitle}
              </span>
            )}
            {isPremium && (
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold shadow ${
                isDark ? 'bg-white/15 border border-white/30 text-white backdrop-blur' : 'bg-red-500 text-white'
              }`}>
                {t.premium}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-grow min-h-[240px] sm:min-h-[260px] md:min-h-[280px]">
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
        <div className={`flex items-center gap-4 mb-2 text-xs h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {translation.weight && (
            <div className="flex items-center gap-1">
              <span>⚖️</span>
              <span>{translation.weight}</span>
            </div>
          )}
          {translation.allergens && translation.allergens.length > 0 && (
            <div className="flex items-center gap-1">
              <span>{translation.allergens.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Price & Add Button - Always at bottom */}
        <div className="flex items-center justify-between gap-3 pt-4">
          <div>
            <div 
              className="text-3xl font-bold" 
              style={{ 
                color: 'var(--color-primary)',
                textShadow: 'none',
                letterSpacing: '0'
              }}
            >
              €{price}
            </div>
            {isPremium && (
              <p className="text-xs uppercase tracking-widest text-gray-400">{t.premium}</p>
            )}
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔵 Button clicked, calling handleAddToCart', { product: product.name, isPizza });
              handleAddToCart();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            disabled={isAdding}
            className={`relative z-10 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base text-white transition-all hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] ${
              isAdding 
                ? 'bg-green-500' 
                : isDark
                  ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55] shadow-lg'
                  : 'shadow-md hover:shadow-lg'
            }`}
            style={!isAdding && !isDark ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                ✓ {t.added}
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
      {isPizza && (
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
