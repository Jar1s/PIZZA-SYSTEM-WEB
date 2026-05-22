import { OrderNumberService } from './order-number.service';

describe('OrderNumberService', () => {
  const tenantId = 'tenant-1';

  const createService = ({
    maxOrderNumber = null,
    initialCounter,
  }: {
    maxOrderNumber?: number | null;
    initialCounter?: number;
  } = {}) => {
    let counterValue = initialCounter;
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: any) => Promise<number>) =>
        callback({
          order: {
            findFirst: jest.fn().mockResolvedValue(
              maxOrderNumber == null ? null : { orderNumber: maxOrderNumber },
            ),
          },
          tenantOrderCounter: {
            upsert: jest.fn().mockImplementation(async ({ create, update }: any) => {
              if (counterValue == null) {
                counterValue = create.lastOrderNumber;
              } else {
                counterValue += update.lastOrderNumber.increment;
              }

              return { lastOrderNumber: counterValue };
            }),
          },
        }),
      ),
    };

    return {
      prisma,
      service: new OrderNumberService(prisma as any),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 1 for a tenant without historical orders', async () => {
    const { service } = createService();

    await expect(service.generateOrderNumber(tenantId)).resolves.toBe(1);
  });

  it('initializes the counter from the historical max order number', async () => {
    const { service } = createService({ maxOrderNumber: 41 });

    await expect(service.generateOrderNumber(tenantId)).resolves.toBe(42);
  });

  it('returns unique monotonic numbers for parallel calls on the same tenant', async () => {
    const { service } = createService({ maxOrderNumber: 41 });

    const results = await Promise.all([
      service.generateOrderNumber(tenantId),
      service.generateOrderNumber(tenantId),
      service.generateOrderNumber(tenantId),
    ]);

    expect(results).toEqual([42, 43, 44]);
  });
});
