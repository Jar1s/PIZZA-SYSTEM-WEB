import { DeliveryAreaCacheService } from './delivery-area-cache.service';

describe('DeliveryAreaCacheService contract', () => {
  let service: DeliveryAreaCacheService;

  const woltDriveServiceMock = {
    getDeliveryAreas: jest.fn(),
  };

  const squareArea = {
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

  beforeEach(() => {
    service = new DeliveryAreaCacheService(woltDriveServiceMock as any);
    jest.restoreAllMocks();
    woltDriveServiceMock.getDeliveryAreas.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('returns live area decisions from normalized Wolt polygons', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockResolvedValueOnce(squareArea);

    const result = await service.checkPoint(
      'tenant-1',
      'api-key',
      'merchant-1',
      { lat: 48.15, lng: 17.15 },
      { venueId: 'venue-1' },
    );

    expect(result).toEqual({
      insideArea: true,
      source: 'live',
      reason: null,
      fetchedAt: new Date(1_000).toISOString(),
    });
    expect(woltDriveServiceMock.getDeliveryAreas).toHaveBeenCalledWith(
      'api-key',
      'merchant-1',
      2,
      { venueId: 'venue-1' },
    );
  });

  it('uses fresh cache without hitting Wolt again', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockResolvedValueOnce(squareArea);
    await service.checkPoint('tenant-1', 'api-key', 'merchant-1', { lat: 48.15, lng: 17.15 });

    nowSpy.mockReturnValue(2_000);
    woltDriveServiceMock.getDeliveryAreas.mockClear();

    const result = await service.checkPoint('tenant-1', 'api-key', 'merchant-1', { lat: 48.16, lng: 17.16 });

    expect(result.source).toBe('cache');
    expect(result.insideArea).toBe(true);
    expect(result.reason).toBeNull();
    expect(woltDriveServiceMock.getDeliveryAreas).not.toHaveBeenCalled();
  });

  it('falls back to stale cache while refreshing in the background', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockResolvedValueOnce(squareArea);
    await service.checkPoint('tenant-1', 'api-key', 'merchant-1', { lat: 48.15, lng: 17.15 });

    jest.spyOn(Date, 'now').mockReturnValue(1_000 + 10 * 60 * 1000 + 1);
    woltDriveServiceMock.getDeliveryAreas.mockRejectedValueOnce(new Error('temporary outage'));

    const result = await service.checkPoint('tenant-1', 'api-key', 'merchant-1', { lat: 48.15, lng: 17.15 });

    expect(result).toEqual(
      expect.objectContaining({
        insideArea: true,
        source: 'fallback',
        reason: null,
        fetchedAt: new Date(1_000).toISOString(),
      }),
    );
    expect(woltDriveServiceMock.getDeliveryAreas).toHaveBeenCalledTimes(2);
  });

  it('returns a fallback reason when live delivery areas are unavailable and no cache exists', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockRejectedValueOnce(new Error('service unavailable'));

    const result = await service.checkPoint(
      'tenant-1',
      'api-key',
      'merchant-1',
      { lat: 48.15, lng: 17.15 },
      { venueId: 'venue-1' },
    );

    expect(result).toEqual({
      insideArea: null,
      source: 'fallback',
      reason: 'Wolt delivery areas unavailable: service unavailable',
    });
  });
});

describe('DeliveryAreaCacheService real Wolt response shapes', () => {
  const woltDriveServiceMock = {
    getDeliveryAreas: jest.fn(),
  };

  // Exact shape returned by the Wolt Drive merchants/:id/delivery-areas
  // endpoint (captured 2026-08-16): a NAME-KEYED MAP with GeoJSON [lon, lat]
  // rings — not an array.
  const realWoltResponse = {
    delivery_areas: {
      'Drive test Bratislava': {
        coordinates: [
          [
            [16.99816699169071, 48.20732297057364],
            [17.173927840382646, 48.23397401678264],
            [17.28261673302228, 48.22751443118935],
            [17.323425573753013, 48.12755626416086],
            [17.28504102059034, 48.07412954758098],
            [17.194534284712432, 48.05630830230686],
            [17.07412800216042, 48.061979367838546],
            [17.007460094035963, 48.1216227042589],
            [16.99816699169071, 48.20732297057364],
          ],
        ],
        type: 'Polygon',
      },
    },
  };

  let service: DeliveryAreaCacheService;

  beforeEach(() => {
    service = new DeliveryAreaCacheService(woltDriveServiceMock as any);
    woltDriveServiceMock.getDeliveryAreas.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('parses the name-keyed delivery_areas map and accepts central Bratislava', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockResolvedValueOnce(realWoltResponse);

    const result = await service.checkPoint(
      'tenant-1',
      'api-key',
      'merchant-1',
      { lat: 48.1459, lng: 17.1077 },
      { venueId: 'venue-1' },
    );

    expect(result.insideArea).toBe(true);
  });

  it('rejects Senec, which lies outside the Bratislava polygon', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockResolvedValueOnce(realWoltResponse);

    const result = await service.checkPoint(
      'tenant-1',
      'api-key',
      'merchant-1',
      { lat: 48.2195, lng: 17.4004 },
      { venueId: 'venue-1' },
    );

    expect(result.insideArea).toBe(false);
  });

  it('returns unknown (null) instead of false when no polygons could be parsed', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    woltDriveServiceMock.getDeliveryAreas.mockResolvedValueOnce({ delivery_areas: {} });

    const result = await service.checkPoint(
      'tenant-1',
      'api-key',
      'merchant-1',
      { lat: 48.1459, lng: 17.1077 },
      { venueId: 'venue-1' },
    );

    expect(result.insideArea).toBeNull();
  });
});
