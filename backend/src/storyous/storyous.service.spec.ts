import { OrderStatus } from '@pizza-ecosystem/shared';
import { StoryousService } from './storyous.service';

describe('StoryousService', () => {
  let service: StoryousService;

  const mockSettingsService = {
    getStoryousSettings: jest.fn(),
    getStoryousAutoPrintReadiness: jest.fn(),
  };
  const mockPrismaService = {
    storyousModifierMapping: {
      findMany: jest.fn(),
    },
  };

  const buildJsonResponse = (body: Record<string, any>, status = 200) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    }) as any;

  const baseOrder = {
    id: 'order-1',
    tenantId: 'tenant-1',
    orderNumber: 7879,
    status: OrderStatus.PREPARING,
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+421912345678',
    },
    address: {
      street: 'Main Street',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    },
    subtotalCents: 1000,
    taxCents: 0,
    deliveryFeeCents: 300,
    totalCents: 1300,
    paymentRef: null,
    paymentStatus: 'success',
    deliveryId: null,
    storyousOrderId: null,
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'product-1',
        productName: 'Margherita',
        quantity: 1,
        priceCents: 1000,
        modifiers: null,
        storyousItemId: 'storyous-item-1',
      },
    ],
    createdAt: new Date('2026-04-02T10:00:00.000Z'),
    updatedAt: new Date('2026-04-02T10:00:00.000Z'),
    tenant: {
      slug: 'pornopizza',
      subdomain: 'pornopizza',
      domain: 'p0rnopizza.sk',
      theme: {},
    },
  } as any;

  beforeEach(() => {
    service = new StoryousService(mockSettingsService as any, mockPrismaService as any);
    mockSettingsService.getStoryousAutoPrintReadiness.mockResolvedValue({
      ready: true,
      blockers: [],
      warnings: [],
      checks: {
        enabled: true,
        credentialsConfigured: true,
        merchantPlaceConfigured: true,
        autoAcceptPrintMode: true,
        receiptIncludeModifierLines: true,
        receiptIncludeOrderNumber: true,
      },
    });
    mockPrismaService.storyousModifierMapping.findMany.mockResolvedValue([]);
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('includes autoConfirm and resolves CONFIRMED when Storyous verifies acceptance', async () => {
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      clientId: 'client',
      clientSecret: 'secret',
      enabled: true,
      autoSync: true,
      defaultDeliveryLeadMinutes: 45,
      autoAcceptPrintMode: true,
      receiptIncludeModifierLines: true,
      receiptIncludeOrderNumber: true,
    });

    const fetchMock = jest.spyOn(global, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        buildJsonResponse({
          access_token: 'token-123',
          expires_at: '2026-04-02T11:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          orderId: 'storyous-1',
          state: 'NEW',
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          orderId: 'storyous-1',
          state: 'CONFIRMED',
        }),
      );

    const result = await service.createOrder(baseOrder, 'merchant-1', 'place-1');

    expect(result).toMatchObject({
      id: 'storyous-1',
      storyousState: 'CONFIRMED',
      autoConfirmRequested: true,
      requiresManualAcceptance: false,
      verificationFailed: false,
    });

    const createPayload = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);
    expect(createPayload.autoConfirm).toBe(true);
  });

  it('does not include autoConfirm when disabled and keeps NEW state when manual acceptance is still required', async () => {
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      clientId: 'client',
      clientSecret: 'secret',
      enabled: true,
      autoSync: true,
      defaultDeliveryLeadMinutes: 45,
      autoAcceptPrintMode: false,
      receiptIncludeModifierLines: true,
      receiptIncludeOrderNumber: true,
    });

    const fetchMock = jest.spyOn(global, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        buildJsonResponse({
          access_token: 'token-123',
          expires_at: '2026-04-02T11:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          orderId: 'storyous-2',
          state: 'NEW',
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          orderId: 'storyous-2',
          state: 'NEW',
        }),
      );

    const result = await service.createOrder(baseOrder, 'merchant-1', 'place-1');

    expect(result).toMatchObject({
      id: 'storyous-2',
      storyousState: 'NEW',
      autoConfirmRequested: false,
      requiresManualAcceptance: true,
      verificationFailed: false,
    });

    const createPayload = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);
    expect(createPayload.autoConfirm).toBeUndefined();
  });

  it('sends mapped modifiers via additions and leaves unmapped modifiers in fallback note', async () => {
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      clientId: 'client',
      clientSecret: 'secret',
      enabled: true,
      autoSync: true,
      defaultDeliveryLeadMinutes: 45,
      autoAcceptPrintMode: true,
      receiptIncludeModifierLines: true,
      receiptIncludeOrderNumber: true,
    });
    mockPrismaService.storyousModifierMapping.findMany.mockResolvedValue([
      {
        optionId: 'classic-32',
        externalAdditionId: 'addition-1',
        labelOverride: 'Klasické 32 cm',
      },
    ]);

    const orderWithModifiers = {
      ...baseOrder,
      items: [
        {
          ...baseOrder.items[0],
          resolvedModifierLines: ['Klasické 32 cm', 'Paradajkovy'],
          storyousModifierSelections: [
            {
              optionId: 'classic-32',
              receiptLabel: 'Klasické 32 cm',
            },
            {
              optionId: 'tomato',
              receiptLabel: 'Paradajkovy',
            },
          ],
        },
      ],
    } as any;

    const fetchMock = jest.spyOn(global, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        buildJsonResponse({
          access_token: 'token-123',
          expires_at: '2026-04-02T11:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          orderId: 'storyous-3',
          state: 'CONFIRMED',
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          orderId: 'storyous-3',
          state: 'CONFIRMED',
        }),
      );

    const result = await service.createOrder(orderWithModifiers, 'merchant-1', 'place-1');
    const createPayload = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);

    expect(createPayload.items[0].additions).toEqual([
      {
        additionId: 'addition-1',
        countPerMainItem: 1,
        unitPriceWithVat: 0,
      },
    ]);
    expect(createPayload.items[0].note).toBe('+Paradajkovy');
    expect(result.warnings).toContain(
      'Modifier "Paradajkovy" (tomato) nema Storyous addition mapping, preto ostava vo fallback note.',
    );
  });

  it('builds preview with the same modifier labels and warnings as payload builder', async () => {
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      clientId: 'client',
      clientSecret: 'secret',
      enabled: true,
      autoSync: true,
      defaultDeliveryLeadMinutes: 45,
      autoAcceptPrintMode: true,
      receiptIncludeModifierLines: true,
      receiptIncludeOrderNumber: true,
    });
    mockPrismaService.storyousModifierMapping.findMany.mockResolvedValue([
      {
        optionId: 'olive-oil',
        externalAdditionId: 'addition-olive',
        labelOverride: null,
      },
    ]);

    const preview = await service.getReceiptPreview({
      ...baseOrder,
      items: [
        {
          ...baseOrder.items[0],
          resolvedModifierLines: ['Olivovým olejom', 'Paradajkovy'],
          storyousModifierSelections: [
            {
              optionId: 'olive-oil',
              receiptLabel: 'Olivovým olejom',
            },
            {
              optionId: 'tomato',
              receiptLabel: 'Paradajkovy',
            },
          ],
        },
      ],
    } as any);

    expect(preview.items[0].modifierLines).toEqual(['+Olivovým olejom', '+Paradajkovy']);
    expect(preview.warnings).toContain(
      'Modifier "Paradajkovy" (tomato) nema Storyous addition mapping, preto ostava vo fallback note.',
    );
  });
});
