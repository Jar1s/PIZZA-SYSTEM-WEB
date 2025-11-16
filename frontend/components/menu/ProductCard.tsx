'use client';

import { Product, Tenant } from '@/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { getProductTranslation } from '@/lib/product-translations';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';

// Lazy load CustomizationModal (only loads when needed)
const CustomizationModal = dynamic(() => import('./CustomizationModal'), {
  loading: () => null,
  ssr: false,
});

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { t, language } = useLanguage();
  const toast = useToastContext();
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Check if PornoPizza for skin tone background - we need to get tenant from context or prop
  // For now, check hostname as fallback
  const isPornopizza = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname.includes('pornopizza');
    }
    return false;
  }, []);
  
  // Memoize computed values
  const price = useMemo(() => (product.priceCents / 100).toFixed(2), [product.priceCents]);
  
  // Get translated product name, description, weight and allergens
  const translation = useMemo(() => getProductTranslation(product.name, language), [product.name, language]);
  const displayName = useMemo(() => translation.name || product.name, [translation.name, product.name]);
  const displayDescription = useMemo(() => translation.description || product.description, [translation.description, product.description]);
  
  // Check if product is a pizza that needs customization
  const isPizza = useMemo(() => product.category === 'PIZZA', [product.category]);
  
  const handleAddToCart = useCallback(() => {
    if (isPizza) {
      // Open customization modal for pizzas
      setShowCustomization(true);
    } else {
      // Direct add for non-pizza items
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
      className={`group relative rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full ${
        isPornopizza ? 'bg-skin-tone relative' : 'bg-white'
      }`}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-100 flex-shrink-0">
        {product.image && !imageError ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading={index < 6 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
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
        {product.priceCents >= 1100 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            Premium
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow min-h-[280px]">
        {/* Product Name - Fixed height to align descriptions */}
        <div className="h-16 mb-2 flex items-start">
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
            {displayName}
          </h3>
        </div>
        
        {/* Description - Fixed height for consistent alignment */}
        <div className="h-12 mb-3">
          {displayDescription && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {displayDescription}
            </p>
          )}
        </div>
        
        {/* Spacer to push content to bottom */}
        <div className="flex-grow"></div>

        {/* Weight and Allergens - Just above price */}
        <div className="flex items-center gap-4 mb-2 text-xs text-gray-500 h-5">
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
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
            €{price}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
              isAdding 
                ? 'bg-green-500' 
                : 'shadow-md hover:shadow-lg'
            }`}
            style={!isAdding ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                ✓ {t.added}
              </span>
            ) : (
              <span>{t.add}</span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 border-4 border-transparent group-hover:border-primary rounded-2xl transition-all duration-300 pointer-events-none" style={{ borderColor: 'transparent' }} />

      {/* Customization Modal */}
      {isPizza && (
        <CustomizationModal
          product={product}
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          onAddToCart={handleCustomizedAdd}
        />
      )}
    </motion.div>
  );
});


