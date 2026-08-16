/**
 * Coordinate sanity checks shared by order intake and delivery.
 *
 * A failed geocode has, in the past, produced { lat: 0, lng: 0 } ("Null
 * Island", in the Atlantic off West Africa). Both numbers are perfectly
 * finite, so Number.isFinite() lets them through — and every downstream step
 * (distance tiers, Wolt area check, courier dispatch) then works with a
 * location 5000 km away from the customer. Treat 0/0 (and anything outside
 * valid WGS-84 ranges) as "no coordinates".
 */
export function isPlausibleCoordinatePair(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  // Null Island: the classic "geocoder returned nothing" sentinel.
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) {
    return false;
  }
  return true;
}
