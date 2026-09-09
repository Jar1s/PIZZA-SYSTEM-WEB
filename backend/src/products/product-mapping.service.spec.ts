import { ProductMappingService } from './product-mapping.service';

describe('ProductMappingService.copyMappingsFromTenant', () => {
  const prisma = {
    productMapping: { findMany: jest.fn(), upsert: jest.fn() },
    product: { findMany: jest.fn() },
  };
  const service = new ProductMappingService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('copies mappings for products the target tenant has and skips the rest', async () => {
    prisma.productMapping.findMany.mockResolvedValue([
      { externalIdentifier: 'p:1', internalProductName: 'Tiramisu', source: 'storyous' },
      { externalIdentifier: 'p:2', internalProductName: 'Coca Cola 1l', source: 'storyous' },
      { externalIdentifier: 'p:3', internalProductName: 'Only In Source', source: 'storyous' },
    ]);
    prisma.product.findMany.mockResolvedValue([{ name: 'Tiramisu' }, { name: 'Coca Cola 1l' }]);
    prisma.productMapping.upsert.mockResolvedValue({});

    const result = await service.copyMappingsFromTenant('src', 'dst');

    expect(prisma.productMapping.findMany).toHaveBeenCalledWith({ where: { tenantId: 'src', source: 'storyous' } });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { OR: [{ tenantId: 'dst' }, { tenantId: null }] },
      select: { name: true },
    });
    expect(prisma.productMapping.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.productMapping.upsert).toHaveBeenCalledWith({
      where: { tenantId_externalIdentifier_source: { tenantId: 'dst', externalIdentifier: 'p:1', source: 'storyous' } },
      create: { tenantId: 'dst', externalIdentifier: 'p:1', internalProductName: 'Tiramisu', source: 'storyous' },
      update: { internalProductName: 'Tiramisu' },
    });
    expect(result).toEqual({ source: 'storyous', total: 3, copied: 2, skipped: ['Only In Source'] });
  });

  it('does nothing when the source tenant has no mappings', async () => {
    prisma.productMapping.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([{ name: 'Tiramisu' }]);

    const result = await service.copyMappingsFromTenant('src', 'dst', 'storyous');

    expect(prisma.productMapping.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({ source: 'storyous', total: 0, copied: 0, skipped: [] });
  });
});
