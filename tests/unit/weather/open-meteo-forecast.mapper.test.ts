import type { OpenMeteoForecastResponse } from '@/features/weather/data/open-meteo-forecast.dto';
import { mapOpenMeteoForecastToHourlyWeather } from '@/features/weather/data/open-meteo-forecast.mapper';
import { parseOpenMeteoForecastResponse } from '@/features/weather/data/open-meteo-forecast.schema';

import {
  cloneOpenMeteoForecastResponse,
  openMeteoForecastHappyPathFixture,
} from './fixtures/open-meteo-forecast.fixture';

describe('mapOpenMeteoForecastToHourlyWeather', () => {
  it('maps all HourlyWeather fields on the happy path', () => {
    const [first, second, third] = mapOpenMeteoForecastToHourlyWeather(
      openMeteoForecastHappyPathFixture,
    );

    expect(first).toEqual({
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

    expect(second).toEqual({
      timestamp: '2026-10-08T14:00',
      temperature: 23.6,
      apparentTemperature: 25.9,
      precipitationProbability: 88,
      precipitation: 1.2,
      windSpeed: 12.4,
      windGust: 30.2,
      uvIndex: 8.8,
      weatherCode: 3,
      isDaylight: true,
    });

    expect(third).toEqual({
      timestamp: '2026-10-08T19:00',
      temperature: 19.5,
      apparentTemperature: 22.4,
      precipitationProbability: 99,
      precipitation: 0.0,
      windSpeed: 10.9,
      windGust: 24.5,
      uvIndex: 0.0,
      weatherCode: 95,
      isDaylight: false,
    });
  });

  it('preserves hour index across multiple rows', () => {
    const mapped = mapOpenMeteoForecastToHourlyWeather(
      openMeteoForecastHappyPathFixture,
    );

    expect(mapped).toHaveLength(3);
    expect(mapped.map((hour) => hour.timestamp)).toEqual([
      '2026-10-08T00:00',
      '2026-10-08T14:00',
      '2026-10-08T19:00',
    ]);
    expect(mapped.map((hour) => hour.temperature)).toEqual([16.2, 23.6, 19.5]);
    expect(mapped.map((hour) => hour.weatherCode)).toEqual([61, 3, 95]);
  });

  it('preserves null API values as null in the domain', () => {
    const response: OpenMeteoForecastResponse = {
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
    };

    const mapped = mapOpenMeteoForecastToHourlyWeather(response);

    expect(mapped[0]).toMatchObject({
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
    expect(mapped[1]).toMatchObject({
      temperature: 21,
      apparentTemperature: null,
      precipitationProbability: null,
      precipitation: null,
      windSpeed: 12,
      windGust: null,
      uvIndex: 4,
      weatherCode: 3,
      isDaylight: true,
    });
  });

  it('maps missing optional series to null for every hour', () => {
    const response: OpenMeteoForecastResponse = {
      hourly: {
        time: ['2026-10-08T08:00', '2026-10-08T09:00'],
        temperature_2m: [18, 19],
      },
    };

    const mapped = mapOpenMeteoForecastToHourlyWeather(response);

    expect(mapped).toEqual([
      {
        timestamp: '2026-10-08T08:00',
        temperature: 18,
        apparentTemperature: null,
        precipitationProbability: null,
        precipitation: null,
        windSpeed: null,
        windGust: null,
        uvIndex: null,
        weatherCode: null,
        isDaylight: null,
      },
      {
        timestamp: '2026-10-08T09:00',
        temperature: 19,
        apparentTemperature: null,
        precipitationProbability: null,
        precipitation: null,
        windSpeed: null,
        windGust: null,
        uvIndex: null,
        weatherCode: null,
        isDaylight: null,
      },
    ]);
  });

  it('maps is_day 1 → true, 0 → false, null → null', () => {
    const response: OpenMeteoForecastResponse = {
      hourly: {
        time: [
          '2026-10-08T06:00',
          '2026-10-08T12:00',
          '2026-10-08T22:00',
        ],
        is_day: [0, 1, null],
      },
    };

    const mapped = mapOpenMeteoForecastToHourlyWeather(response);

    expect(mapped.map((hour) => hour.isDaylight)).toEqual([false, true, null]);
  });

  it('maps absent is_day series to null', () => {
    const response: OpenMeteoForecastResponse = {
      hourly: {
        time: ['2026-10-08T14:00'],
        temperature_2m: [22],
      },
    };

    const mapped = mapOpenMeteoForecastToHourlyWeather(response);

    expect(mapped[0]?.isDaylight).toBeNull();
  });

  it('preserves timestamp strings exactly without timezone conversion', () => {
    const response: OpenMeteoForecastResponse = {
      hourly: {
        time: ['2026-10-08T14:00'],
        temperature_2m: [23.6],
      },
    };

    const [hour] = mapOpenMeteoForecastToHourlyWeather(response);

    expect(hour?.timestamp).toBe('2026-10-08T14:00');
  });

  it('does not mutate the input DTO', () => {
    const original = cloneOpenMeteoForecastResponse(openMeteoForecastHappyPathFixture);
    const snapshot = cloneOpenMeteoForecastResponse(original);

    mapOpenMeteoForecastToHourlyWeather(original);

    expect(original).toEqual(snapshot);
  });

  it('is deterministic for the same input', () => {
    const first = mapOpenMeteoForecastToHourlyWeather(openMeteoForecastHappyPathFixture);
    const second = mapOpenMeteoForecastToHourlyWeather(openMeteoForecastHappyPathFixture);

    expect(first).toEqual(second);
  });

  it('works after schema validation of a real-shaped payload', () => {
    const validated = parseOpenMeteoForecastResponse({
      latitude: -23.514938,
      longitude: -46.610504,
      timezone: 'America/Sao_Paulo',
      hourly_units: {
        time: 'iso8601',
        temperature_2m: '°C',
      },
      ...openMeteoForecastHappyPathFixture,
    });

    const mapped = mapOpenMeteoForecastToHourlyWeather(validated);

    expect(mapped).toHaveLength(3);
    expect(mapped[1]?.timestamp).toBe('2026-10-08T14:00');
    expect(mapped[1]?.isDaylight).toBe(true);
  });
});
