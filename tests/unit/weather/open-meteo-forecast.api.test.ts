import {
  buildOpenMeteoForecastUrl,
  fetchOpenMeteoForecast,
  OPEN_METEO_FORECAST_HOURLY_VARIABLES,
} from '@/features/weather/data/open-meteo-forecast.api';
import { HttpError, httpRequest } from '@/infrastructure/api/http-client';

jest.mock('@/infrastructure/api/http-client', () => {
  const actual = jest.requireActual<typeof import('@/infrastructure/api/http-client')>(
    '@/infrastructure/api/http-client',
  );

  return {
    ...actual,
    httpRequest: jest.fn(),
  };
});

const mockedHttpRequest = jest.mocked(httpRequest);

function parseForecastUrl(url: string): { pathname: string; params: URLSearchParams } {
  const parsed = new URL(url);
  return {
    pathname: parsed.pathname,
    params: parsed.searchParams,
  };
}

describe('buildOpenMeteoForecastUrl', () => {
  const input = {
    latitude: -23.55,
    longitude: -46.63,
    date: '2026-10-08',
  };

  it('targets the Open-Meteo /v1/forecast endpoint', () => {
    const { pathname } = parseForecastUrl(buildOpenMeteoForecastUrl(input));

    expect(pathname).toBe('/v1/forecast');
  });

  it('sets latitude and longitude', () => {
    const { params } = parseForecastUrl(buildOpenMeteoForecastUrl(input));

    expect(params.get('latitude')).toBe('-23.55');
    expect(params.get('longitude')).toBe('-46.63');
  });

  it('requests the fixed MVP hourly variables', () => {
    const { params } = parseForecastUrl(buildOpenMeteoForecastUrl(input));
    const hourly = params.get('hourly')?.split(',') ?? [];

    expect(hourly).toEqual([...OPEN_METEO_FORECAST_HOURLY_VARIABLES]);
  });

  it('sets timezone=auto', () => {
    const { params } = parseForecastUrl(buildOpenMeteoForecastUrl(input));

    expect(params.get('timezone')).toBe('auto');
  });

  it('uses the same calendar date for start_date and end_date', () => {
    const { params } = parseForecastUrl(buildOpenMeteoForecastUrl(input));

    expect(params.get('start_date')).toBe('2026-10-08');
    expect(params.get('end_date')).toBe('2026-10-08');
  });

  it('rejects dates that are not YYYY-MM-DD', () => {
    expect(() =>
      buildOpenMeteoForecastUrl({
        ...input,
        date: '08/10/2026',
      }),
    ).toThrow(/YYYY-MM-DD/);
  });
});

describe('fetchOpenMeteoForecast', () => {
  beforeEach(() => {
    mockedHttpRequest.mockReset();
  });

  it('calls httpRequest with GET and the built forecast URL', async () => {
    mockedHttpRequest.mockResolvedValueOnce({ hourly: { time: [] } });

    await fetchOpenMeteoForecast({
      latitude: -23.55,
      longitude: -46.63,
      date: '2026-10-08',
    });

    expect(mockedHttpRequest).toHaveBeenCalledTimes(1);
    const [url, options] = mockedHttpRequest.mock.calls[0] ?? [];
    expect(typeof url).toBe('string');
    expect(options?.method).toBe('GET');

    const { pathname, params } = parseForecastUrl(url as string);
    expect(pathname).toBe('/v1/forecast');
    expect(params.get('latitude')).toBe('-23.55');
    expect(params.get('longitude')).toBe('-46.63');
    expect(params.get('timezone')).toBe('auto');
    expect(params.get('start_date')).toBe('2026-10-08');
    expect(params.get('end_date')).toBe('2026-10-08');
    expect(params.get('hourly')?.split(',')).toEqual([
      ...OPEN_METEO_FORECAST_HOURLY_VARIABLES,
    ]);
  });

  it('forwards AbortSignal to httpRequest', async () => {
    mockedHttpRequest.mockResolvedValueOnce({});
    const controller = new AbortController();

    await fetchOpenMeteoForecast(
      {
        latitude: 52.52,
        longitude: 13.41,
        date: '2026-10-09',
      },
      controller.signal,
    );

    expect(mockedHttpRequest.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });

  it('propagates HttpError from httpRequest', async () => {
    const error = new HttpError('Request failed with status 400', 400, {
      error: true,
      reason: 'out of range',
    });
    mockedHttpRequest.mockRejectedValueOnce(error);

    await expect(
      fetchOpenMeteoForecast({
        latitude: -23.55,
        longitude: -46.63,
        date: '2026-10-08',
      }),
    ).rejects.toBe(error);
  });
});
