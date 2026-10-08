import * as ExpoLocation from 'expo-location';

import {
  getCurrentDeviceLocation,
  type CurrentDeviceLocationFailureReason,
} from '@/features/location/data/get-current-device-location';
import {
  mapDeviceCoordinatesToLocation,
  type DevicePlaceLabels,
} from '@/features/location/data/map-device-coordinates-to-location';
import { resolveOpenMeteoTimezone } from '@/features/location/data/resolve-open-meteo-timezone';
import type { Location } from '@/features/location/domain/location';

export type ResolveCurrentLocationFailureReason =
  | CurrentDeviceLocationFailureReason
  | 'reverse_geocode_failed'
  | 'timezone_unavailable';

export type ResolveCurrentLocationResult =
  | Readonly<{ ok: true; location: Location }>
  | Readonly<{
      ok: false;
      reason: ResolveCurrentLocationFailureReason;
      message?: string;
    }>;

function toDevicePlaceLabels(
  placemark: ExpoLocation.LocationGeocodedAddress,
): DevicePlaceLabels {
  return {
    city: placemark.city,
    name: placemark.name,
    district: placemark.district,
    subregion: placemark.subregion,
    region: placemark.region,
    country: placemark.country,
  };
}

async function reverseGeocodePlace(
  coordinates: Readonly<{ latitude: number; longitude: number }>,
): Promise<DevicePlaceLabels | null> {
  const placemarks = await ExpoLocation.reverseGeocodeAsync({
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  });
  const first = placemarks[0];
  return first === undefined ? null : toDevicePlaceLabels(first);
}

/**
 * Resolves the device GPS fix into a domain `Location` for Plan selection.
 * After GPS, reverse geocode and Open-Meteo timezone run in parallel.
 */
export async function resolveCurrentLocation(
  signal?: AbortSignal,
): Promise<ResolveCurrentLocationResult> {
  const deviceResult = await getCurrentDeviceLocation();

  if (!deviceResult.ok) {
    return deviceResult;
  }

  const { coordinates } = deviceResult;

  const [placeResult, timezoneResult] = await Promise.allSettled([
    reverseGeocodePlace(coordinates),
    resolveOpenMeteoTimezone(coordinates, signal),
  ]);

  // Preserve sequential error priority: reverse geocode before timezone.
  if (placeResult.status === 'rejected') {
    const error = placeResult.reason;
    return {
      ok: false,
      reason: 'reverse_geocode_failed',
      message: error instanceof Error ? error.message : undefined,
    };
  }

  if (timezoneResult.status === 'rejected') {
    const error = timezoneResult.reason;
    return {
      ok: false,
      reason: 'timezone_unavailable',
      message: error instanceof Error ? error.message : undefined,
    };
  }

  return {
    ok: true,
    location: mapDeviceCoordinatesToLocation({
      coordinates,
      place: placeResult.value,
      timezone: timezoneResult.value,
    }),
  };
}
