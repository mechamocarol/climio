import { httpRequest } from '@/infrastructure/api/http-client';

const OPEN_METEO_GEOCODING_ENDPOINT =
  'https://geocoding-api.open-meteo.com/v1/search';

/** Maximum number of geocoding matches requested for the MVP search UI. */
export const OPEN_METEO_GEOCODING_RESULT_COUNT = 5;

export type OpenMeteoGeocodingApiInput = Readonly<{
  name: string;
}>;

/**
 * Builds the Open-Meteo Geocoding search URL for a non-empty place name.
 */
export function buildOpenMeteoGeocodingUrl(
  input: OpenMeteoGeocodingApiInput,
): string {
  const url = new URL(OPEN_METEO_GEOCODING_ENDPOINT);
  url.searchParams.set('name', input.name);
  url.searchParams.set('count', String(OPEN_METEO_GEOCODING_RESULT_COUNT));
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');
  return url.toString();
}

/**
 * Fetches the raw Open-Meteo Geocoding payload.
 * Validation and domain mapping happen outside this data source.
 */
export async function fetchOpenMeteoGeocoding(
  input: OpenMeteoGeocodingApiInput,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = buildOpenMeteoGeocodingUrl(input);
  return httpRequest<unknown>(url, { method: 'GET', signal });
}
