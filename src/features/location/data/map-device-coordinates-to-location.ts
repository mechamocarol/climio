import type { DeviceCoordinates } from '@/features/location/data/get-current-device-location';
import type { Location } from '@/features/location/domain/location';

/** Subset of expo-location reverse-geocode fields used by Climio. */
export type DevicePlaceLabels = Readonly<{
  city?: string | null;
  name?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  country?: string | null;
}>;

const FALLBACK_LOCATION_NAME = 'Minha localização';

function readLabel(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Deterministic synthetic id for GPS-derived locations.
 * Not an Open-Meteo geocoding place id.
 */
export function buildGpsLocationId(coordinates: DeviceCoordinates): string {
  return `gps:${coordinates.latitude},${coordinates.longitude}`;
}

/**
 * Maps GPS coordinates + reverse-geocode labels + IANA timezone into domain `Location`.
 */
export function mapDeviceCoordinatesToLocation(input: {
  coordinates: DeviceCoordinates;
  place: DevicePlaceLabels | null;
  timezone: string;
}): Location {
  const { coordinates, place, timezone } = input;

  const city = readLabel(place?.city);
  const placeName = readLabel(place?.name);
  const district = readLabel(place?.district);
  const subregion = readLabel(place?.subregion);
  const region = readLabel(place?.region);
  const country = readLabel(place?.country);

  const name =
    city ?? placeName ?? district ?? subregion ?? FALLBACK_LOCATION_NAME;

  return {
    id: buildGpsLocationId(coordinates),
    name,
    region: region ?? subregion,
    country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    timezone,
  };
}
