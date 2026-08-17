/**
 * Pure helpers for the address autocomplete (no React) so they can be unit
 * tested. See components/account/AddressAutocomplete.tsx for the UI.
 *
 * Backed by Photon (photon.komoot.io), an OpenStreetMap geocoder built for
 * search-as-you-type: prefix matching, tolerant to missing diacritics
 * ("nabrezie" → "Nábrežie…"), house numbers. Nominatim, used before, is a
 * full-address geocoder – it needs complete words, has no prefix search and its
 * usage policy forbids autocomplete. It is still used for the final address
 * validation in lib/geocoding.ts.
 */

export interface AddressDetails {
  /** Street incl. house number when known ("Obchodná 5") – backwards compatible */
  street: string;
  /** Street name only ("Obchodná") */
  road: string;
  /** House number when the suggestion is a concrete address ("5", "7152/5") */
  houseNumber: string;
  city: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  geometry: { location: { lat: number; lng: number } };
}

export const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';
// Bratislava + close surroundings (lon/lat): results are biased and boxed here.
export const BRATISLAVA_CENTER = { lat: 48.148, lon: 17.107 };
export const BRATISLAVA_BBOX = '16.90,48.00,17.35,48.35';

export interface PhotonProperties {
  osm_id?: number;
  osm_key?: string;
  osm_value?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
}

export interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lon, lat]
  properties: PhotonProperties;
}

export interface AddressSuggestion {
  key: string;
  primary: string; // "Obchodná 5"
  secondary: string; // "811 06 Bratislava · Staré Mesto"
  road: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
}

function includesBratislava(value: string | undefined): boolean {
  return !!value && value.toLowerCase().includes('bratislav');
}

// NOTE: `state` is deliberately not checked – Photon returns "Bratislavský kraj"
// for the whole region (Malacky, Pezinok, Senec …), which we do not deliver to.
function isBratislavaArea(p: PhotonProperties): boolean {
  return (
    includesBratislava(p.city) ||
    includesBratislava(p.district) ||
    includesBratislava(p.county) ||
    /^8\d{2}\s?\d{2}$/.test((p.postcode || '').trim())
  );
}

function formatPostcode(postcode: string | undefined): string {
  const digits = (postcode || '').replace(/\s+/g, '');
  return digits.length === 5 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : postcode || '';
}

export function toSuggestions(features: PhotonFeature[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];

  for (const feature of features) {
    const p = feature.properties || {};
    if ((p.countrycode || '').toUpperCase() !== 'SK') continue;
    if (!isBratislavaArea(p)) continue;

    const road = (p.street || (p.osm_key === 'highway' ? p.name : '') || '').trim();
    const houseNumber = (p.housenumber || '').trim();
    const poiName = p.osm_key !== 'highway' && p.name && p.name !== road ? p.name.trim() : '';
    if (!road && !poiName) continue;

    const primaryBase = road || poiName;
    const primary = houseNumber ? `${primaryBase} ${houseNumber}` : primaryBase;
    // Photon returns Bratislava streets with city=null, district="Staré Mesto",
    // county="okres Bratislava I" – the city is Bratislava, the district is extra.
    const inBratislavaCounty = includesBratislava(p.county);
    const city = (p.city || (inBratislavaCounty ? 'Bratislava' : p.district) || 'Bratislava').trim();
    const postalCode = formatPostcode(p.postcode);
    // A street without a number is one suggestion even if it spans several
    // postcodes; concrete addresses stay distinct per postcode.
    const key = houseNumber
      ? `${primary.toLowerCase()}|${postalCode}|${city.toLowerCase()}`
      : `${primary.toLowerCase()}|${city.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const district = p.district && p.district !== city ? p.district : '';
    const secondaryParts = [
      [postalCode, city].filter(Boolean).join(' '),
      district,
      poiName && road ? poiName : '',
    ].filter(Boolean);

    out.push({
      key,
      primary,
      secondary: secondaryParts.join(' · '),
      road: road || poiName,
      houseNumber,
      city,
      postalCode,
      country: 'SK',
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    });
  }

  return out;
}

export function toAddressDetails(s: AddressSuggestion): AddressDetails {
  return {
    street: s.primary,
    road: s.road,
    houseNumber: s.houseNumber,
    city: s.city,
    postalCode: s.postalCode,
    country: s.country,
    formattedAddress: `${s.primary}, ${[s.postalCode, s.city].filter(Boolean).join(' ')}`,
    geometry: { location: { lat: s.lat, lng: s.lng } },
  };
}
