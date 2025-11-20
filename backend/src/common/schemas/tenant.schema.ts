import { z } from 'zod';

export const TenantResponseSchema = z.object({
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
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type TenantResponse = z.infer<typeof TenantResponseSchema>;

