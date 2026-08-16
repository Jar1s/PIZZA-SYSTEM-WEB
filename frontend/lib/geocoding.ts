/**
 * Geocoding utilities for address validation
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingbox?: [string, string, string, string]; // [min_lat, max_lat, min_lon, max_lon]
}

interface GeocodingResponse {
  isValid: boolean;
  isInBratislava: boolean;
  message?: string;
  fullAddress?: string;
}

export function isPlausibleCoordinatePair(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
  return true;
}

export interface AddressCoordinates {
  lat: number;
  lng: number;
}

function buildGeocodingQuery(
  street: string,
  city: string,
  postalCode: string,
  country: string,
): string {
  const queryParts: string[] = [];
  if (street) queryParts.push(street);
  if (city) queryParts.push(city);
  if (postalCode) queryParts.push(postalCode);
  if (country) queryParts.push(country);
  return queryParts.join(', ');
}

async function fetchGeocodingResults(
  street: string,
  city: string,
  postalCode: string,
  country: string,
): Promise<GeocodingResult[]> {
  const query = buildGeocodingQuery(street, city, postalCode, country);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PizzaOrderingApp/1.0',
      'Accept-Language': 'sk,en',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = (await response.json()) as GeocodingResult[];
  return data || [];
}

export async function resolveAddressCoordinates(
  street: string,
  city: string,
  postalCode: string,
  country: string = 'SK',
): Promise<AddressCoordinates | null> {
  try {
    const data = await fetchGeocodingResults(street, city, postalCode, country);

    if (!data.length) {
      return null;
    }

    const result = data[0];
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    // Null Island (0,0) is what a failed lookup can degrade into; never treat
    // it as a real position — the caller must fall back to "no coordinates".
    if (!isPlausibleCoordinatePair(lat, lng)) {
      return null;
    }

    return { lat, lng };
  } catch (error) {
    console.warn('Failed to resolve address coordinates:', error);
    return null;
  }
}

/**
 * Geocode an address using OpenStreetMap Nominatim API
 * @param street Street address
 * @param city City name
 * @param postalCode Postal code
 * @param country Country code (default: SK)
 * @returns Geocoding result with validation
 */
export async function geocodeAddress(
  street: string,
  city: string,
  postalCode: string,
  country: string = 'SK'
): Promise<GeocodingResponse> {
  try {
    const data = await fetchGeocodingResults(street, city, postalCode, country);
    
    if (!data || data.length === 0) {
      return {
        isValid: false,
        isInBratislava: false,
        message: 'Adresa nebola nájdená. Prosím, skontrolujte zadané údaje.',
      };
    }
    
    const result = data[0];
    const address = result.address;
    
    // Check if address is in Bratislava
    const cityName = address.city || address.town || address.village || address.municipality || '';
    const cityLower = cityName.toLowerCase();
    
    // Check country code in multiple formats (Nominatim can return different formats)
    const countryCode = (address.country?.toUpperCase() || '').trim();
    const countryCodeNormalized = countryCode === 'SLOVAKIA' || countryCode === 'SLOVENSKO' || countryCode === 'SK' 
      ? 'SK' 
      : countryCode;
    
    // Check postal code - if it matches Bratislava format (8xx xx or 9xx xx), trust it
    const postcodeNormalized = address.postcode?.replace(/\s+/g, '') || '';
    const isBratislavaPostcode = /^[89]\d{4}$/.test(postcodeNormalized);
    
    // Check if it's Bratislava by city name or postal code
    const isBratislava = 
      cityLower.includes('bratislava') ||
      cityLower.includes('pressburg') ||
      address.state?.toLowerCase().includes('bratislava') ||
      isBratislavaPostcode;
    
    // If postal code matches Bratislava format, trust it even if country code is missing/wrong
    // (geocoding APIs can sometimes return incomplete data)
    if (isBratislavaPostcode && cityLower.includes('bratislava')) {
      return {
        isValid: true,
        isInBratislava: true,
        fullAddress: result.display_name,
      };
    }
    
    // Check if it's in Slovakia (but be lenient - if city/postcode suggest Bratislava, trust it)
    if (countryCodeNormalized !== 'SK' && !isBratislava) {
      // Only show error if we're really sure it's not Slovakia
      // If postal code or city suggest Bratislava, allow it
      if (!isBratislavaPostcode && !cityLower.includes('bratislava')) {
        return {
          isValid: true,
          isInBratislava: false,
          message: 'Momentálne doručujeme len do Bratislavy, Slovensko.',
          fullAddress: result.display_name,
        };
      }
    }
    
    return {
      isValid: true,
      isInBratislava: Boolean(isBratislava),
      message: isBratislava 
        ? undefined 
        : 'Adresa nie je v Bratislave. Momentálne doručujeme len do Bratislavy.',
      fullAddress: result.display_name,
    };
  } catch (error: any) {
    console.error('Geocoding error:', error);
    // Don't block the order if geocoding fails - fall back to basic validation
    return {
      isValid: true, // Allow to continue with basic validation
      isInBratislava: false,
      message: 'Nepodarilo sa overiť adresu cez geocoding. Použije sa základná validácia.',
    };
  }
}

/**
 * Simple validation without API call (fallback)
 */
export function validateBratislavaAddressSimple(
  city: string,
  postalCode: string
): { isValid: boolean; message?: string } {
  const cityNormalized = city.trim().toLowerCase();
  const postalCodeNormalized = postalCode.trim().replace(/\s+/g, '');
  
  // Check if city contains "bratislava" or similar variants
  const isBratislavaCity = 
    cityNormalized.includes('bratislava') || 
    cityNormalized === 'ba' ||
    cityNormalized.startsWith('bratislava');
  
  // Bratislava postal codes: 8xx xx or 9xx xx (Slovakia uses 5-digit format)
  const postalCodeMatch = postalCodeNormalized.match(/^[89]\d{4}$/);
  const isBratislavaPostalCode = postalCodeMatch !== null;
  
  if (!isBratislavaCity && !isBratislavaPostalCode) {
    return {
      isValid: false,
      message: 'Momentálne doručujeme len do Bratislavy. Prosím, zadajte adresu v Bratislave.',
    };
  }
  
  // If postal code doesn't match Bratislava but city does, warn but allow
  if (isBratislavaCity && !isBratislavaPostalCode) {
    return {
      isValid: true,
      message: 'Prosím, overte, že PSČ zodpovedá Bratislave (8xx xx alebo 9xx xx).',
    };
  }
  
  return { isValid: true };
}
