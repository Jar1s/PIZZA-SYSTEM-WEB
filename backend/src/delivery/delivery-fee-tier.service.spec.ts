import { BadRequestException } from '@nestjs/common';
import { DeliveryFeeTierService } from './delivery-fee-tier.service';

describe('DeliveryFeeTierService contract', () => {
  let service: DeliveryFeeTierService;

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
    },
    deliveryFeeTier: {
      findMany: jest.fn(),
    },
  };

  const buildTenant = (deliveryConfig: Record<string, any>) => ({
    deliveryConfig,
  });

  const basePickupCoordinates = { lat: 48.1486, lng: 17.1077 };

  beforeEach(() => {
    service = new DeliveryFeeTierService(mockPrisma as any);
    jest.restoreAllMocks();
    mockPrisma.tenant.findUnique.mockReset();
    mockPrisma.deliveryFeeTier.findMany.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('returns an exact matching delivery fee tier and preserves the Prisma query contract', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockResolvedValue([
      {
        id: 'tier-1',
        tenantId: 'tenant-1',
        minDistanceMeters: 0,
        maxDistanceMeters: 1000,
        deliveryFeeCents: 250,
        isActive: true,
        priority: 1,
      },
      {
        id: 'tier-2',
        tenantId: 'tenant-1',
        minDistanceMeters: 1001,
        maxDistanceMeters: 2500,
        deliveryFeeCents: 450,
        isActive: true,
        priority: 1,
      },
    ]);
    jest.spyOn(service, 'geocodeAddress').mockResolvedValue({
      lat: basePickupCoordinates.lat,
      lng: basePickupCoordinates.lng,
    });

    const result = await service.getDeliveryFeeByDistance('tenant-1', {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    });

    expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      select: { deliveryConfig: true },
    });
    expect(mockPrisma.deliveryFeeTier.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ tenantId: 'tenant-1' }, { tenantId: null }],
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { minDistanceMeters: 'asc' },
      ],
    });
    expect(result).toEqual({
      deliveryFeeCents: 250,
      distanceMeters: 0,
      tierId: 'tier-1',
    });
  });

  it('uses the configured default fee when there is no exact tier match', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
        defaultFeeCents: 375,
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockResolvedValue([
      {
        id: 'tier-1',
        tenantId: 'tenant-1',
        minDistanceMeters: 0,
        maxDistanceMeters: 1000,
        deliveryFeeCents: 250,
        isActive: true,
        priority: 1,
      },
    ]);
    jest.spyOn(service, 'geocodeAddress').mockResolvedValue({
      lat: 49,
      lng: 18,
    });

    const result = await service.getDeliveryFeeByDistance('tenant-1', {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    });

    expect(result).toEqual({
      deliveryFeeCents: 375,
      distanceMeters: expect.any(Number),
    });
    expect(result?.tierId).toBeUndefined();
    expect(result?.distanceMeters).toBeGreaterThan(0);
  });

  it('falls back to the closest tier when no exact tier matches and no default fee exists', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockResolvedValue([
      {
        id: 'tier-1',
        tenantId: 'tenant-1',
        minDistanceMeters: 0,
        maxDistanceMeters: 1000,
        deliveryFeeCents: 250,
        isActive: true,
        priority: 1,
      },
      {
        id: 'tier-2',
        tenantId: 'tenant-1',
        minDistanceMeters: 1001,
        maxDistanceMeters: 2500,
        deliveryFeeCents: 450,
        isActive: true,
        priority: 1,
      },
    ]);
    jest.spyOn(service, 'geocodeAddress').mockResolvedValue({
      lat: 49,
      lng: 18,
    });

    const result = await service.getDeliveryFeeByDistance('tenant-1', {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    });

    expect(result).toEqual({
      deliveryFeeCents: 450,
      distanceMeters: expect.any(Number),
      tierId: 'tier-2',
    });
    expect(result?.distanceMeters).toBeGreaterThan(2500);
  });

  it('uses the default fee when geocoding fails and the tenant has a fallback fee', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
        defaultFeeCents: 390,
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockResolvedValue([
      {
        id: 'tier-1',
        tenantId: 'tenant-1',
        minDistanceMeters: 0,
        maxDistanceMeters: 1000,
        deliveryFeeCents: 250,
        isActive: true,
        priority: 1,
      },
    ]);
    jest.spyOn(service, 'geocodeAddress').mockRejectedValue(new Error('geocode failed'));

    const result = await service.getDeliveryFeeByDistance('tenant-1', {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    });

    expect(result).toEqual({
      deliveryFeeCents: 390,
      distanceMeters: 0,
    });
  });

  it('falls back to the configured default fee when the delivery fee tier table is unavailable', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
        defaultFeeCents: 410,
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockRejectedValue(new Error('relation deliveryFeeTier does not exist'));

    const result = await service.getDeliveryFeeByDistance('tenant-1', {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    });

    expect(result).toEqual({
      deliveryFeeCents: 410,
      distanceMeters: 0,
    });
  });

  it('throws a migration-specific error when the delivery fee tier table is unavailable and no fallback fee exists', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockRejectedValue(new Error('relation deliveryFeeTier does not exist'));

    await expect(
      service.getDeliveryFeeByDistance('tenant-1', {
        street: 'Main Street 1',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
      }),
    ).rejects.toThrow('Delivery configuration is unavailable. Please contact support (database migration missing).');
  });

  it('returns null when there are no tiers and no default fee for the tenant', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          coordinates: basePickupCoordinates,
        },
      }),
    );
    mockPrisma.deliveryFeeTier.findMany.mockResolvedValue([]);
    jest.spyOn(service, 'geocodeAddress').mockResolvedValue({
      lat: 49,
      lng: 18,
    });

    const result = await service.getDeliveryFeeByDistance('tenant-1', {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    });

    expect(result).toBeNull();
  });

  it('rejects requests when kitchen coordinates are not configured', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(
      buildTenant({
        pickupAddress: {
          street: 'Kitchen Street 1',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
        },
      }),
    );

    await expect(
      service.getDeliveryFeeByDistance('tenant-1', {
        street: 'Main Street 1',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
      }),
    ).rejects.toThrow('Kitchen location is not configured. Please contact support.');
  });
});
