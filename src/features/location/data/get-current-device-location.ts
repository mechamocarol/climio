import * as ExpoLocation from 'expo-location';

/** Raw device coordinates before reverse geocode / timezone resolution. */
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

/** Requests foreground permission if needed and reads a single GPS fix. */
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
