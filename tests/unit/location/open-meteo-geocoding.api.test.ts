import {
  buildOpenMeteoGeocodingUrl,
  fetchOpenMeteoGeocoding,
  OPEN_METEO_GEOCODING_RESULT_COUNT,
} from '@/features/location/data/open-meteo-geocoding.api';
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

function parseGeocodingUrl(url: string): {
  hostname: string;
  pathname: string;
  params: URLSearchParams;
} {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    params: parsed.searchParams,
  };
}

describe('buildOpenMeteoGeocodingUrl', () => {
  it('targets the Open-Meteo geocoding /v1/search endpoint', () => {
    const { hostname, pathname } = parseGeocodingUrl(
      buildOpenMeteoGeocodingUrl({ name: 'São Paulo' }),
    );

    expect(hostname).toBe('geocoding-api.open-meteo.com');
    expect(pathname).toBe('/v1/search');
  });

  it('sets name, count, language, and format', () => {
    const { params } = parseGeocodingUrl(
      buildOpenMeteoGeocodingUrl({ name: 'Campinas' }),
    );

    expect(params.get('name')).toBe('Campinas');
    expect(params.get('count')).toBe(String(OPEN_METEO_GEOCODING_RESULT_COUNT));
    expect(params.get('language')).toBe('pt');
    expect(params.get('format')).toBe('json');
  });
});

describe('fetchOpenMeteoGeocoding', () => {
  beforeEach(() => {
    mockedHttpRequest.mockReset();
  });

  it('calls httpRequest with GET and the built geocoding URL', async () => {
    mockedHttpRequest.mockResolvedValueOnce({ results: [] });

    await fetchOpenMeteoGeocoding({ name: 'São Paulo' });

    expect(mockedHttpRequest).toHaveBeenCalledTimes(1);
    const [url, options] = mockedHttpRequest.mock.calls[0] ?? [];
    expect(typeof url).toBe('string');
    expect(options?.method).toBe('GET');

    const { pathname, params } = parseGeocodingUrl(url as string);
    expect(pathname).toBe('/v1/search');
    expect(params.get('name')).toBe('São Paulo');
    expect(params.get('count')).toBe('5');
    expect(params.get('language')).toBe('pt');
    expect(params.get('format')).toBe('json');
  });

  it('forwards AbortSignal to httpRequest', async () => {
    mockedHttpRequest.mockResolvedValueOnce({});
    const controller = new AbortController();

    await fetchOpenMeteoGeocoding({ name: 'Berlin' }, controller.signal);

    expect(mockedHttpRequest.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });

  it('propagates HttpError from httpRequest', async () => {
    const error = new HttpError('Request failed with status 500', 500, 'boom');
    mockedHttpRequest.mockRejectedValueOnce(error);

    await expect(fetchOpenMeteoGeocoding({ name: 'X' })).rejects.toBe(error);
  });
});
