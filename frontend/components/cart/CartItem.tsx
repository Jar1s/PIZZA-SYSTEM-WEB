'use client';

import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { getProductTranslation, getProductDisplayName } from '@/lib/product-translations';
import { getProductDisplayImage } from '@/lib/product-images';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { useMemo } from 'react';
import { calculateModifierPrice } from '@/lib/calculate-modifier-price';

interface CartItemProps {
  item: {
    id: string;
    product: {
      id: string;
      name: string;
      priceCents: number;
      category?: string;
      image?: string | null;
    };
    quantity: number;
    modifiers?: any;
  };
  variant?: 'dark' | 'light';
}

export function CartItem({ item, variant = 'light' }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { t, language } = useLanguage();
  const { tenant } = useTenant();
  const customizationLabels = tenant?.theme?.customizationLabels;
  const modifierPrice = useMemo(() => 
    calculateModifierPrice(item.modifiers, item.product.category), 
    [item.modifiers, item.product.category]
  );
  const itemPrice = item.product.priceCents + modifierPrice;
  const price = (itemPrice / 100).toFixed(2);
  const total = ((itemPrice * item.quantity) / 100).toFixed(2);
  const isDark = variant === 'dark';
  
  // Get translated product name
  const translation = useMemo(() => getProductTranslation(item.product.name, language), [item.product.name, language]);
  // Use centralized function: DB displayName → translation mapping → original name
  const displayName = useMemo(() => {
    return getProductDisplayName(item.product, language);
  }, [item.product, language]);
  
  // Use centralized image logic
  const displayImage = useMemo(() => {
    return getProductDisplayImage(item.product, translation.name);
  }, [item.product, translation.name]);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`flex gap-4 rounded-2xl p-4 border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
      }`}
    >
      {displayImage && (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={displayImage}
            alt={item.product.name}
            fill
            sizes="80px"
            quality={75}
            className="object-cover"
            loading="lazy"
            onError={(e) => {
              console.error('Failed to load cart item image:', displayImage);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayName}</h3>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>€{price} {t.each}</p>
        
        {/* Customizations/Modifiers */}
        {(() => {
          if (!item.modifiers) return null;
          const modifiers = formatModifiers(item.modifiers, false, language, customizationLabels);
          if (modifiers.length === 0) return null;
          return (
            <div className={`text-xs mt-1 space-y-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {modifiers.map((mod, idx) => (
                <div key={idx}>• {mod}</div>
              ))}
            </div>
          );
        })()}
        
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-colors ${
              isDark ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            −
          </button>
          
          <span className={`w-8 text-center font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
          
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-colors ${
              isDark ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            +
          </button>
          
          <button
            onClick={() => removeItem(item.id)}
            className={`ml-auto text-sm font-semibold ${
              isDark ? 'text-rose-300 hover:text-rose-200' : 'text-red-500 hover:text-red-700'
            }`}
          >
            {t.remove}
          </button>
        </div>
      </div>
      
      <div className={`text-right font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        €{total}
      </div>
    </motion.div>
  );
}

