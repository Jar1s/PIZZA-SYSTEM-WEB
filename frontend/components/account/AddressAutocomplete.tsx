'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BRATISLAVA_BBOX,
  BRATISLAVA_CENTER,
  PHOTON_ENDPOINT,
  toAddressDetails,
  toSuggestions,
  type AddressDetails,
  type AddressSuggestion,
  type PhotonFeature,
} from '@/lib/address-suggestions';

export type { AddressDetails } from '@/lib/address-suggestions';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, details?: AddressDetails) => void;
  onSelectFromMap?: () => void;
}

export default function AddressAutocomplete({ value, onChange, onSelectFromMap }: AddressAutocompleteProps) {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchFailed, setSearchFailed] = useState(false);
  const skipNextSearch = useRef(false);

  const normalizedQuery = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (skipNextSearch.current) {
      // Value was just set from a picked suggestion – don't re-open the list.
      skipNextSearch.current = false;
      return;
    }
    if (normalizedQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      setSearchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchFailed(false);
        const params = new URLSearchParams({
          q: normalizedQuery,
          limit: '10',
          lat: String(BRATISLAVA_CENTER.lat),
          lon: String(BRATISLAVA_CENTER.lon),
          bbox: BRATISLAVA_BBOX,
        });
        const response = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          setSuggestions([]);
          setSearchFailed(true);
          return;
        }
        const data = (await response.json()) as { features?: PhotonFeature[] };
        setSuggestions(toSuggestions(data.features || []).slice(0, 7));
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        setSuggestions([]);
        setSearchFailed(true);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  const handleInputChange = (nextValue: string) => {
    skipNextSearch.current = false;
    onChange(nextValue);
    setShowSuggestions(true);
  };

  const pick = (suggestion: AddressSuggestion) => {
    skipNextSearch.current = true;
    onChange(suggestion.primary, toAddressDetails(suggestion));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const listOpen = showSuggestions && normalizedQuery.length >= 3;
  const listId = useId();

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
          onKeyDown={handleKeyDown}
          placeholder={t.enterAddress}
          autoComplete="off"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          // Neutral border also when filled – a permanent brand-coloured (red/pink)
          // outline reads as a validation error. The brand colour only marks focus.
          className="w-full px-4 py-3 pr-24 border-2 border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[var(--color-primary)]"

        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
              }}
              // Plain white ×: the old red badge suggested the address was invalid.
              className="w-5 h-5 flex items-center justify-center text-white hover:text-gray-300"
              aria-label="Vymazať adresu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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

      {listOpen && (
        <div id={listId} className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto" role="listbox">
          {isSearching && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">Hľadám adresu…</div>
          )}

          {!isSearching && suggestions.length === 0 && searchFailed && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Vyhľadávanie adries je dočasne nedostupné – zadaj ulicu a číslo ručne.
            </div>
          )}

          {!isSearching && suggestions.length === 0 && !searchFailed && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Nenašla sa adresa v Bratislave. Skús názov ulice, prípadne s číslom domu.
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.key}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => pick(suggestion)}
              className={`w-full px-4 py-2.5 text-left border-b border-gray-100 last:border-b-0 ${
                index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{suggestion.primary}</div>
              {suggestion.secondary && <div className="text-xs text-gray-500">{suggestion.secondary}</div>}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-1">Vyhľadávanie adries: OpenStreetMap</div>
    </div>
  );
}
