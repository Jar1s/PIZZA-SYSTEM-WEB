'use client';

import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';

interface CartItemProps {
  item: {
    id: string;
    product: {
      id: string;
      name: string;
      priceCents: number;
      image?: string | null;
    };
    quantity: number;
    modifiers?: any;
  };
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { t } = useLanguage();
  const price = (item.product.priceCents / 100).toFixed(2);
  const total = ((item.product.priceCents * item.quantity) / 100).toFixed(2);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex gap-4 mb-4 pb-4 border-b"
    >
      {item.product.image && (
        <div className="relative h-20 w-20 flex-shrink-0">
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            sizes="80px"
            className="object-cover rounded"
            onError={(e) => {
              console.error('Failed to load cart item image:', item.product.image);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{item.product.name}</h3>
        <p className="text-sm text-gray-600">€{price} {t.each}</p>
        
        {/* Customizations/Modifiers */}
        {(() => {
          if (!item.modifiers) return null;
          const modifiers = formatModifiers(item.modifiers);
          if (modifiers.length === 0) return null;
          return (
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              {modifiers.map((mod, idx) => (
                <div key={idx}>• {mod}</div>
              ))}
            </div>
          );
        })()}
        
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
          >
            −
          </button>
          
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
          >
            +
          </button>
          
          <button
            onClick={() => removeItem(item.id)}
            className="ml-auto text-red-500 hover:text-red-700 text-sm font-semibold"
          >
            {t.remove}
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold">€{total}</p>
      </div>
    </motion.div>
  );
}


