import { ZodError } from 'zod';

import { fetchOpenMeteoGeocoding } from '@/features/location/data/open-meteo-geocoding.api';
import { openMeteoLocationRepository } from '@/features/location/data/open-meteo-location-repository';
import { HttpError } from '@/infrastructure/api/http-client';

import { openMeteoGeocodingHappyPathFixture } from './fixtures/open-meteo-geocoding.fixture';

jest.mock('@/features/location/data/open-meteo-geocoding.api', () => ({
  fetchOpenMeteoGeocoding: jest.fn(),
}));

const mockedFetchOpenMeteoGeocoding = jest.mocked(fetchOpenMeteoGeocoding);

describe('openMeteoLocationRepository', () => {
  beforeEach(() => {
    mockedFetchOpenMeteoGeocoding.mockReset();
  });

  it('maps a valid Open-Meteo payload to Location[]', async () => {
    mockedFetchOpenMeteoGeocoding.mockResolvedValueOnce(
      openMeteoGeocodingHappyPathFixture,
    );

    const result = await openMeteoLocationRepository.searchLocations({
      query: 'São Paulo',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '3448439',
      name: 'São Paulo',
      region: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5475,
      longitude: -46.63611,
      timezone: 'America/Sao_Paulo',
    });
    expect(mockedFetchOpenMeteoGeocoding).toHaveBeenCalledWith(
      { name: 'São Paulo' },
      undefined,
    );
  });

  it('returns an empty list when the API omits results', async () => {
    mockedFetchOpenMeteoGeocoding.mockResolvedValueOnce({});

    const result = await openMeteoLocationRepository.searchLocations({
      query: 'zzzz-unknown',
    });

    expect(result).toEqual([]);
  });

  it('rejects invalid payloads via the Zod schema', async () => {
    mockedFetchOpenMeteoGeocoding.mockResolvedValueOnce({
      results: [{ id: 1, name: 'Broken' }],
    });

    await expect(
      openMeteoLocationRepository.searchLocations({ query: 'Broken' }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('propagates HttpError from the data source', async () => {
    const error = new HttpError('Request failed with status 503', 503, null);
    mockedFetchOpenMeteoGeocoding.mockRejectedValueOnce(error);

    await expect(
      openMeteoLocationRepository.searchLocations({ query: 'São Paulo' }),
    ).rejects.toBe(error);
  });

  it('forwards AbortSignal to the data source', async () => {
    mockedFetchOpenMeteoGeocoding.mockResolvedValueOnce(
      openMeteoGeocodingHappyPathFixture,
    );
    const controller = new AbortController();

    await openMeteoLocationRepository.searchLocations(
      { query: 'Campinas' },
      controller.signal,
    );

    expect(mockedFetchOpenMeteoGeocoding).toHaveBeenCalledWith(
      { name: 'Campinas' },
      controller.signal,
    );
  });

  it('returns [] for blank queries without calling the data source', async () => {
    await expect(
      openMeteoLocationRepository.searchLocations({ query: '   ' }),
    ).resolves.toEqual([]);

    expect(mockedFetchOpenMeteoGeocoding).not.toHaveBeenCalled();
  });

  it('trims the query before calling the data source', async () => {
    mockedFetchOpenMeteoGeocoding.mockResolvedValueOnce({ results: [] });

    await openMeteoLocationRepository.searchLocations({
      query: '  São Paulo  ',
    });

    expect(mockedFetchOpenMeteoGeocoding).toHaveBeenCalledWith(
      { name: 'São Paulo' },
      undefined,
    );
  });

  it('only collaborates with the geocoding data source for a request', async () => {
    mockedFetchOpenMeteoGeocoding.mockResolvedValueOnce(
      openMeteoGeocodingHappyPathFixture,
    );

    await openMeteoLocationRepository.searchLocations({ query: 'São Paulo' });

    expect(mockedFetchOpenMeteoGeocoding).toHaveBeenCalledTimes(1);
  });
});
