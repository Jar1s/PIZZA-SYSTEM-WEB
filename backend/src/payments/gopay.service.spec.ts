import { GopayService } from './gopay.service';

describe('GopayService', () => {
  let service: GopayService;
  let fetchMock: jest.Mock;
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    service = new GopayService();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.NODE_ENV = 'test';
    process.env.BACKEND_URL = 'https://api.p0rnopizza.sk';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.BACKEND_URL = originalBackendUrl;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('creates GoPay payment with official JSON headers, callback URLs, and payer contact', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          expires_in: 1800,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123456789,
          gw_url: 'https://gw.sandbox.gopay.com/gw/v3/checkout',
          amount: 2249,
          currency: 'EUR',
          state: 'CREATED',
        }),
      });

    const order = {
      id: 'order-123',
      totalCents: 2249,
      customer: {
        name: 'Jaro Svaty',
        email: 'jaro@example.com',
        phone: '+421100200400',
      },
      items: [
        {
          productName: 'Basil Pesto',
          priceCents: 1199,
          quantity: 1,
        },
        {
          productName: 'Doprava',
          priceCents: 1050,
          quantity: 1,
        },
      ],
    } as any;

    const tenant = {
      id: 'tenant-123',
      domain: 'www.p0rnopizza.sk',
      subdomain: 'pornopizza',
      currency: 'EUR',
      paymentConfig: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        goId: 'go-id',
        environment: 'sandbox',
      },
    } as any;

    const result = await service.createPayment(order, tenant);

    expect(result).toEqual({
      paymentId: '123456789',
      redirectUrl: 'https://gw.sandbox.gopay.com/gw/v3/checkout',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://gw.sandbox.gopay.com/api/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        }),
      }),
    );

    const createPaymentCall = fetchMock.mock.calls[1];
    expect(createPaymentCall[0]).toBe('https://gw.sandbox.gopay.com/api/payments/payment');
    expect(createPaymentCall[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );

    const body = JSON.parse(createPaymentCall[1].body);
    expect(body).toMatchObject({
      target: {
        type: 'ACCOUNT',
        goid: 'go-id',
      },
      amount: 2249,
      currency: 'EUR',
      order_number: 'order-123',
      order_description: 'Objednávka order-123',
      payer: {
        contact: {
          first_name: 'Jaro',
          last_name: 'Svaty',
          email: 'jaro@example.com',
          phone_number: '+421100200400',
        },
      },
      callback: {
        return_url: 'https://www.p0rnopizza.sk/checkout/return',
        notification_url: 'https://api.p0rnopizza.sk/api/webhooks/gopay',
      },
    });
    expect(body.items).toEqual([
      {
        name: 'Basil Pesto',
        amount: 1199,
        count: 1,
      },
      {
        name: 'Doprava',
        amount: 1050,
        count: 1,
      },
    ]);
  });
});

describe('GopayService.describeGopayError', () => {
  it('includes GoPay error_code / error_name / description instead of a bare status text', () => {
    const body = {
      date_issued: 1755555555,
      errors: [{ scope: 'G', field: null, message: 'Payment is not in a refundable state', description: 'PAYMENT_NOT_PAID', error_code: 340, error_name: 'PAYMENT_NOT_IN_VALID_STATE' }],
    };
    expect(GopayService.describeGopayError(body, 409, 'Conflict')).toBe(
      '409 Conflict: #340 PAYMENT_NOT_IN_VALID_STATE PAYMENT_NOT_PAID',
    );
  });

  it('falls back to description/message or the HTTP status', () => {
    expect(GopayService.describeGopayError({ message: 'boom' }, 500, 'Internal Server Error')).toBe('500 Internal Server Error: boom');
    expect(GopayService.describeGopayError({}, 409, 'Conflict')).toBe('409 Conflict');
    expect(GopayService.describeGopayError('not json', 502, 'Bad Gateway')).toBe('502 Bad Gateway');
  });
});
