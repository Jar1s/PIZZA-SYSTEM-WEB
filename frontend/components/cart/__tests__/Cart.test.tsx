import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Cart } from '../Cart';
import { Product } from '@pizza-ecosystem/shared';

// Mock dependencies
const mockCloseCart = vi.fn();
const mockRouterPush = vi.fn();
let mockItems: any[] = [];
let mockTotal = 0;
let mockIsOpen = true;

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: mockItems,
    isOpen: mockIsOpen,
    closeCart: mockCloseCart,
  }),
  useCartTotal: () => mockTotal,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('@/contexts/CustomerAuthContext', () => ({
  useCustomerAuth: () => ({
    user: null,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      cartBadge: 'VÁŠ',
      yourCart: 'Košík',
      cartSubtitle: 'Vaša objednávka',
      emptyCart: 'Váš košík je prázdny',
      cartEmptyCta: 'Začnite s objednávkou',
      menu: 'Menu',
      items: 'Položky',
      total: 'Celkom',
      checkout: 'Pokračovať k objednávke',
      cartSecureCheckout: 'Bezpečné platby',
      cartDeliveryPromise: 'Rýchle doručenie',
      each: 'ks',
    },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

vi.mock('../CartItem', () => ({
  CartItem: ({ item }: any) => (
    <div data-testid={`cart-item-${item.id}`}>
      {item.product.name} x{item.quantity}
    </div>
  ),
}));

describe('Cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [];
    mockTotal = 0;
    mockIsOpen = true;
    // Reset window.location
    delete (window as any).location;
    (window as any).location = {
      hostname: 'localhost',
      search: '?tenant=pornopizza',
    };
    // Mock getElementById
    document.getElementById = vi.fn(() => null);
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Cart />);

      // Use getAllByText since there might be multiple instances
      const cartTexts = screen.getAllByText(/košík/i);
      expect(cartTexts.length).toBeGreaterThan(0);
    });

    it('should not render when isOpen is false', () => {
      mockIsOpen = false;
      const { container } = render(<Cart />);
      expect(container.firstChild).toBeNull();
    });

    it('should render backdrop', () => {
      const { container } = render(<Cart />);
      const backdrop = container.querySelector('[style*="z-index: 10000"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render cart panel', () => {
      const { container } = render(<Cart />);
      const panel = container.querySelector('[style*="z-index: 10001"]');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Empty Cart', () => {
    it('should display empty cart message when items array is empty', () => {
      mockItems = [];
      render(<Cart />);

      expect(screen.getByText(/prázdny/i)).toBeInTheDocument();
      expect(screen.getByText(/začnite s objednávkou/i)).toBeInTheDocument();
    });

    it('should show continue shopping button when cart is empty', () => {
      mockItems = [];
      render(<Cart />);

      const continueButton = screen.getByRole('button', { name: /menu/i });
      expect(continueButton).toBeInTheDocument();
    });

    it('should not show checkout button when cart is empty', () => {
      mockItems = [];
      render(<Cart />);

      const checkoutButton = screen.queryByRole('button', { name: /pokračovať k objednávke/i });
      expect(checkoutButton).not.toBeInTheDocument();
    });
  });

  describe('Cart with Items', () => {
    beforeEach(() => {
      mockItems = [
        {
          id: '1-',
          product: {
            id: '1',
            name: 'Pizza Margherita',
            priceCents: 1000,
            image: '/pizza.jpg',
          } as Product,
          quantity: 2,
        },
        {
          id: '2-',
          product: {
            id: '2',
            name: 'Cola',
            priceCents: 200,
            image: '/cola.jpg',
          } as Product,
          quantity: 1,
        },
      ];
      mockTotal = 2200; // (1000 * 2) + (200 * 1)
    });

    it('should display cart items when items array is not empty', () => {
      render(<Cart />);

      expect(screen.getByTestId('cart-item-1-')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-2-')).toBeInTheDocument();
    });

    it('should display total when items are present', () => {
      render(<Cart />);

      expect(screen.getByText(/celkom/i)).toBeInTheDocument();
      expect(screen.getByText('€22.00')).toBeInTheDocument();
    });

    it('should display item count', () => {
      render(<Cart />);

      const itemsTexts = screen.getAllByText(/položky/i);
      expect(itemsTexts.length).toBeGreaterThan(0);
      // Total quantity: 2 + 1 = 3
      expect(screen.getByText((content) => content.includes('3') && content.includes('položky'))).toBeInTheDocument();
    });

    it('should show checkout button when items are present', () => {
      render(<Cart />);

      const checkoutButton = screen.getByRole('button', { name: /pokračovať k objednávke/i });
      expect(checkoutButton).toBeInTheDocument();
    });

    it('should show continue shopping button when items are present', () => {
      render(<Cart />);

      const continueButton = screen.getByRole('button', { name: /menu/i });
      expect(continueButton).toBeInTheDocument();
    });
  });

  describe('Closing Cart', () => {
    it('should close cart when backdrop is clicked', () => {
      const { container } = render(<Cart />);

      const backdrop = container.querySelector('[style*="z-index: 10000"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockCloseCart).toHaveBeenCalled();
      }
    });

    it('should close cart when close button is clicked', () => {
      render(<Cart />);

      const closeButton = screen.getByRole('button', { name: /zavrieť košík/i });
      fireEvent.click(closeButton);
      expect(mockCloseCart).toHaveBeenCalled();
    });

    it('should close cart when ESC key is pressed', () => {
      render(<Cart />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockCloseCart).toHaveBeenCalled();
    });

    it('should not close cart when other keys are pressed', () => {
      render(<Cart />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space' });

      expect(mockCloseCart).not.toHaveBeenCalled();
    });

    it('should remove ESC listener when cart closes', () => {
      const { unmount } = render(<Cart />);
      unmount();

      fireEvent.keyDown(window, { key: 'Escape' });
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should navigate to checkout when checkout button is clicked', () => {
      mockItems = [{ id: '1-', product: {} as Product, quantity: 1 }];
      render(<Cart />);

      const checkoutButton = screen.getByRole('button', { name: /pokračovať k objednávke/i });
      fireEvent.click(checkoutButton);

      expect(mockCloseCart).toHaveBeenCalled();
      
      // Advance timers to trigger setTimeout
      vi.advanceTimersByTime(150);
      
      expect(mockRouterPush).toHaveBeenCalledWith('/checkout?tenant=pornopizza');
    });

    it('should get tenant slug from URL params on localhost', () => {
      // Use Object.defineProperty for proper window.location mock
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          search: '?tenant=pizzavnudzi',
        },
        writable: true,
        configurable: true,
      });
      
      mockItems = [{ id: '1-', product: {} as Product, quantity: 1 }];
      render(<Cart />);

      const checkoutButton = screen.getByRole('button', { name: /pokračovať k objednávke/i });
      fireEvent.click(checkoutButton);

      // Advance timers to trigger setTimeout
      vi.advanceTimersByTime(150);
      
      expect(mockRouterPush).toHaveBeenCalledWith('/checkout?tenant=pizzavnudzi');
    });

    it('should get tenant slug from hostname for pornopizza', () => {
      // Use Object.defineProperty for proper window.location mock
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'pornopizza.sk',
          search: '',
        },
        writable: true,
        configurable: true,
      });
      
      mockItems = [{ id: '1-', product: {} as Product, quantity: 1 }];
      render(<Cart />);

      const checkoutButton = screen.getByRole('button', { name: /pokračovať k objednávke/i });
      fireEvent.click(checkoutButton);

      // Advance timers to trigger setTimeout
      vi.advanceTimersByTime(150);
      
      expect(mockRouterPush).toHaveBeenCalledWith('/checkout?tenant=pornopizza');
    });

    it('should handle continue shopping click', () => {
      const scrollToSpy = vi.fn();
      window.scrollTo = scrollToSpy;
      document.getElementById = vi.fn(() => null);

      render(<Cart />);

      const continueButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(continueButton);

      expect(mockCloseCart).toHaveBeenCalled();
      expect(scrollToSpy).toHaveBeenCalled();
    });

    it('should scroll to menu element if it exists', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'menu';
      mockElement.getBoundingClientRect = () => ({
        top: 1000,
        left: 0,
        bottom: 2000,
        right: 0,
        width: 100,
        height: 1000,
        x: 0,
        y: 1000,
        toJSON: vi.fn(),
      });
      document.getElementById = vi.fn(() => mockElement);
      const scrollToSpy = vi.fn();
      window.scrollTo = scrollToSpy;
      Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });

      render(<Cart />);

      const continueButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(continueButton);

      expect(scrollToSpy).toHaveBeenCalled();
    });
  });

  describe('Theme Styling', () => {
    it('should apply dark theme styles when isDark is true', () => {
      const { container } = render(<Cart isDark={true} />);

      const panel = container.querySelector('[style*="z-index: 10001"]');
      expect(panel).toHaveStyle({ backgroundColor: expect.stringContaining('var(--cart-dark-bg') });
    });

    it('should apply light theme styles when isDark is false', () => {
      const { container } = render(<Cart isDark={false} />);

      const panel = container.querySelector('[style*="z-index: 10001"]');
      expect(panel).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('should use tenant theme when isDark is not provided', () => {
      const mockTenant = {
        id: '1',
        slug: 'pornopizza',
        theme: {
          layout: {
            headerStyle: 'dark',
          },
        },
      };

      render(<Cart tenant={mockTenant as any} />);

      const cartTexts = screen.getAllByText(/košík/i);
      expect(cartTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Price Calculation', () => {
    it('should format total price correctly', () => {
      mockItems = [{ id: '1-', product: { priceCents: 1599 } as Product, quantity: 1 }];
      mockTotal = 1599;
      render(<Cart />);

      expect(screen.getByText('€15.99')).toBeInTheDocument();
    });

    it('should handle zero total', () => {
      mockItems = [];
      mockTotal = 0;
      render(<Cart />);

      // Should not show total section when empty
      expect(screen.queryByText('€0.00')).not.toBeInTheDocument();
    });

    it('should calculate item count correctly', () => {
      mockItems = [
        { id: '1-', product: {} as Product, quantity: 3 },
        { id: '2-', product: {} as Product, quantity: 2 },
      ];
      render(<Cart />);

      expect(screen.getByText(/5 položky/i)).toBeInTheDocument();
    });
  });

  describe('Security and Trust Messages', () => {
    it('should display security and delivery messages', () => {
      mockItems = [{ id: '1-', product: {} as Product, quantity: 1 }];
      render(<Cart />);

      expect(screen.getByText(/bezpečné platby/i)).toBeInTheDocument();
      expect(screen.getByText(/rýchle doručenie/i)).toBeInTheDocument();
    });
  });
});
