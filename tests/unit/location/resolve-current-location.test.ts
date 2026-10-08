import { waitFor } from '@testing-library/react-native';
import { PermissionStatus } from 'expo-location';

import { resolveCurrentLocation } from '@/features/location/data/resolve-current-location';
import { resolveOpenMeteoTimezone } from '@/features/location/data/resolve-open-meteo-timezone';

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
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock('@/features/location/data/resolve-open-meteo-timezone', () => ({
  resolveOpenMeteoTimezone: jest.fn(),
}));

const ExpoLocation = jest.requireMock('expo-location') as {
  requestForegroundPermissionsAsync: jest.Mock;
  getCurrentPositionAsync: jest.Mock;
  reverseGeocodeAsync: jest.Mock;
};

const mockedResolveTimezone = jest.mocked(resolveOpenMeteoTimezone);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockGrantedGps() {
  ExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
    status: PermissionStatus.GRANTED,
  });
  ExpoLocation.getCurrentPositionAsync.mockResolvedValue({
    coords: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
  });
}

describe('resolveCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds a domain Location from GPS, reverse geocode, and timezone', async () => {
    mockGrantedGps();
    ExpoLocation.reverseGeocodeAsync.mockResolvedValue([
      {
        city: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
      },
    ]);
    mockedResolveTimezone.mockResolvedValue('America/Sao_Paulo');

    const result = await resolveCurrentLocation();

    expect(result).toEqual({
      ok: true,
      location: {
        id: 'gps:-23.5505,-46.6333',
        name: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5505,
        longitude: -46.6333,
        timezone: 'America/Sao_Paulo',
      },
    });
  });

  it('starts reverse geocoding and timezone resolution in parallel after GPS', async () => {
    mockGrantedGps();

    const reverseDeferred = createDeferred<
      Array<{
        city: string;
        region: string;
        country: string;
      }>
    >();
    const timezoneDeferred = createDeferred<string>();

    ExpoLocation.reverseGeocodeAsync.mockReturnValue(reverseDeferred.promise);
    mockedResolveTimezone.mockReturnValue(timezoneDeferred.promise);

    const pending = resolveCurrentLocation();

    await waitFor(() => {
      expect(ExpoLocation.reverseGeocodeAsync).toHaveBeenCalledTimes(1);
      expect(mockedResolveTimezone).toHaveBeenCalledTimes(1);
    });

    // Both still pending — they were started together, not sequenced.
    expect(reverseDeferred.promise).toEqual(expect.any(Promise));
    expect(timezoneDeferred.promise).toEqual(expect.any(Promise));

    reverseDeferred.resolve([
      {
        city: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
      },
    ]);
    timezoneDeferred.resolve('America/Sao_Paulo');

    await expect(pending).resolves.toMatchObject({
      ok: true,
      location: {
        name: 'São Paulo',
        timezone: 'America/Sao_Paulo',
      },
    });
  });

  it('returns permission_denied without reverse geocoding', async () => {
    ExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: PermissionStatus.DENIED,
    });

    const result = await resolveCurrentLocation();

    expect(result).toEqual({
      ok: false,
      reason: 'permission_denied',
    });
    expect(ExpoLocation.reverseGeocodeAsync).not.toHaveBeenCalled();
    expect(mockedResolveTimezone).not.toHaveBeenCalled();
  });

  it('returns reverse_geocode_failed when reverse geocoding throws', async () => {
    mockGrantedGps();
    ExpoLocation.reverseGeocodeAsync.mockRejectedValue(
      new Error('geocoder unavailable'),
    );
    mockedResolveTimezone.mockResolvedValue('America/Sao_Paulo');

    const result = await resolveCurrentLocation();

    expect(result).toEqual({
      ok: false,
      reason: 'reverse_geocode_failed',
      message: 'geocoder unavailable',
    });
    expect(mockedResolveTimezone).toHaveBeenCalledTimes(1);
  });

  it('prefers reverse_geocode_failed when both parallel steps fail', async () => {
    mockGrantedGps();
    ExpoLocation.reverseGeocodeAsync.mockRejectedValue(
      new Error('geocoder unavailable'),
    );
    mockedResolveTimezone.mockRejectedValue(new Error('timezone request failed'));

    const result = await resolveCurrentLocation();

    expect(result).toEqual({
      ok: false,
      reason: 'reverse_geocode_failed',
      message: 'geocoder unavailable',
    });
  });

  it('returns timezone_unavailable when Open-Meteo timezone resolution fails', async () => {
    mockGrantedGps();
    ExpoLocation.reverseGeocodeAsync.mockResolvedValue([
      {
        city: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
      },
    ]);
    mockedResolveTimezone.mockRejectedValue(new Error('timezone request failed'));

    const result = await resolveCurrentLocation();

    expect(result).toEqual({
      ok: false,
      reason: 'timezone_unavailable',
      message: 'timezone request failed',
    });
  });

  it('uses name fallback when reverse geocode returns no placemarks', async () => {
    mockGrantedGps();
    ExpoLocation.reverseGeocodeAsync.mockResolvedValue([]);
    mockedResolveTimezone.mockResolvedValue('America/Sao_Paulo');

    const result = await resolveCurrentLocation();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.location.name).toBe('Minha localização');
      expect(result.location.timezone).toBe('America/Sao_Paulo');
    }
  });
});
