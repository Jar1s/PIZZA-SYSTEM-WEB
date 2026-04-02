'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, details?: any) => void;
  onSelectFromMap?: () => void;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  postcode?: string;
  country_code?: string;
}

interface NominatimSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

function isBratislavaAddress(suggestion: NominatimSuggestion): boolean {
  const city =
    suggestion.address?.city ||
    suggestion.address?.town ||
    suggestion.address?.village ||
    suggestion.address?.municipality ||
    suggestion.address?.suburb ||
    '';

  return (
    city.toLowerCase().includes('bratislava') ||
    suggestion.display_name.toLowerCase().includes('bratislava')
  );
}

function toAddressDetails(suggestion: NominatimSuggestion) {
  const city =
    suggestion.address?.city ||
    suggestion.address?.town ||
    suggestion.address?.village ||
    suggestion.address?.municipality ||
    suggestion.address?.suburb ||
    'Bratislava';

  const streetParts = [suggestion.address?.road, suggestion.address?.house_number].filter(Boolean);

  return {
    street: streetParts.length > 0 ? streetParts.join(' ') : suggestion.display_name,
    city,
    postalCode: suggestion.address?.postcode || '',
    country: (suggestion.address?.country_code || 'SK').toUpperCase(),
    formattedAddress: suggestion.display_name,
    geometry: {
      location: {
        lat: Number(suggestion.lat),
        lng: Number(suggestion.lon),
      },
    },
  };
}

export default function AddressAutocomplete({ value, onChange, onSelectFromMap }: AddressAutocompleteProps) {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizedQuery = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (normalizedQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);

        const params = new URLSearchParams({
          format: 'json',
          addressdetails: '1',
          countrycodes: 'sk',
          limit: '6',
          'accept-language': 'sk,en',
          q: normalizedQuery,
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            // Nominatim policy requires identifying user agent/contact in production;
            // browser cannot set custom User-Agent header, so we keep requests modest and debounced.
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as NominatimSuggestion[];
        const filtered = (data || []).filter(isBratislavaAddress);
        setSuggestions(filtered);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: NominatimSuggestion) => {
    const details = toAddressDetails(suggestion);
    onChange(suggestion.display_name, details);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hides so click on suggestion can register
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          placeholder={t.enterAddress}
          autoComplete="off"
          className="w-full px-4 py-3 pr-24 border-2 rounded-lg focus:outline-none focus:border-orange-500"
          style={{ borderColor: value ? 'var(--color-primary)' : '#e5e7eb' }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
              }}
              className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onSelectFromMap}
            className="text-gray-400 hover:text-gray-600"
            title="Vybrať na mape"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {showSuggestions && (isSearching || suggestions.length > 0) && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-3 text-sm text-gray-500">Hľadám adresu...</div>
          )}

          {!isSearching && suggestions.length === 0 && normalizedQuery.length >= 3 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Nenašla sa adresa v Bratislave. Skús presnejšiu ulicu a číslo.
            </div>
          )}

          {!isSearching &&
            suggestions.map((suggestion) => (
              <button
                key={`${suggestion.lat}:${suggestion.lon}:${suggestion.display_name}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">{suggestion.display_name}</div>
              </button>
            ))}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-1">
        Autocomplete: OpenStreetMap
      </div>
    </div>
  );
}
