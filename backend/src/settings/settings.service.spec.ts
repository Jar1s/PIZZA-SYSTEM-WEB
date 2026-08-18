import { SettingsService } from './settings.service';

describe('SettingsService.applyDeliverySettingsToAllTenants', () => {
  const prisma = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: SettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SettingsService(prisma as any);
  });

  it('copies only the courier-related keys and keeps each target brand\'s other delivery data', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'src', slug: 'pornopizza', subdomain: 'pornopizza', theme: {}, paymentProvider: 'gopay', paymentConfig: {},
      deliveryConfig: {
        provider: 'wolt',
        woltConfig: { apiKey: 'live-key', merchantId: 'm1', venueId: 'v1', apiUrl: 'https://daas-public-api.wolt.com' },
        dispatchMode: 'manual',
        defaultFeeCents: 0,
        pickupAddress: { street: 'Kuchyňa 1', city: 'Bratislava', postalCode: '81101', country: 'SK' },
        zonesSomethingElse: 'stays-on-source-only',
      },
    });
    prisma.tenant.findMany.mockResolvedValue([
      { id: 't2', slug: 'partypizza', deliveryConfig: { provider: 'wolt', woltConfig: { apiKey: 'old' }, customThing: 'keep-me' } },
      { id: 't3', slug: 'pizzavnudzi-sk', deliveryConfig: null },
    ]);
    prisma.tenant.update.mockResolvedValue({});

    const result = await service.applyDeliverySettingsToAllTenants('pornopizza');

    expect(result).toEqual({ source: 'pornopizza', applied: ['partypizza', 'pizzavnudzi-sk'], skipped: [] });
    expect(prisma.tenant.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true, id: { not: 'src' } } }));
    const partyUpdate = prisma.tenant.update.mock.calls.find((c: any) => c[0].where.id === 't2')[0].data.deliveryConfig;
    expect(partyUpdate).toEqual({
      customThing: 'keep-me',
      provider: 'wolt',
      woltConfig: { apiKey: 'live-key', merchantId: 'm1', venueId: 'v1', apiUrl: 'https://daas-public-api.wolt.com' },
      dispatchMode: 'manual',
      defaultFeeCents: 0,
      pickupAddress: { street: 'Kuchyňa 1', city: 'Bratislava', postalCode: '81101', country: 'SK' },
    });
    expect(partyUpdate).not.toHaveProperty('zonesSomethingElse');
  });

  it('reports brands where the update failed instead of aborting the whole copy', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'src', slug: 'a', deliveryConfig: { woltConfig: { apiKey: 'k' } } });
    prisma.tenant.findMany.mockResolvedValue([
      { id: 't2', slug: 'b', deliveryConfig: {} },
      { id: 't3', slug: 'c', deliveryConfig: {} },
    ]);
    prisma.tenant.update.mockImplementation(async (args: any) => {
      if (args.where.id === 't2') throw new Error('db down');
      return {};
    });
    const result = await service.applyDeliverySettingsToAllTenants('a');
    expect(result.applied).toEqual(['c']);
    expect(result.skipped).toEqual(['b']);
  });

  it('refuses when the source brand has nothing to copy', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'src', slug: 'a', deliveryConfig: {} });
    await expect(service.applyDeliverySettingsToAllTenants('a')).rejects.toThrow(/nemá žiadne nastavenia/);
  });
});
