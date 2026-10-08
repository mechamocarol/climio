import type { OpenMeteoGeocodingResponse } from '@/features/location/data/open-meteo-geocoding.dto';
import type { Location } from '@/features/location/domain/location';

function readOptionalString(value: string | null | undefined): string | null {
  return value === undefined || value === null ? null : value;
}

/** Maps a validated geocoding DTO to domain `Location[]`. */
export function mapOpenMeteoGeocodingToLocations(
  response: OpenMeteoGeocodingResponse,
): Location[] {
  const results = response.results ?? [];

  return results.map((result) => ({
    id: String(result.id),
    name: result.name,
    region: readOptionalString(result.admin1),
    country: readOptionalString(result.country),
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: readOptionalString(result.timezone),
  }));
}
