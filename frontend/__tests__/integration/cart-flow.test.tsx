import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from '@/components/menu/ProductCard';
import { Cart } from '@/components/cart/Cart';
import { Product } from '@pizza-ecosystem/shared';

// Mock all dependencies
const mockAddItem = vi.fn();
const mockCloseCart = vi.fn();
const mockRouterPush = vi.fn();
let mockCartItems: any[] = [];
let mockCartTotal = 0;
let mockIsOpen = false;

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: mockCartItems,
    isOpen: mockIsOpen,
    closeCart: mockCloseCart,
  }),
  useCartTotal: () => mockCartTotal,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      add: 'Pridať',
      added: 'Pridané',
      cart: 'Košík',
      checkout: 'Pokračovať k objednávke',
      emptyCart: 'Váš košík je prázdny',
      total: 'Celkom',
    },
    language: 'sk',
  }),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToastContext: () => ({
    success: vi.fn(),
  }),
}));

vi.mock('@/contexts/CustomerAuthContext', () => ({
  useCustomerAuth: () => ({
    user: null,
  }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="product-image" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

vi.mock('@/components/menu/CustomizationModal', () => ({
  default: ({ isOpen, onAddToCart, product }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="customization-modal">
        <button onClick={() => onAddToCart({ size: ['large'] }, 1200)}>Add</button>
      </div>
    );
  },
}));

describe('Cart Flow Integration', () => {
  const mockDrink: Product = {
    id: '1',
    tenantId: 'tenant-1',
    name: 'Cola',
    priceCents: 200,
    taxRate: 20,
    category: 'DRINKS',
    image: '/cola.jpg',
    description: 'Refreshing drink',
    modifiers: null,
    isActive: true,
    isBestSeller: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCartItems = [];
    mockCartTotal = 0;
    mockIsOpen = false;
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        search: '?tenant=pornopizza',
      },
      writable: true,
      configurable: true,
    });
  });

  it('should add product to cart and open cart', async () => {
    // Simulate adding item to cart
    mockAddItem.mockImplementation((product) => {
      mockCartItems.push({
        id: `${product.id}-`,
        product,
        quantity: 1,
      });
      mockCartTotal = product.priceCents;
      mockIsOpen = true;
    });

    render(<ProductCard product={mockDrink} />);

    const addButton = screen.getByRole('button', { name: /pridať/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(mockDrink);
    });

    // Cart should be open - render it separately
    mockIsOpen = true;
    const { container: cartContainer } = render(<Cart />);

    await waitFor(() => {
      // Cart should render when isOpen is true
      expect(cartContainer.firstChild).not.toBeNull();
      // Check for cart content
      const cartTexts = screen.queryAllByText(/košík|váš košík/i);
      // If cart is rendered, it should have some content
      expect(cartContainer.textContent?.length || 0).toBeGreaterThan(0);
    });
  });

  it('should display added items in cart', async () => {
    mockCartItems = [
      {
        id: '1-',
        product: mockDrink,
        quantity: 1,
      },
    ];
    mockCartTotal = 200;
    mockIsOpen = true;

    render(<Cart />);

    await waitFor(() => {
      expect(screen.getByText(/cola/i)).toBeInTheDocument();
      // Price might appear multiple times (item price and total)
      const prices = screen.getAllByText('€2.00');
      expect(prices.length).toBeGreaterThan(0);
    });
  });

  it('should navigate to checkout from cart', () => {
    vi.useFakeTimers();
    
    mockCartItems = [{ id: '1-', product: mockDrink, quantity: 1 }];
    mockCartTotal = 200;
    mockIsOpen = true;

    render(<Cart />);

    const checkoutButton = screen.getByRole('button', { name: /pokračovať k objednávke/i });
    fireEvent.click(checkoutButton);

    expect(mockCloseCart).toHaveBeenCalled();
    
    // Advance timers to trigger setTimeout
    vi.advanceTimersByTime(150);
    
    expect(mockRouterPush).toHaveBeenCalledWith('/checkout?tenant=pornopizza');
    
    vi.useRealTimers();
  });
});

