'use client';

import { Product } from '@pizza-ecosystem/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { getProductTranslation, getProductDisplayName, getLocalizedDescription, getLocalizedSubHeader } from '@/lib/product-translations';
import { getProductFallbackImage, getProductDisplayImage } from '@/lib/product-images';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback, memo, useEffect } from 'react';

const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNlMWUxZTEiLz48L3N2Zz4=';
import { useTenant } from '@/contexts/TenantContext';
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
  const { tenant } = useTenant();
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | undefined>(undefined);
  const isPremium = useMemo(() => product.priceCents >= 1100, [product.priceCents]);
  const primaryColor = tenant?.theme?.primaryColor || 'var(--color-primary)';
  
  // Reset image state when product changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [product.image, product.name]);
  
  // Get tenant from context
  // Memoize computed values
  const price = useMemo(() => (product.priceCents / 100).toFixed(2), [product.priceCents]);
  
  // Get translated product name, description, weight and allergens
  const translation = useMemo(() => getProductTranslation(product.name, language), [product.name, language]);
  const isBuildYourOwn = useMemo(() => {
    const base = `${product.name} ${translation?.name || ''}`.toLowerCase();
    return base.includes('vyskladaj') || base.includes('build your own');
  }, [product.name, translation?.name]);
  
  // Use centralized function: DB displayName → translation mapping → original name
  const displayName = useMemo(() => {
    return getProductDisplayName(product, language);
  }, [product, language]);
  
  const displayDescription = useMemo(() => {
    return getLocalizedDescription(product, language, translation);
  }, [product, language, translation]);
  
  const displaySubHeader = useMemo(() => {
    return getLocalizedSubHeader(product, language);
  }, [product, language]);
  // Use centralized fallback image logic
  const fallbackImage = useMemo(() => {
    return getProductFallbackImage(product.name, translation.name, tenant?.slug);
  }, [product.name, translation.name, tenant?.slug]);
  
  // Use centralized display image logic
  // For soups, always prefer fallback image if available (to override wrong DB images)
  const displayImage = useMemo(() => {
    if (product.category === 'SOUP' || product.category === 'SOUPS') {
      return fallbackImage || (product.image && product.image.trim() !== '' ? product.image : undefined);
    }
    return getProductDisplayImage(product, translation.name, tenant?.slug);
  }, [product, translation.name, fallbackImage, tenant?.slug]);

  const placeholderImage = '/images/placeholder-pizza.webp';

  useEffect(() => {
    setCurrentImageSrc(displayImage || fallbackImage || placeholderImage);
  }, [displayImage, fallbackImage]);

  // Check if product needs customization (PIZZA or STANGLE)
  const needsCustomization = useMemo(() => {
    return product.category === 'PIZZA' || product.category === 'STANGLE';
  }, [product.category]);
  
  const handleAddToCart = useCallback(() => {
    if (needsCustomization) {
      // Open customization modal for pizzas and stangle products
      setShowCustomization(true);
    } else {
      // Direct add for items that don't need customization
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
    // Add item with customizations - keep original product price, modifiers will be calculated when displaying
    addItem(
      product, // Keep original product with original priceCents
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
        {currentImageSrc && !imageError ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
            
            <Image
              src={currentImageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={isBuildYourOwn || isBestSeller || index < 4}
              fetchPriority={isBuildYourOwn || isBestSeller || index < 4 ? 'high' : 'auto'}
              quality={60}
              loading={isBuildYourOwn || isBestSeller || index < 4 ? 'eager' : 'lazy'}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className={`object-cover group-hover:scale-110 transition-all duration-500 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                setImageLoading(false);
              }}
              onError={() => {
                console.error('Image failed to load:', currentImageSrc, 'Product:', product.name, 'Category:', product.category, 'Fallback:', fallbackImage);

                if (fallbackImage && currentImageSrc !== fallbackImage) {
                  setImageLoading(true);
                  setCurrentImageSrc(fallbackImage);
                  return;
                }

                if (currentImageSrc !== placeholderImage) {
                  setImageLoading(true);
                  setCurrentImageSrc(placeholderImage);
                  return;
                }

                setImageError(true);
                setImageLoading(false);
              }}
            />
            
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={fallbackImage || placeholderImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={60}
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              unoptimized
            />
          </div>
        )}
        
        {/* Premium Badge */}
        {(isBestSeller || isPremium) && (
          <div className="absolute inset-x-0 top-2 sm:top-3 md:top-4 px-2 sm:px-3 md:px-4 flex justify-between items-start gap-1 sm:gap-2 z-10">
            {isBestSeller && (
              <span
                className={`${isDark ? 'hero-badge text-[0.5rem] sm:text-[0.6rem]' : 'rounded-full text-white text-[0.6rem] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 shadow'} whitespace-nowrap flex-shrink-0`}
                style={{ background: primaryColor, border: isDark ? `1px solid ${primaryColor}80` : undefined }}
              >
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
        <div className="h-16 mb-1 flex items-start">
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
        
        {/* Sub Header - Hneď pod názvom produktu */}
        {displaySubHeader && (
          <div className="mb-2">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {displaySubHeader}
            </p>
          </div>
        )}
        
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
          // Pre drinky používame inú ikonu
          const weightIcon = product.category === 'DRINKS' ? '🧃' : '⚖️';
          
          return (weight || allergens) ? (
        <div className={`flex items-center gap-4 mb-2 text-xs h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {weight && (
            <div className="flex items-center gap-1">
              <span>{weightIcon}</span>
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
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-4 pr-1">
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
              handleAddToCart();
            }}
            disabled={isAdding}
            className="relative z-10 flex-shrink-0 px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-bold text-[0.7rem] sm:text-xs md:text-sm lg:text-base text-white touch-manipulation min-h-[36px] sm:min-h-[40px] md:min-h-[44px] whitespace-nowrap shadow-md"
            style={{
              backgroundColor: 'var(--color-primary)',
              opacity: isAdding ? 0.7 : 1,
              transition: 'box-shadow 0.2s ease, filter 0.2s ease, opacity 0.2s ease, outline 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isAdding) {
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.filter = '';
              e.currentTarget.style.outline = 'none';
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (!isAdding) {
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.filter = 'brightness(0.95)';
              }
            }}
            onMouseUp={(e) => {
              if (!isAdding) {
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }
            }}
            onFocus={(e) => {
              if (!isAdding) {
                e.currentTarget.style.outline = '2px solid var(--color-primary)';
                e.currentTarget.style.outlineOffset = '2px';
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
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
