/**
 * Geocoding utilities for address validation
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

interface GeocodingResult {
  display_name: string;
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
    // Build query string
    const queryParts: string[] = [];
    if (street) queryParts.push(street);
    if (city) queryParts.push(city);
    if (postalCode) queryParts.push(postalCode);
    if (country) queryParts.push(country);
    
    const query = queryParts.join(', ');
    
    // Use Nominatim API with proper user agent (required by their ToS)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PizzaOrderingApp/1.0', // Required by Nominatim ToS
        'Accept-Language': 'sk,en',
      },
    });
    
    if (!response.ok) {
      console.warn('Geocoding API error:', response.status);
      return {
        isValid: false,
        isInBratislava: false,
        message: 'Nepodarilo sa overiť adresu. Prosím, skontrolujte zadané údaje.',
      };
    }
    
    const data: GeocodingResult[] = await response.json();
    
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
    const countryCode = address.country?.toUpperCase() || '';
    
    // Check if it's in Slovakia
    if (countryCode !== 'SK' && countryCode !== 'SLOVAKIA') {
      return {
        isValid: true,
        isInBratislava: false,
        message: 'Momentálne doručujeme len do Bratislavy, Slovensko.',
        fullAddress: result.display_name,
      };
    }
    
    // Check if it's Bratislava
    const isBratislava = 
      cityLower.includes('bratislava') ||
      cityLower.includes('pressburg') ||
      address.state?.toLowerCase().includes('bratislava') ||
      // Check postal code if available
      (address.postcode && /^[89]\d{4}$/.test(address.postcode.replace(/\s+/g, '')));
    
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

