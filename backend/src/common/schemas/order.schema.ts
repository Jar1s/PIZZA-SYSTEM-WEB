import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  // Modifiers can be either:
  // 1. Object (Record<string, string[]>) - current format: { modifierId: [optionId1, optionId2] }
  // 2. Array - legacy format (for backward compatibility)
  modifiers: z.union([
    z.record(z.string(), z.array(z.string())), // Object format: { "size": ["large"], "toppings": ["cheese"] }
    z.array(z.unknown()), // Legacy array format
  ]).optional(),
});

export const OrderResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().nullable(),
  status: z.enum(['PENDING', 'PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED']),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  deliveryFeeCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  customer: z.record(z.string(), z.unknown()),
  address: z.record(z.string(), z.unknown()),
  items: z.array(OrderItemSchema).optional(),
  paymentRef: z.string().nullable().optional(),
  storyousOrderId: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

