'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string, details: any) => void;
  initialLocation?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapPicker({ isOpen, onClose, onSelect, initialLocation }: MapPickerProps) {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>(
    initialLocation || { lat: 48.1486, lng: 17.1077 } // Bratislava default
  );

  useEffect(() => {
    if (!isOpen) return;

    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setTimeout(() => initializeMap(), 100);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogle);
            setIsLoaded(true);
            setTimeout(() => initializeMap(), 100);
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=sk`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Check your API key and restrictions.');
        setIsLoaded(false);
      };
      script.onload = () => {
        setIsLoaded(true);
        setTimeout(() => initializeMap(), 100);
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [isOpen]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    // Bratislava bounds
    const bratislavaBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(48.05, 16.95), // Southwest
      new window.google.maps.LatLng(48.25, 17.25)  // Northeast
    );

    // Initialize map with restrictions
    const map = new window.google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      restriction: {
        latLngBounds: bratislavaBounds,
        strictBounds: false, // Allow slight overflow for better UX
      },
    });

    mapInstanceRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();

    // Create marker
    const marker = new window.google.maps.Marker({
      map,
      position: currentLocation,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    markerRef.current = marker;

    // Update address when marker is dragged
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        updateAddressFromPosition(position.lat(), position.lng());
      }
    });

    // Update address when map is clicked
    map.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      updateAddressFromPosition(lat, lng);
    });

    // Get initial address
    updateAddressFromPosition(currentLocation.lat, currentLocation.lng);
  };

  const updateAddressFromPosition = (lat: number, lng: number) => {
    if (!geocoderRef.current || !window.google?.maps) return;

    // Check if position is within Bratislava bounds
    const bratislavaBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(48.05, 16.95),
      new window.google.maps.LatLng(48.25, 17.25)
    );
    const position = new window.google.maps.LatLng(lat, lng);

    if (!bratislavaBounds.contains(position)) {
      setSelectedAddress('Adresa musí byť v Bratislave');
      return;
    }

    geocoderRef.current.geocode(
      { 
        location: { lat, lng },
        bounds: bratislavaBounds,
      }, 
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          
          // Extract address components
          const addressComponents = results[0].address_components || [];
          let street = '';
          let city = '';
          let postalCode = '';
          let country = 'SK';

          addressComponents.forEach((component: any) => {
            const types = component.types;
            if (types.includes('street_number') || types.includes('route')) {
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

          if (isBratislava) {
            setSelectedAddress(address);
            setCurrentLocation({ lat, lng });
          } else {
            setSelectedAddress('Adresa musí byť v Bratislave');
          }
        } else {
          setSelectedAddress('Nepodarilo sa nájsť adresu v Bratislave');
        }
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedAddress || selectedAddress.includes('musí byť v Bratislave') || !markerRef.current) {
      alert('Prosím, vyberte adresu v Bratislave.');
      return;
    }

    const position = markerRef.current.getPosition();
    if (position) {
      // Final check if position is within Bratislava
      const bratislavaBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(48.05, 16.95),
        new window.google.maps.LatLng(48.25, 17.25)
      );
      const pos = new window.google.maps.LatLng(position.lat(), position.lng());

      if (!bratislavaBounds.contains(pos)) {
        alert('Adresa musí byť v Bratislave. Prosím, vyberte adresu v Bratislave.');
        return;
      }

      geocoderRef.current.geocode(
        { 
          location: { lat: position.lat(), lng: position.lng() },
          bounds: bratislavaBounds,
        }, 
        (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            const addressComponents = results[0].address_components || [];
            let street = '';
            let city = '';
            let postalCode = '';
            let country = 'SK';

            addressComponents.forEach((component: any) => {
              const types = component.types;
              if (types.includes('street_number') || types.includes('route')) {
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

            // Final validation
            const isBratislava = city.toLowerCase().includes('bratislava') || 
                                addressComponents.some((c: any) => 
                                  (c.types.includes('administrative_area_level_2') || 
                                   c.types.includes('locality')) && 
                                  c.long_name.toLowerCase().includes('bratislava')
                                );

            if (!isBratislava) {
              alert('Adresa musí byť v Bratislave. Prosím, vyberte adresu v Bratislave.');
              return;
            }

            onSelect(selectedAddress, {
              street: street || selectedAddress,
              city,
              postalCode,
              country,
              formattedAddress: selectedAddress,
              geometry: {
                location: {
                  lat: position.lat(),
                  lng: position.lng(),
                },
              },
            });
            onClose();
          } else {
            alert('Nepodarilo sa nájsť adresu v Bratislave.');
          }
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold">Vyberte miesto</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full min-h-[400px]" />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
                <p className="mt-4 text-gray-600">Načítavam mapu...</p>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <p className="mt-2 text-sm text-red-600">Chýba Google Maps API key v .env.local</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with address and confirm button */}
        <div className="p-4 border-t bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">{selectedAddress || 'Vyberte miesto na mape'}</p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedAddress}
            className="px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Potvrdiť
          </button>
        </div>
      </div>
    </div>
  );
}

