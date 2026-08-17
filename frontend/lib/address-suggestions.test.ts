import { describe, expect, it } from 'vitest';
import { toAddressDetails, toSuggestions, type PhotonFeature } from './address-suggestions';

// Trimmed real responses from photon.komoot.io (2026-08-17)
// Every SK feature in the region carries state="Bratislavský kraj" – including
// Zohor, Slovenský Grob, Rovinka … which must NOT pass the filter.
const feature = (props: Record<string, unknown>, lon = 17.1, lat = 48.15): PhotonFeature =>
  ({ geometry: { coordinates: [lon, lat] }, properties: { state: 'Bratislavský kraj', ...props } }) as PhotonFeature;

const NABREZIE = [
  feature({ name: 'Nábrežie arm. gen. Ludvíka Svobodu', postcode: '811 02', district: 'Staré Mesto', county: 'okres Bratislava I', osm_key: 'highway', osm_value: 'secondary', countrycode: 'SK' }),
  feature({ name: 'Nábrežie Milana Rastislava Štefánika', postcode: '811 02', district: 'Staré Mesto', county: 'okres Bratislava I', osm_key: 'highway', osm_value: 'pedestrian', countrycode: 'SK' }),
  feature({ name: 'Nábrežie Milana Rastislava Štefánika', postcode: '811 09', district: 'Bratislava', county: 'okres Bratislava II', osm_key: 'highway', osm_value: 'pedestrian', countrycode: 'SK' }),
  feature({ name: 'Nábrežie arm. gen. Ludvíka Svobodu', postcode: '811 02', district: 'Staré Mesto', county: 'okres Bratislava I', osm_key: 'highway', osm_value: 'unclassified', countrycode: 'SK' }),
  feature({ name: 'Nábrežie', city: 'Námestovo', county: 'okres Námestovo', osm_key: 'highway', osm_value: 'residential', countrycode: 'SK' }),
];

const OBCHODNA_5 = [
  feature({ street: 'Obchodná', housenumber: '5', postcode: '811 06', city: 'Bratislava', district: 'Staré Mesto', county: 'okres Bratislava I', osm_key: 'landuse', osm_value: 'brownfield', countrycode: 'SK' }, 17.108, 48.147),
  feature({ name: 'Galéria Luxor', street: 'Grösslingová', housenumber: '7152/5', postcode: '811 09', city: 'Bratislava', district: 'Staré Mesto', county: 'okres Bratislava I', osm_key: 'shop', osm_value: 'mall', countrycode: 'SK' }),
  feature({ street: 'Obchodná', housenumber: '425/5', postcode: '900 51', city: 'Zohor', county: 'okres Malacky', osm_key: 'building', osm_value: 'yes', countrycode: 'SK' }),
  feature({ street: 'Obchodná', housenumber: '786/5', postcode: '900 26', city: 'Slovenský Grob', district: 'Šúr', county: 'okres Pezinok', osm_key: 'building', osm_value: 'yes', countrycode: 'SK' }),
  feature({ name: 'Obchodná', postcode: '900 51', city: 'Zohor', county: 'okres Malacky', osm_key: 'highway', osm_value: 'pedestrian', countrycode: 'SK' }),
  feature({ street: 'Obchodní', housenumber: '5', postcode: '110 00', city: 'Praha', countrycode: 'CZ' }),
];

describe('toSuggestions', () => {
  it('keeps only Bratislava-area results, dedupes street segments and fills the city', () => {
    const out = toSuggestions(NABREZIE);
    expect(out.map((s) => s.primary)).toEqual([
      'Nábrežie arm. gen. Ludvíka Svobodu',
      'Nábrežie Milana Rastislava Štefánika',
    ]);
    expect(out[0].city).toBe('Bratislava');
    expect(out[0].secondary).toBe('811 02 Bratislava · Staré Mesto');
    expect(out[0].houseNumber).toBe('');
  });

  it('returns concrete addresses with house number, drops other towns and countries', () => {
    const out = toSuggestions(OBCHODNA_5);
    expect(out.map((s) => s.primary)).toEqual(['Obchodná 5', 'Grösslingová 7152/5']);
    expect(out[0]).toMatchObject({ road: 'Obchodná', houseNumber: '5', postalCode: '811 06', city: 'Bratislava', lat: 48.147, lng: 17.108 });
    expect(out[1].secondary).toBe('811 09 Bratislava · Staré Mesto · Galéria Luxor');
  });

  it('formats postcodes without a space and accepts 8xx xx even without a Bratislava label', () => {
    const out = toSuggestions([feature({ street: 'Testovacia', housenumber: '1', postcode: '82101', city: 'Ružinov', countrycode: 'SK' })]);
    expect(out[0].postalCode).toBe('821 01');
    expect(out[0].city).toBe('Ružinov');
  });
});

describe('toAddressDetails', () => {
  it('produces the shape the checkout expects', () => {
    const [s] = toSuggestions(OBCHODNA_5);
    expect(toAddressDetails(s)).toEqual({
      street: 'Obchodná 5',
      road: 'Obchodná',
      houseNumber: '5',
      city: 'Bratislava',
      postalCode: '811 06',
      country: 'SK',
      formattedAddress: 'Obchodná 5, 811 06 Bratislava',
      geometry: { location: { lat: 48.147, lng: 17.108 } },
    });
  });
});
