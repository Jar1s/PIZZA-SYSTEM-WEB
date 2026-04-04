import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Order } from '../../../../shared/types/order.types';
import { OrderStatus } from '../../../../shared/types/order.types';

// Create mock function before vi.mock
const mockGetOrder = vi.fn();

// Mock @/shared before importing OrderTracker (OrderTracker uses @/shared)
vi.mock('@/shared', () => ({
  OrderStatus: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    PREPARING: 'PREPARING',
    READY: 'READY',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELED: 'CANCELED',
  },
  Order: {} as any,
}));

vi.mock('@/lib/api', () => ({
  getOrder: (...args: any[]) => mockGetOrder(...args),
}));

vi.mock('../StatusTimeline', () => ({
  StatusTimeline: ({ status }: any) => (
    <div data-testid="status-timeline">Status: {status}</div>
  ),
}));

vi.mock('../OrderDetails', () => ({
  OrderDetails: ({ order }: any) => (
    <div data-testid="order-details">Order: {order.id}</div>
  ),
}));

vi.mock('../DeliveryInfo', () => ({
  DeliveryInfo: ({ order }: any) => (
    <div data-testid="delivery-info">Delivery: {order.deliveryId}</div>
  ),
}));

// Import after mocks
import { OrderTracker } from '../OrderTracker';

describe('OrderTracker', () => {
  const mockOrder: Order = {
    id: 'order-123',
    tenantId: 'tenant-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    subtotalCents: 1000,
    taxCents: 200,
    deliveryFeeCents: 0,
    totalCents: 1200,
    paymentStatus: null,
    paymentProvider: null,
    paymentRef: null,
    storyousOrderId: null,
    deliveryId: null,
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+421912345678',
    },
    address: {
      street: 'Main Street',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    },
    items: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render order tracker with order information', () => {
    render(<OrderTracker order={mockOrder} />);

    expect(screen.getByText(/Track Your Order/i)).toBeInTheDocument();
    expect(screen.getByText(/Order #ORDER-123/i)).toBeInTheDocument();
    expect(screen.getByTestId('status-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('order-details')).toBeInTheDocument();
  });

  it('should display order creation date', () => {
    render(<OrderTracker order={mockOrder} />);

    expect(screen.getByText(/Placed on/i)).toBeInTheDocument();
  });

  it('should poll for order updates when order is active', async () => {
    const updatedOrder = {
      ...mockOrder,
      status: OrderStatus.PREPARING,
    };

    mockGetOrder.mockResolvedValue(updatedOrder);

    render(<OrderTracker order={mockOrder} />);

    // Advance timers to trigger polling
    vi.advanceTimersByTime(15000);

    await waitFor(() => {
      expect(mockGetOrder).toHaveBeenCalledWith('order-123');
    });
  });

  it('should not poll when order is delivered', () => {
    const deliveredOrder = {
      ...mockOrder,
      status: OrderStatus.DELIVERED,
    };

    render(<OrderTracker order={deliveredOrder} />);

    // Advance timers
    vi.advanceTimersByTime(15000);

    // Should not call getOrder for delivered orders
    expect(mockGetOrder).not.toHaveBeenCalled();
  });

  it('should not poll when order is canceled', () => {
    const canceledOrder = {
      ...mockOrder,
      status: OrderStatus.CANCELED,
    };

    render(<OrderTracker order={canceledOrder} />);

    // Advance timers
    vi.advanceTimersByTime(15000);

    // Should not call getOrder for canceled orders
    expect(mockGetOrder).not.toHaveBeenCalled();
  });

  it('should display delivery info when deliveryId exists', () => {
    const orderWithDelivery = {
      ...mockOrder,
      deliveryId: 'delivery-123',
    };

    render(<OrderTracker order={orderWithDelivery} />);

    expect(screen.getByTestId('delivery-info')).toBeInTheDocument();
  });

  it('should not display delivery info when deliveryId is null', () => {
    render(<OrderTracker order={mockOrder} />);

    expect(screen.queryByTestId('delivery-info')).not.toBeInTheDocument();
  });

  it('should display support contact information', () => {
    render(<OrderTracker order={mockOrder} />);

    expect(screen.getByText(/Need help with your order/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Support/i)).toBeInTheDocument();
    expect(screen.getByText(/or call: \+421 900 000 000/i)).toBeInTheDocument();
  });

  it('should update order when polling returns new data', async () => {
    const updatedOrder = {
      ...mockOrder,
      status: OrderStatus.PREPARING,
    };

    mockGetOrder.mockResolvedValue(updatedOrder);

    const { rerender } = render(<OrderTracker order={mockOrder} />);

    // Advance timers to trigger polling
    vi.advanceTimersByTime(15000);

    await waitFor(() => {
      expect(mockGetOrder).toHaveBeenCalled();
    });

    // Rerender with updated order
    rerender(<OrderTracker order={updatedOrder} />);

    expect(screen.getByTestId('status-timeline')).toHaveTextContent('PREPARING');
  });
});
