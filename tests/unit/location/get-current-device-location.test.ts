import { PermissionStatus } from 'expo-location';

import { getCurrentDeviceLocation } from '@/features/location/data/get-current-device-location';

jest.mock('expo-location', () => ({
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
  Accuracy: {
    Balanced: 3,
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const ExpoLocation = jest.requireMock('expo-location') as {
  requestForegroundPermissionsAsync: jest.Mock;
  getCurrentPositionAsync: jest.Mock;
};

describe('getCurrentDeviceLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns coordinates when permission is granted and position is available', async () => {
    ExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: PermissionStatus.GRANTED,
    });
    ExpoLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
    });

    const result = await getCurrentDeviceLocation();

    expect(result).toEqual({
      ok: true,
      coordinates: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
    });
    expect(ExpoLocation.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
  });

  it('returns permission_denied without requesting a position when permission is denied', async () => {
    ExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: PermissionStatus.DENIED,
    });

    const result = await getCurrentDeviceLocation();

    expect(result).toEqual({
      ok: false,
      reason: 'permission_denied',
    });
    expect(ExpoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns position_unavailable when reading the GPS fix fails', async () => {
    ExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: PermissionStatus.GRANTED,
    });
    ExpoLocation.getCurrentPositionAsync.mockRejectedValue(
      new Error('Location services disabled'),
    );

    const result = await getCurrentDeviceLocation();

    expect(result).toEqual({
      ok: false,
      reason: 'position_unavailable',
      message: 'Location services disabled',
    });
  });
});
