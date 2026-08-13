import { TenantsService } from './tenants.service';

describe('TenantsService slug normalization', () => {
  function buildService(dbTenant: any) {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(dbTenant),
      },
    };
    return { service: new TenantsService(prisma as any), prisma };
  }

  const baseTenant = {
    id: 't1',
    name: 'Pizza v Núdzi',
    subdomain: 'pizzavnudzi',
    isActive: true,
    theme: {},
    paymentConfig: {},
    deliveryConfig: {},
  };

  it.each([
    ['pizzavnudzi', 'pizzavnudzi-sk'],
    ['pizzavnudzi-sk', 'pizzavnudzi-sk'],
    ['pizzaparty', 'partypizza'],
    ['p0rnopizza', 'pornopizza'],
  ])('resolves slug %s against the DB as %s', async (requested, expectedDbSlug) => {
    const { service, prisma } = buildService({ ...baseTenant, slug: expectedDbSlug });

    await service.getTenantBySlug(requested);

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { slug: expectedDbSlug },
    });
  });
});
