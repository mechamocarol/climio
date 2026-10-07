import { mapOpenMeteoGeocodingToLocations } from '@/features/location/data/open-meteo-geocoding.mapper';

import { openMeteoGeocodingHappyPathFixture } from './fixtures/open-meteo-geocoding.fixture';

describe('mapOpenMeteoGeocodingToLocations', () => {
  it('maps API fields to domain Location rows', () => {
    const locations = mapOpenMeteoGeocodingToLocations(
      openMeteoGeocodingHappyPathFixture,
    );

    expect(locations).toEqual([
      {
        id: '3448439',
        name: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5475,
        longitude: -46.63611,
        timezone: 'America/Sao_Paulo',
      },
      {
        id: '3462944',
        name: 'Frei Paulo',
        region: 'Sergipe',
        country: 'Brasil',
        latitude: -10.54944,
        longitude: -37.53444,
        timezone: 'America/Maceio',
      },
    ]);
  });

  it('maps admin1 to region and preserves coordinates', () => {
    const [location] = mapOpenMeteoGeocodingToLocations({
      results: [
        {
          id: 99,
          name: 'Campinas',
          latitude: -22.9,
          longitude: -47.06,
          admin1: 'São Paulo',
          country: 'Brasil',
          timezone: 'America/Sao_Paulo',
        },
      ],
    });

    expect(location?.region).toBe('São Paulo');
    expect(location?.latitude).toBe(-22.9);
    expect(location?.longitude).toBe(-47.06);
  });

  it('maps missing or null admin1 and country to null', () => {
    const locations = mapOpenMeteoGeocodingToLocations({
      results: [
        {
          id: 1,
          name: 'Unknown Place',
          latitude: 0,
          longitude: 0,
        },
        {
          id: 2,
          name: 'Null Fields',
          latitude: 1,
          longitude: 2,
          admin1: null,
          country: null,
          timezone: null,
        },
      ],
    });

    expect(locations[0]).toMatchObject({
      region: null,
      country: null,
      timezone: null,
    });
    expect(locations[1]).toMatchObject({
      region: null,
      country: null,
      timezone: null,
    });
  });

  it('maps timezone when present', () => {
    const [location] = mapOpenMeteoGeocodingToLocations({
      results: [
        {
          id: 3,
          name: 'Berlin',
          latitude: 52.52,
          longitude: 13.41,
          timezone: 'Europe/Berlin',
        },
      ],
    });

    expect(location?.timezone).toBe('Europe/Berlin');
  });

  it('returns an empty list when results is missing', () => {
    expect(mapOpenMeteoGeocodingToLocations({})).toEqual([]);
  });

  it('returns an empty list when results is empty', () => {
    expect(mapOpenMeteoGeocodingToLocations({ results: [] })).toEqual([]);
  });
});
