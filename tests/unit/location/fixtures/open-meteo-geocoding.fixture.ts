import type { OpenMeteoGeocodingResponse } from '@/features/location/data/open-meteo-geocoding.dto';

/**
 * Compact fixture shaped like a real Open-Meteo Geocoding search payload.
 */
export const openMeteoGeocodingHappyPathFixture: OpenMeteoGeocodingResponse = {
  results: [
    {
      id: 3448439,
      name: 'São Paulo',
      latitude: -23.5475,
      longitude: -46.63611,
      admin1: 'São Paulo',
      country: 'Brasil',
      timezone: 'America/Sao_Paulo',
    },
    {
      id: 3462944,
      name: 'Frei Paulo',
      latitude: -10.54944,
      longitude: -37.53444,
      admin1: 'Sergipe',
      country: 'Brasil',
      timezone: 'America/Maceio',
    },
  ],
};
