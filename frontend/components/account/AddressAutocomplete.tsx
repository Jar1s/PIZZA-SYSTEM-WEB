'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, details?: any) => void;
  onSelectFromMap?: () => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export default function AddressAutocomplete({ value, onChange, onSelectFromMap }: AddressAutocompleteProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Bratislava bounds
    const bratislavaBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(48.05, 16.95), // Southwest
      new window.google.maps.LatLng(48.25, 17.25)  // Northeast
    );

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ['sk'] },
      bounds: bratislavaBounds,
      strictBounds: false,
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      types: ['address'],
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        // Extract address components
        const addressComponents = place.address_components || [];
        let street = '';
        let city = '';
        let postalCode = '';
        let country = 'SK';

        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('route')) {
            street = component.long_name;
          }
          if (types.includes('street_number')) {
            street = street ? `${street} ${component.long_name}` : component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
          if (types.includes('country')) {
            country = component.short_name;
          }
        });

        // Check if address is in Bratislava
        const isBratislava = city.toLowerCase().includes('bratislava') || 
                            addressComponents.some((c: any) => 
                              (c.types.includes('administrative_area_level_2') || 
                               c.types.includes('locality')) && 
                              c.long_name.toLowerCase().includes('bratislava')
                            );

        if (!isBratislava) {
          alert('Adresa musí byť v Bratislave. Prosím, vyberte adresu v Bratislave.');
          onChange('');
          if (inputRef.current) inputRef.current.value = '';
          return;
        }

        onChange(place.formatted_address, {
          street: street || place.formatted_address,
          city,
          postalCode,
          country,
          formattedAddress: place.formatted_address,
          geometry: place.geometry,
        });
      }
    });
    };

    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        setTimeout(() => initializeAutocomplete(), 100);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogle);
            setIsLoaded(true);
            setTimeout(() => initializeAutocomplete(), 100);
          }
        }, 100);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is not set. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=sk`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Check your API key and restrictions.');
        setIsLoaded(false);
      };
      script.onload = () => {
        setIsLoaded(true);
        setTimeout(() => initializeAutocomplete(), 100);
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [onChange]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.enterAddress}
          className="w-full px-4 py-3 pr-24 border-2 rounded-lg focus:outline-none focus:border-orange-500"
          style={{ borderColor: value ? 'var(--color-primary)' : '#e5e7eb' }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (inputRef.current) inputRef.current.value = '';
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

      {/* Powered by Google */}
      {isLoaded && (
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span>Poháňané</span>
          <span className="font-semibold text-gray-600">Google</span>
        </div>
      )}
    </div>
  );
}

