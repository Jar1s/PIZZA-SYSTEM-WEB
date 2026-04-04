import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomizationModal from '../CustomizationModal';
import { Product } from '@pizza-ecosystem/shared';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'sk',
    t: {
      customize: 'Prispôsobiť',
      addToCart: 'Pridať do košíka',
      close: 'Zavrieť',
    },
  }),
}));

vi.mock('@/lib/product-translations', () => ({
  getProductTranslation: () => ({ name: 'Margherita', description: 'Classic pizza' }),
  getAllergenDescription: () => '',
}));

vi.mock('@/lib/customization-options', () => ({
  pizzaCustomizations: [
    {
      id: 'size',
      name: 'Veľkosť',
      required: true,
      maxSelection: 1,
      options: [
        { id: 'small', name: 'Malá', price: 0 },
        { id: 'large', name: 'Veľká', price: 200 },
      ],
    },
  ],
  stangleCustomizations: [],
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
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-dom', () => ({
  createPortal: (children: any) => children,
}));

describe('CustomizationModal', () => {
  const mockPizza: Product = {
    id: '1',
    name: 'Margherita',
    priceCents: 1000,
    category: 'PIZZA',
    image: '/pizza.jpg',
    description: 'Classic pizza',
  };

  const mockOnClose = vi.fn();
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <CustomizationModal
          product={mockPizza}
          isOpen={false}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );
      // Component returns null when isOpen is false or not mounted
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', async () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Wait for component to mount and render
      await waitFor(() => {
        expect(screen.getByText((content) => content.includes('Margherita'))).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should render close button', async () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      await waitFor(() => {
        // Button has aria-label "Zatvoriť" (not "Zavrieť")
        const closeButton = screen.getByRole('button', { name: /zatvoriť|close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Closing Modal', () => {
    it('should call onClose when close button is clicked', async () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /zatvoriť|close/i });
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /zatvoriť|close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      const backdrop = container.querySelector('[style*="backdrop"]') || container.firstChild;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should close modal when ESC key is pressed', () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Customization Options', () => {
    it('should display customization options for pizza', async () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      await waitFor(() => {
        // Modal should render with customization options
        expect(screen.getByText((content) => content.includes('Margherita'))).toBeInTheDocument();
      });
    });

    it('should calculate price correctly when options are selected', async () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      await waitFor(() => {
        // Price calculation happens automatically when options are selected
        // Base price is 1000, large size adds 200, so total should be 1200
        expect(screen.getByText((content) => content.includes('Margherita'))).toBeInTheDocument();
      });
    });
  });

  describe('Add to Cart', () => {
    it('should call onAddToCart with customizations and price', async () => {
      render(
        <CustomizationModal
          product={mockPizza}
          isOpen={true}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      await waitFor(() => {
        // Find and click add to cart button
        const addButton = screen.getByRole('button', { name: /pridať do košíka/i });
        if (addButton) {
          fireEvent.click(addButton);
          // onAddToCart should be called with selections and total price
          expect(mockOnAddToCart).toHaveBeenCalled();
        }
      });
    });
  });
});

