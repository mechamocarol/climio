import { ZodError } from 'zod';

import { fetchOpenMeteoForecast } from '@/features/weather/data/open-meteo-forecast.api';
import { openMeteoWeatherRepository } from '@/features/weather/data/open-meteo-weather-repository';
import { HttpError } from '@/infrastructure/api/http-client';

import { openMeteoForecastHappyPathFixture } from './fixtures/open-meteo-forecast.fixture';

jest.mock('@/features/weather/data/open-meteo-forecast.api', () => ({
  fetchOpenMeteoForecast: jest.fn(),
}));

const mockedFetchOpenMeteoForecast = jest.mocked(fetchOpenMeteoForecast);

describe('openMeteoWeatherRepository', () => {
  const input = {
    latitude: -23.55,
    longitude: -46.63,
    date: '2026-10-08',
  };

  beforeEach(() => {
    mockedFetchOpenMeteoForecast.mockReset();
  });

  it('maps a valid Open-Meteo payload to HourlyWeather[]', async () => {
    mockedFetchOpenMeteoForecast.mockResolvedValueOnce(
      openMeteoForecastHappyPathFixture,
    );

    const result = await openMeteoWeatherRepository.getHourlyForecast(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      timestamp: '2026-10-08T00:00',
      temperature: 16.2,
      apparentTemperature: 17.3,
      precipitationProbability: 86,
      precipitation: 0.4,
      windSpeed: 8.1,
      windGust: 18.0,
      uvIndex: 0.0,
      weatherCode: 61,
      isDaylight: false,
    });
    expect(result[1]?.timestamp).toBe('2026-10-08T14:00');
    expect(result[1]?.isDaylight).toBe(true);
    expect(result[2]?.weatherCode).toBe(95);
  });

  it('preserves multiple hours in order', async () => {
    mockedFetchOpenMeteoForecast.mockResolvedValueOnce(
      openMeteoForecastHappyPathFixture,
    );

    const result = await openMeteoWeatherRepository.getHourlyForecast(input);

    expect(result.map((hour) => hour.timestamp)).toEqual([
      '2026-10-08T00:00',
      '2026-10-08T14:00',
      '2026-10-08T19:00',
    ]);
  });

  it('preserves null values from the API payload', async () => {
    mockedFetchOpenMeteoForecast.mockResolvedValueOnce({
      hourly: {
        time: ['2026-10-08T10:00', '2026-10-08T11:00'],
        temperature_2m: [null, 21],
        apparent_temperature: [20, null],
        precipitation_probability: [null, null],
        precipitation: [0, null],
        wind_speed_10m: [null, 12],
        wind_gusts_10m: [15, null],
        uv_index: [null, 4],
        weather_code: [null, 3],
        is_day: [null, 1],
      },
    });

    const result = await openMeteoWeatherRepository.getHourlyForecast(input);

    expect(result[0]).toMatchObject({
      temperature: null,
      apparentTemperature: 20,
      precipitationProbability: null,
      precipitation: 0,
      windSpeed: null,
      windGust: 15,
      uvIndex: null,
      weatherCode: null,
      isDaylight: null,
    });
    expect(result[1]).toMatchObject({
      temperature: 21,
      apparentTemperature: null,
      isDaylight: true,
    });
  });

  it('rejects invalid payloads via the Zod schema', async () => {
    mockedFetchOpenMeteoForecast.mockResolvedValueOnce({
      hourly: {
        time: ['2026-10-08T00:00', '2026-10-08T01:00'],
        temperature_2m: [16],
      },
    });

    await expect(
      openMeteoWeatherRepository.getHourlyForecast(input),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('propagates HttpError from the data source', async () => {
    const error = new HttpError('Request failed with status 500', 500, 'boom');
    mockedFetchOpenMeteoForecast.mockRejectedValueOnce(error);

    await expect(
      openMeteoWeatherRepository.getHourlyForecast(input),
    ).rejects.toBe(error);
  });

  it('forwards AbortSignal to the data source', async () => {
    mockedFetchOpenMeteoForecast.mockResolvedValueOnce(
      openMeteoForecastHappyPathFixture,
    );
    const controller = new AbortController();

    await openMeteoWeatherRepository.getHourlyForecast(input, controller.signal);

    expect(mockedFetchOpenMeteoForecast).toHaveBeenCalledWith(
      input,
      controller.signal,
    );
  });

  it('only collaborates with the forecast data source for a request', async () => {
    mockedFetchOpenMeteoForecast.mockResolvedValueOnce(
      openMeteoForecastHappyPathFixture,
    );

    await openMeteoWeatherRepository.getHourlyForecast(input);

    expect(mockedFetchOpenMeteoForecast).toHaveBeenCalledTimes(1);
    expect(mockedFetchOpenMeteoForecast).toHaveBeenCalledWith(input, undefined);
  });
});
