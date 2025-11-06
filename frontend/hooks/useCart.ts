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
        const existingItem = items.find(i => i.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...items, { id: product.id, product, quantity: 1, modifiers }],
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
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    { name: 'cart-storage' }
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


