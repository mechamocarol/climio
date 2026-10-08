import * as ExpoLocation from 'expo-location';

/**
 * Device GPS coordinates only.
 * Not a domain `Location` — reverse geocoding / timezone come in a later step.
 */
export type DeviceCoordinates = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type CurrentDeviceLocationFailureReason =
  | 'permission_denied'
  | 'position_unavailable';

export type CurrentDeviceLocationResult =
  | Readonly<{ ok: true; coordinates: DeviceCoordinates }>
  | Readonly<{
      ok: false;
      reason: CurrentDeviceLocationFailureReason;
      message?: string;
    }>;

/**
 * Requests foreground location permission when needed and reads one GPS fix.
 * Does not reverse-geocode, touch Plan state, or build a domain `Location`.
 */
export async function getCurrentDeviceLocation(): Promise<CurrentDeviceLocationResult> {
  const permission = await ExpoLocation.requestForegroundPermissionsAsync();

  if (permission.status !== ExpoLocation.PermissionStatus.GRANTED) {
    return { ok: false, reason: 'permission_denied' };
  }

  try {
    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    return {
      ok: true,
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'position_unavailable',
      message: error instanceof Error ? error.message : undefined,
    };
  }
}
