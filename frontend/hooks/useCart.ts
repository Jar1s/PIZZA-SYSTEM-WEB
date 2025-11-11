'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/shared';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  modifiers?: any;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, modifiers?: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (product, modifiers) => {
        const items = get().items;
        
        // Create unique ID based on product ID and modifiers
        // This ensures items with different customizations are treated as separate items
        const modifiersKey = modifiers ? JSON.stringify(modifiers) : '';
        const uniqueId = `${product.id}-${modifiersKey}`;
        
        // Find existing item with same product ID AND same modifiers
        const existingItem = items.find(i => {
          const iModifiersKey = i.modifiers ? JSON.stringify(i.modifiers) : '';
          const iUniqueId = `${i.product.id}-${iModifiersKey}`;
          return iUniqueId === uniqueId;
        });
        
        if (existingItem) {
          // Same product with same customizations - increase quantity
          set({
            items: items.map(i =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            isOpen: true,
          });
        } else {
          // New item (different product or different customizations)
          set({
            items: [...items, { id: uniqueId, product, quantity: 1, modifiers }],
            isOpen: true,
          });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map(i =>
              i.id === id ? { ...i, quantity } : i
            ),
          });
        }
      },
      
      clearCart: () => set({ items: [] }),
      openCart: () => {
        console.log('openCart called');
        set({ isOpen: true });
      },
      closeCart: () => set({ isOpen: false }),
    }),
    { 
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items, not isOpen
    }
  )
);

// Selector for computing total
export const useCartTotal = () => {
  const items = useCart((state) => state.items);
  return items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );
};


