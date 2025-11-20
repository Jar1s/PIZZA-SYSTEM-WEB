import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import CheckoutPage from '@/app/checkout/page';

// Mock localStorage
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

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/checkout',
  useSearchParams: () => new URLSearchParams('?tenant=pornopizza'),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: [
      {
        id: '1',
        product: { id: '1', name: 'Margherita', priceCents: 1000 },
        quantity: 1,
      },
    ],
    clearCart: vi.fn(),
  }),
  useCartTotal: () => 1000,
}));

vi.mock('@/contexts/CustomerAuthContext', () => ({
  useCustomerAuth: () => ({
    user: null,
    loading: false,
    setUser: vi.fn(),
  }),
}));

vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    tenant: {
      id: 'tenant-1',
      slug: 'pornopizza',
      theme: {
        layout: { headerStyle: 'dark' },
      },
    },
  }),
}));

vi.mock('@/lib/api', () => ({
  getTenant: vi.fn().mockResolvedValue({
    id: 'tenant-1',
    slug: 'pornopizza',
    paymentConfig: { cashOnDeliveryEnabled: true, cardOnDeliveryEnabled: true },
  }),
  createOrder: vi.fn().mockResolvedValue({
    id: 'order-123',
    status: 'PENDING',
  }),
  createPaymentSession: vi.fn(),
}));

vi.mock('@/lib/geocoding', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ isInBratislava: true }),
  validateBratislavaAddressSimple: vi.fn().mockReturnValue({ isValid: true }),
}));

describe('Checkout Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    // Set cart in localStorage to prevent redirect
    localStorageMock.setItem('cart-storage', JSON.stringify({
      state: {
        items: [
          {
            id: '1',
            product: { id: '1', name: 'Margherita', priceCents: 1000 },
            quantity: 1,
          },
        ],
      },
    }));
  });

  it('should validate name field requires first and last name', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<CheckoutPage />);
    });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/Meno/i)).toBeInTheDocument();
    });

    // Find input by exact placeholder (Slovak: "Např. Ján Novák") - use getAllBy and pick first
    const nameInputs = screen.getAllByPlaceholderText(/Ján Novák/i);
    const nameInput = nameInputs[0]; // First one is the name field
    
    // Enter only first name
    await user.type(nameInput, 'John');
    await user.tab(); // Blur to trigger validation

    await waitFor(() => {
      const error = screen.queryByText(/meno.*priezvisko|Prosím.*zadajte.*meno.*aj.*priezvisko/i);
      expect(error).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fix: add last name
    await user.clear(nameInput);
    await user.type(nameInput, 'John Doe');
    await user.tab();

    await waitFor(() => {
      const error = screen.queryByText(/meno.*priezvisko|Prosím.*zadajte.*meno.*aj.*priezvisko/i);
      expect(error).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<CheckoutPage />);
    });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
    });

    // Find email input by placeholder (Slovak: "napr. jan.novak@email.com")
    const emailInput = screen.getByPlaceholderText(/jan.novak@email.com|napr/i);
    
    // Invalid email
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      const error = screen.queryByText(/platn.*email|Prosím.*zadajte.*platn.*email/i);
      expect(error).toBeInTheDocument();
    }, { timeout: 3000 });

    // Valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'john.doe@example.com');
    await user.tab();

    await waitFor(() => {
      const error = screen.queryByText(/platn.*email|Prosím.*zadajte.*platn.*email/i);
      expect(error).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<CheckoutPage />);
    });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/Telefón/i)).toBeInTheDocument();
    });

    // Find phone input by placeholder (Slovak: "912345678") or by type="tel"
    const phoneInputs = screen.getAllByPlaceholderText(/912345678/i);
    const phoneInput = phoneInputs.length > 0 ? phoneInputs[0] : screen.getByDisplayValue('');
    
    // Invalid phone (too short) - type just 3 digits
    await user.type(phoneInput, '123');
    await user.tab();

    // Wait a bit for validation to trigger
    await waitFor(() => {
      // Check for error message or red border (validation might show as border-red-500 class)
      const error = screen.queryByText(/platn.*telefón|valid.*phone|telefón.*musí/i);
      if (error) {
        expect(error).toBeInTheDocument();
      } else {
        // If no error text, check if input has error class
        const input = phoneInput as HTMLElement;
        expect(input.className).toContain('border-red');
      }
    }, { timeout: 3000 });

    // Valid phone - clear and type valid number
    await user.clear(phoneInput);
    await user.type(phoneInput, '912345678');
    await user.tab();

    await waitFor(() => {
      const error = screen.queryByText(/platn.*telefón|valid.*phone|telefón.*musí/i);
      expect(error).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show validation errors on submit attempt', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<CheckoutPage />);
    });

    // Wait for component to render and find submit button
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Zaplatiť|Potvrdiť/i });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Zaplatiť|Potvrdiť/i });
    
    // Check if button is disabled (it should be if form is invalid)
    // If disabled, we can't click it, so we'll check HTML5 validation instead
    if (submitButton.hasAttribute('disabled')) {
      // Button is disabled - check that required fields are marked
      const requiredInputs = screen.getAllByRole('textbox').filter(
        (input) => input.hasAttribute('required')
      );
      expect(requiredInputs.length).toBeGreaterThan(0);
      
      // Also check for required attribute on inputs
      const emailInput = screen.getByPlaceholderText(/jan.novak@email.com/i);
      expect(emailInput).toHaveAttribute('required');
    } else {
      // Button is enabled - try to submit
      await user.click(submitButton);

      // Should show validation errors (either from HTML5 validation or custom validation)
      await waitFor(() => {
        // Check for HTML5 validation or custom error messages
        const errors = screen.queryAllByText(/povinné|required|chyba|Meno.*povinné|Email.*povinný/i);
        // At least one validation should trigger
        if (errors.length === 0) {
          // If no text errors, check for HTML5 validation (invalid inputs)
          const invalidInputs = screen.getAllByRole('textbox').filter(
            (input) => !(input as HTMLInputElement).validity.valid
          );
          expect(invalidInputs.length).toBeGreaterThan(0);
        } else {
          expect(errors.length).toBeGreaterThan(0);
        }
      }, { timeout: 3000 });
    }
  });
});

