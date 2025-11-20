import { z } from 'zod';
import { Tenant, Product, Order } from '@pizza-ecosystem/shared';

// Tenant schema with fallback
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().nullable().optional(),
  subdomain: z.string().optional(),
  currency: z.string().default('EUR'),
  theme: z.record(z.string(), z.unknown()).optional(),
  paymentProvider: z.enum(['adyen', 'gopay', 'gpwebpay', 'wepay']).default('adyen'),
  paymentConfig: z.record(z.string(), z.unknown()).optional(),
  deliveryConfig: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
}).passthrough(); // Allow extra fields

// Product schema with fallback
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  modifiers: z.array(z.unknown()).optional(),
}).passthrough();

// Order schema with fallback
export const OrderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().nullable(),
  status: z.enum(['PENDING', 'PAID', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED']),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  deliveryFeeCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  customer: z.record(z.string(), z.unknown()),
  address: z.record(z.string(), z.unknown()),
  items: z.array(z.unknown()).optional(),
}).passthrough();

// Delivery fee schema
export const DeliveryFeeSchema = z.object({
  available: z.boolean(),
  deliveryFeeCents: z.number().int().nonnegative().optional(),
  deliveryFeeEuros: z.string().optional(),
  minOrderCents: z.number().int().nonnegative().nullable().optional(),
  minOrderEuros: z.string().nullable().optional(),
  zoneName: z.string().optional(),
  message: z.string().optional(),
}).passthrough();

/**
 * Validate API response with Zod schema and return fallback if validation fails
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
  errorMessage?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.warn(errorMessage || 'API response validation failed, using fallback', error);
    return fallback;
  }
}

/**
 * Safe parse - returns result or fallback
 */
export function safeParse<T>(
  schema: z.ZodSchema<T> | undefined,
  data: unknown,
  fallback: T
): T {
  if (!schema) {
    console.warn('Schema is undefined, using fallback data');
    return fallback;
  }
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return result.data;
    }
    console.warn('API response validation failed, using fallback', result.error);
    return fallback;
  } catch (error) {
    console.error('Error during schema parsing:', error);
    return fallback;
  }
}

