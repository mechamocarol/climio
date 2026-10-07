/**
 * Open-Meteo Geocoding API response subset used by Climio.
 * Field names match the API contract (snake_case), not the domain model.
 */

export type OpenMeteoGeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string | null;
  country?: string | null;
  timezone?: string | null;
};

/**
 * Minimal Geocoding search response required to produce `Location[]`.
 * `results` may be omitted when the API finds no matches.
 */
export type OpenMeteoGeocodingResponse = {
  results?: OpenMeteoGeocodingResult[];
};
