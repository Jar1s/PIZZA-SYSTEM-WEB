import { z } from 'zod';

export const DeliveryFeeResponseSchema = z.object({
  zoneName: z.string(),
  deliveryFeeCents: z.number().int().nonnegative(),
  minOrderCents: z.number().int().nonnegative().nullable(),
  isAvailable: z.boolean().optional(),
});

export type DeliveryFeeResponse = z.infer<typeof DeliveryFeeResponseSchema>;

export const DeliveryZoneSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  deliveryFeeCents: z.number().int().nonnegative(),
  minOrderCents: z.number().int().nonnegative().optional(),
  polygon: z.array(z.array(z.number())).optional(),
  isActive: z.boolean(),
});

export type DeliveryZone = z.infer<typeof DeliveryZoneSchema>;

