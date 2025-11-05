'use client';

import { Product } from '@/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductTranslation } from '@/lib/product-translations';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CustomizationModal from './CustomizationModal';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { t, language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  
  const price = (product.priceCents / 100).toFixed(2);
  
  // Get translated product name and description
  const translation = getProductTranslation(product.name, language);
  const displayName = translation.name || product.name;
  const displayDescription = translation.description || product.description;
  
  // Check if product is a pizza that needs customization
  const isPizza = product.category === 'PIZZA';
  
  const handleAddToCart = async () => {
    if (isPizza) {
      // Open customization modal for pizzas
      setShowCustomization(true);
    } else {
      // Direct add for non-pizza items
      setIsAdding(true);
      addItem(product);
      
      // Visual feedback
      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    }
  };

  const handleCustomizedAdd = (customizations: Record<string, string[]>, totalPrice: number) => {
    setIsAdding(true);
    // Add item with customizations and custom price
    addItem({
      ...product,
      priceCents: totalPrice,
      // Store customizations in description or a custom field
      description: `${product.description || ''}\n[Customized]`,
    });
    
    setTimeout(() => {
      setIsAdding(false);
    }, 800);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
      className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-100 flex-shrink-0">
        {product.image ? (
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
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        
        {displayDescription && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {displayDescription}
          </p>
        )}

        {/* Price & Add Button - Pushed to bottom */}
        <div className="flex items-center justify-between mt-auto">
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
              <span className="flex items-center gap-2">
                🛒 {t.add}
              </span>
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
}


