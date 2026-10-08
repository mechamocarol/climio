import {
  buildOpenMeteoTimezoneUrl,
  resolveOpenMeteoTimezone,
} from '@/features/location/data/resolve-open-meteo-timezone';
import { httpRequest } from '@/infrastructure/api/http-client';

jest.mock('@/infrastructure/api/http-client', () => {
  const actual = jest.requireActual<
    typeof import('@/infrastructure/api/http-client')
  >('@/infrastructure/api/http-client');

  return {
    ...actual,
    httpRequest: jest.fn(),
  };
});

const mockedHttpRequest = jest.mocked(httpRequest);

const coordinates = {
  latitude: -23.5505,
  longitude: -46.6333,
} as const;

describe('buildOpenMeteoTimezoneUrl', () => {
  it('requests forecast with timezone=auto for the given coordinates', () => {
    const url = new URL(buildOpenMeteoTimezoneUrl(coordinates));

    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.pathname).toBe('/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('-23.5505');
    expect(url.searchParams.get('longitude')).toBe('-46.6333');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('1');
    expect(url.searchParams.get('hourly')).toBe('temperature_2m');
  });
});

describe('resolveOpenMeteoTimezone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the IANA timezone from the Open-Meteo payload', async () => {
    mockedHttpRequest.mockResolvedValue({
      timezone: 'America/Sao_Paulo',
      hourly: { time: [], temperature_2m: [] },
    });

    await expect(resolveOpenMeteoTimezone(coordinates)).resolves.toBe(
      'America/Sao_Paulo',
    );
  });

  it('rejects when the timezone field is missing or empty', async () => {
    mockedHttpRequest.mockResolvedValue({
      hourly: { time: [], temperature_2m: [] },
    });

    await expect(resolveOpenMeteoTimezone(coordinates)).rejects.toThrow();
  });

  it('propagates HTTP failures', async () => {
    mockedHttpRequest.mockRejectedValue(new Error('network down'));

    await expect(resolveOpenMeteoTimezone(coordinates)).rejects.toThrow(
      'network down',
    );
  });
});
