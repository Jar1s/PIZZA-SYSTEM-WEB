import { DeliveryZoneController } from './delivery-zone.controller';

describe('DeliveryZoneController calculate-fee Wolt area gate', () => {
  const address = {
    street: 'Testovacia 1',
    city: 'Bratislava',
    postalCode: '81106',
    coordinates: { lat: 48.1459, lng: 17.1077 },
  };

  function buildController(overrides: {
    areaResult?: { insideArea: boolean | null; source: string; reason: string | null };
    areaError?: Error;
  }) {
    const deliveryFeeTierService = {
      getDeliveryFeeByDistance: jest.fn().mockResolvedValue({
        deliveryFeeCents: 425,
        distanceMeters: 712,
        isOutOfRange: false,
      }),
    };
    const deliveryService = {
      checkAreaByTenantSlug: overrides.areaError
        ? jest.fn().mockRejectedValue(overrides.areaError)
        : jest.fn().mockResolvedValue(
            overrides.areaResult ?? { insideArea: true, source: 'cache', reason: null },
          ),
    };
    const tenantsService = {
      getTenantBySlug: jest.fn().mockResolvedValue({ id: 't1', slug: 'pornopizza' }),
    };
    const controller = new DeliveryZoneController(
      {} as any,
      deliveryFeeTierService as any,
      deliveryService as any,
      tenantsService as any,
    );
    return { controller, deliveryService };
  }

  it('returns the fee when the point is inside the Wolt area', async () => {
    const { controller } = buildController({
      areaResult: { insideArea: true, source: 'cache', reason: null },
    });

    const result: any = await controller.calculateDeliveryFee('pornopizza', { address });

    expect(result.available).toBe(true);
    expect(result.deliveryFeeCents).toBe(425);
  });

  it('blocks the address before payment when outside the Wolt area', async () => {
    const { controller } = buildController({
      areaResult: { insideArea: false, source: 'cache', reason: null },
    });

    const result: any = await controller.calculateDeliveryFee('pornopizza', { address });

    expect(result.available).toBe(false);
    expect(result.message).toContain('mimo');
  });

  it('fails open when the area is unknown (no Wolt config / missing coordinates)', async () => {
    const { controller } = buildController({
      areaResult: { insideArea: null, source: 'fallback', reason: 'not configured' },
    });

    const result: any = await controller.calculateDeliveryFee('pornopizza', { address });

    expect(result.available).toBe(true);
  });

  it('fails open when the area check itself throws', async () => {
    const { controller } = buildController({ areaError: new Error('wolt down') });

    const result: any = await controller.calculateDeliveryFee('pornopizza', { address });

    expect(result.available).toBe(true);
    expect(result.deliveryFeeCents).toBe(425);
  });
});
