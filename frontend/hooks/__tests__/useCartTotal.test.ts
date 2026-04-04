import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart, useCartTotal } from '../useCart';
import { Product } from '@pizza-ecosystem/shared';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useCartTotal', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    // Clean up cart state after each test
    const store = useCart.getState();
    store.clearCart();
  });

  const mockProduct1: Product = {
    id: '1',
    name: 'Pizza 1',
    priceCents: 1000, // €10.00
    category: 'PIZZA',
  };

  const mockProduct2: Product = {
    id: '2',
    name: 'Pizza 2',
    priceCents: 1500, // €15.00
    category: 'PIZZA',
  };

  it('should return 0 for empty cart', () => {
    const { result } = renderHook(() => useCartTotal());
    expect(result.current).toBe(0);
  });

  it('should calculate total for single item', () => {
    const { result: cart } = renderHook(() => useCart());
    const { result: total } = renderHook(() => useCartTotal());

    act(() => {
      cart.current.addItem(mockProduct1);
    });

    expect(total.current).toBe(1000);
  });

  it('should calculate total for multiple items', () => {
    const { result: cart } = renderHook(() => useCart());
    const { result: total } = renderHook(() => useCartTotal());

    act(() => {
      cart.current.addItem(mockProduct1);
      cart.current.addItem(mockProduct2);
    });

    expect(total.current).toBe(2500); // 1000 + 1500
  });

  it('should calculate total with quantities', async () => {
    const { result: cart } = renderHook(() => useCart());
    const { result: total } = renderHook(() => useCartTotal());

    act(() => {
      cart.current.addItem(mockProduct1);
    });
    
    await waitFor(() => {
      expect(cart.current.items.length).toBe(1);
      expect(cart.current.items[0].quantity).toBe(1);
    });

    act(() => {
      cart.current.addItem(mockProduct1); // quantity should become 2
    });
    
    await waitFor(() => {
      expect(cart.current.items.length).toBe(1); // Same item, quantity increased
      expect(cart.current.items[0].quantity).toBe(2);
    });

    act(() => {
      cart.current.addItem(mockProduct2);
    });

    await waitFor(() => {
      expect(cart.current.items.length).toBe(2);
      // Verify quantities
      const product1Item = cart.current.items.find(i => i.product.id === '1');
      const product2Item = cart.current.items.find(i => i.product.id === '2');
      
      expect(product1Item?.quantity).toBe(2);
      expect(product2Item?.quantity).toBe(1);
      // Calculate expected: (1000 * 2) + (1500 * 1) = 2000 + 1500 = 3500
      expect(total.current).toBe(3500);
    });
  });

  it('should update total when quantity changes', async () => {
    const { result: cart } = renderHook(() => useCart());
    const { result: total } = renderHook(() => useCartTotal());

    act(() => {
      cart.current.addItem(mockProduct1);
    });

    await waitFor(() => {
      expect(cart.current.items.length).toBe(1);
    });
    
    const itemId = cart.current.items[0].id;

    act(() => {
      cart.current.updateQuantity(itemId, 3);
    });

    await waitFor(() => {
      expect(total.current).toBe(3000); // 1000 * 3
    });
  });

  it('should update total when item is removed', async () => {
    const { result: cart } = renderHook(() => useCart());
    const { result: total } = renderHook(() => useCartTotal());

    act(() => {
      cart.current.addItem(mockProduct1);
      cart.current.addItem(mockProduct2);
    });

    await waitFor(() => {
      expect(cart.current.items.length).toBe(2);
    });
    
    const itemId = cart.current.items[0].id;

    act(() => {
      cart.current.removeItem(itemId);
    });

    await waitFor(() => {
      expect(total.current).toBe(1500); // Only product2 remains
    });
  });
});

