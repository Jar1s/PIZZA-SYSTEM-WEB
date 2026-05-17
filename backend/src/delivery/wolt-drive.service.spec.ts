import { BadRequestException } from '@nestjs/common';
import { WoltDriveService } from './wolt-drive.service';

describe('WoltDriveService contract', () => {
  let service: WoltDriveService;

  const apiConfig = {
    apiUrl: 'https://custom.wolt.example/v1/',
    venueId: 'venue-123',
  };

  const buildResponse = (body: any, status = 200, statusText = 'OK') =>
    ({
      ok: status >= 200 && status < 300,
      status,
      statusText,
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    }) as any;

  beforeEach(() => {
    service = new WoltDriveService();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('posts shipment promise requests to the normalized Wolt shipment-promises endpoint', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      buildResponse({
        id: 'promise-1',
        price: { amount: 450, currency: 'EUR' },
        distance: 2300,
        pickup_eta_minutes: 18,
        dropoff_eta_minutes: 28,
        valid_until: '2026-04-05T12:00:00.000Z',
      }),
    );

    const result = await service.getQuote(
      'api-key',
      { street: 'Kitchen Street 1' } as any,
      {
        street: 'Hlavná 1',
        city: 'Bratislava',
        postalCode: '81101',
        coordinates: { lat: 48.145, lng: 17.11 },
      } as any,
      1,
      apiConfig,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.wolt.example/v1/venues/venue-123/shipment-promises',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer api-key',
          'Content-Type': 'application/json',
        },
      }),
    );
    expect(JSON.parse((fetchMock.mock.calls[0][1] as any).body)).toEqual({
      street: 'Hlavná 1',
      city: 'Bratislava',
      post_code: '81101',
      lat: 48.145,
      lon: 17.11,
      min_preparation_time_minutes: 20,
    });
    expect(result).toEqual({
      promiseId: 'promise-1',
      feeCents: 450,
      etaMinutes: 28,
      pickupEtaMinutes: 18,
      dropoffEtaMinutes: 28,
      validUntil: '2026-04-05T12:00:00.000Z',
      currency: 'EUR',
      distance: 2300,
    });
  });

  it('creates deliveries with shipment promise, preparation time and support fallbacks preserved', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      buildResponse({
        id: 'delivery-1',
        wolt_order_reference_id: 'wolt-ref-1',
        status: 'ASSIGNED',
        tracking: { id: 'tracking-1', url: 'https://track.example/delivery-1' },
        price: { amount: 720, currency: 'EUR' },
        pickup_eta_minutes: 12,
        dropoff_eta_minutes: 24,
        distance: 4321,
      }),
    );

    const result = await service.createDelivery(
      'api-key',
      'order-123',
      {
        street: 'Kitchen Street 1',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
        instructions: 'Back entrance',
      } as any,
      {
        street: 'Hlavná 1',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
        instructions: 'Ring bell',
        coordinates: { lat: 48.145, lng: 17.11 },
      } as any,
      'Customer Name',
      '+421900000000',
      'promise-123',
      45,
      1,
      apiConfig,
      {
        parcelPriceCents: 1590,
        parcelCurrency: 'EUR',
        orderNumber: '789',
        supportEmail: 'ops@example.com',
        supportUrl: 'https://support.example.com',
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.wolt.example/v1/venues/venue-123/deliveries',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer api-key',
          'Content-Type': 'application/json',
        },
      }),
    );
    expect(JSON.parse((fetchMock.mock.calls[0][1] as any).body)).toEqual({
      pickup: {
        comment: 'Back entrance',
        options: {
          min_preparation_time_minutes: 45,
        },
      },
      dropoff: {
        location: {
          coordinates: {
            lat: 48.145,
            lon: 17.11,
          },
        },
        comment: 'Ring bell',
        options: {
          is_no_contact: false,
        },
      },
      recipient: {
        name: 'Customer Name',
        phone_number: '+421900000000',
      },
      parcels: [
        {
          description: 'Pizza order',
          identifier: 'order-123',
          count: 1,
          price: {
            amount: 1590,
            currency: 'EUR',
          },
        },
      ],
      merchant_order_reference_id: 'order-123',
      customer_support: {
        email: 'ops@example.com',
        url: 'https://support.example.com',
      },
      order_number: '789',
      shipment_promise_id: 'promise-123',
    });
    expect(result).toEqual({
      jobId: 'wolt-ref-1',
      woltOrderReferenceId: 'wolt-ref-1',
      trackingId: 'tracking-1',
      trackingUrl: 'https://track.example/delivery-1',
      status: 'ASSIGNED',
      courierEta: 24,
      feeCents: 720,
      etaMinutes: 24,
      pickupEtaMinutes: 12,
      dropoffEtaMinutes: 24,
      distance: 4321,
      currency: 'EUR',
      promiseId: 'promise-123',
      validUntil: undefined,
    });
  });

  it('cancels deliveries through the live order status endpoint and uses the merchant cancel body', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      buildResponse({
        id: 'job-1',
        status: 'CANCELLED',
      }),
    );

    const result = await service.cancelDelivery('api-key', 'job/123', 1, apiConfig);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.wolt.example/order/job%2F123/status/cancel',
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelled by merchant',
        }),
      },
    );
    expect(result).toEqual({
      id: 'job-1',
      status: 'CANCELLED',
    });
  });

  it('loads delivery areas from the merchant delivery-areas endpoint', async () => {
    const responseBody = {
      delivery_areas: [
        {
          id: 'zone-1',
          polygon: [
            [
              { lat: 48.1, lng: 17.1 },
              { lat: 48.1, lng: 17.2 },
              { lat: 48.2, lng: 17.2 },
              { lat: 48.2, lng: 17.1 },
              { lat: 48.1, lng: 17.1 },
            ],
          ],
        },
      ],
    };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(buildResponse(responseBody));

    const result = await service.getDeliveryAreas('api-key', 'merchant-1', 1, apiConfig);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.wolt.example/v1/merchants/merchant-1/delivery-areas',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer api-key',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(result).toEqual(responseBody);
  });

  it('maps delivery area 400 errors outside the delivery zone to the Slovak user-facing message', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      buildResponse(
        {
          message: 'Customer location is outside of the delivery area',
        },
        400,
        'Bad Request',
      ),
    );

    await expect(
      service.createDelivery(
        'api-key',
        'order-123',
        {
          street: 'Kitchen Street 1',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
        } as any,
        {
          street: 'Hlavná 1',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
          coordinates: { lat: 48.145, lng: 17.11 },
        } as any,
        'Customer Name',
        '+421900000000',
        'promise-123',
        45,
        1,
        apiConfig,
      ),
    ).rejects.toThrow('Adresa zákazníka je mimo doručovacej zóny Wolt pre túto prevádzku.');
  });

  it('rejects requests before fetch when dropoff coordinates are missing', async () => {
    await expect(
      service.getQuote(
        'api-key',
        { street: 'Kitchen Street 1' } as any,
        {
          street: 'Hlavná 1',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
        } as any,
        1,
        apiConfig,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getQuote(
        'api-key',
        { street: 'Kitchen Street 1' } as any,
        {
          street: 'Hlavná 1',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
        } as any,
        1,
        apiConfig,
      ),
    ).rejects.toThrow('Missing or invalid dropoff coordinates for Wolt delivery. Please set geolocation first.');
  });
});
