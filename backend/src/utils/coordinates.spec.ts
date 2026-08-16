import { isPlausibleCoordinatePair } from './coordinates';

describe('isPlausibleCoordinatePair', () => {
  it('accepts real Bratislava coordinates', () => {
    expect(isPlausibleCoordinatePair(48.1439, 17.1085)).toBe(true);
  });

  it('rejects Null Island (failed-geocode sentinel)', () => {
    expect(isPlausibleCoordinatePair(0, 0)).toBe(false);
  });

  it('rejects out-of-range and non-numeric values', () => {
    expect(isPlausibleCoordinatePair(95, 17)).toBe(false);
    expect(isPlausibleCoordinatePair(48, 190)).toBe(false);
    expect(isPlausibleCoordinatePair(NaN, 17)).toBe(false);
    expect(isPlausibleCoordinatePair('48' as any, 17)).toBe(false);
    expect(isPlausibleCoordinatePair(null, null)).toBe(false);
  });
});
