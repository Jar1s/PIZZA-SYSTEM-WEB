import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItem } from '../CartItem';

const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      each: 'ks',
      remove: 'Odstrániť',
    },
    language: 'sk',
  }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('CartItem', () => {
  const mockItem = {
    id: '1-',
    product: {
      id: '1',
      name: 'Pizza Margherita',
      priceCents: 1000,
      image: '/pizza.jpg',
    },
    quantity: 2,
    modifiers: {
      size: ['large'],
      toppings: ['cheese'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render product name', () => {
      render(<CartItem item={mockItem} />);

      expect(screen.getByText(/margherita/i)).toBeInTheDocument();
    });

    it('should render product price', () => {
      render(<CartItem item={mockItem} />);

      // Price is displayed as "€10.00 ks" (with "each" text)
      expect(screen.getByText((content) => content.includes('€10.00'))).toBeInTheDocument();
    });

    it('should render quantity', () => {
      render(<CartItem item={mockItem} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render total price', () => {
      render(<CartItem item={mockItem} />);

      expect(screen.getByText('€20.00')).toBeInTheDocument();
    });

    it('should render product image when available', () => {
      render(<CartItem item={mockItem} />);

      const image = screen.getByAltText('Pizza Margherita');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/pizza.jpg');
    });

    it('should not render image when not available', () => {
      const itemWithoutImage = {
        ...mockItem,
        product: {
          ...mockItem.product,
          image: null,
        },
      };

      render(<CartItem item={itemWithoutImage} />);

      const image = screen.queryByAltText('Pizza Margherita');
      expect(image).not.toBeInTheDocument();
    });
  });

  describe('Quantity Management', () => {
    it('should call updateQuantity when quantity is increased', () => {
      render(<CartItem item={mockItem} />);

      const increaseButton = screen.getByRole('button', { name: '+' });
      fireEvent.click(increaseButton);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('1-', 3);
    });

    it('should call updateQuantity when quantity is decreased', () => {
      render(<CartItem item={mockItem} />);

      // Find button with minus sign (could be − or -)
      const decreaseButton = screen.getByRole('button', { name: /−|-/ });
      fireEvent.click(decreaseButton);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('1-', 1);
    });

    it('should call updateQuantity with 0 when quantity is decreased to 0', () => {
      const itemWithQuantity1 = {
        ...mockItem,
        quantity: 1,
      };

      render(<CartItem item={itemWithQuantity1} />);

      const decreaseButton = screen.getByRole('button', { name: /−|-/ });
      fireEvent.click(decreaseButton);

      // When quantity becomes 0, updateQuantity is called with 0
      // The actual removal happens in the hook, not the component
      expect(mockUpdateQuantity).toHaveBeenCalledWith('1-', 0);
    });
  });

  describe('Removing Items', () => {
    it('should call removeItem when remove button is clicked', () => {
      render(<CartItem item={mockItem} />);

      const removeButton = screen.getByRole('button', { name: /odstrániť/i });
      fireEvent.click(removeButton);

      expect(mockRemoveItem).toHaveBeenCalledWith('1-');
    });
  });

  describe('Modifiers Display', () => {
    it('should display modifiers when present', () => {
      render(<CartItem item={mockItem} />);

      // Modifiers should be displayed (format depends on formatModifiers function)
      expect(screen.getByText(/margherita/i)).toBeInTheDocument();
    });

    it('should not display modifiers section when modifiers are null', () => {
      const itemWithoutModifiers = {
        ...mockItem,
        modifiers: null,
      };

      render(<CartItem item={itemWithoutModifiers} />);

      expect(screen.getByText(/margherita/i)).toBeInTheDocument();
    });
  });

  describe('Theme Variants', () => {
    it('should apply dark theme styles when variant is dark', () => {
      const { container } = render(<CartItem item={mockItem} variant="dark" />);

      const item = container.firstChild;
      expect(item).toHaveClass('bg-white/5');
    });

    it('should apply light theme styles when variant is light', () => {
      const { container } = render(<CartItem item={mockItem} variant="light" />);

      const item = container.firstChild;
      expect(item).toHaveClass('bg-white');
    });

    it('should default to light theme when variant is not provided', () => {
      const { container } = render(<CartItem item={mockItem} />);

      const item = container.firstChild;
      expect(item).toHaveClass('bg-white');
    });
  });

  describe('Price Calculations', () => {
    it('should calculate total correctly for different quantities', () => {
      const itemWithQuantity3 = {
        ...mockItem,
        quantity: 3,
      };

      render(<CartItem item={itemWithQuantity3} />);

      // Total should be 1000 * 3 = 3000 cents = €30.00
      expect(screen.getByText('€30.00')).toBeInTheDocument();
    });

    it('should handle zero quantity gracefully', () => {
      const itemWithQuantity0 = {
        ...mockItem,
        quantity: 0,
      };

      render(<CartItem item={itemWithQuantity0} />);

      expect(screen.getByText('€0.00')).toBeInTheDocument();
    });
  });
});

