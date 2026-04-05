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
