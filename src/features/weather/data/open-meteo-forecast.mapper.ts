import type { OpenMeteoForecastResponse } from '@/features/weather/data/open-meteo-forecast.dto';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function readNullableNumber(
  series: readonly (number | null)[] | undefined,
  index: number,
): number | null {
  if (series === undefined) {
    return null;
  }

  const value = series[index];
  return value === undefined ? null : value;
}

function readIsDaylight(
  series: readonly (0 | 1 | null)[] | undefined,
  index: number,
): boolean | null {
  if (series === undefined) {
    return null;
  }

  const value = series[index];
  if (value === undefined || value === null) {
    return null;
  }

  return value === 1;
}

/**
 * Maps a validated Open-Meteo Forecast DTO to domain `HourlyWeather` rows.
 * Pure transformation only — no scoring, filtering, or timezone conversion.
 */
export function mapOpenMeteoForecastToHourlyWeather(
  response: OpenMeteoForecastResponse,
): HourlyWeather[] {
  const { hourly } = response;

  return hourly.time.map((timestamp, index) => ({
    timestamp,
    temperature: readNullableNumber(hourly.temperature_2m, index),
    apparentTemperature: readNullableNumber(hourly.apparent_temperature, index),
    precipitationProbability: readNullableNumber(
      hourly.precipitation_probability,
      index,
    ),
    precipitation: readNullableNumber(hourly.precipitation, index),
    windSpeed: readNullableNumber(hourly.wind_speed_10m, index),
    windGust: readNullableNumber(hourly.wind_gusts_10m, index),
    uvIndex: readNullableNumber(hourly.uv_index, index),
    weatherCode: readNullableNumber(hourly.weather_code, index),
    isDaylight: readIsDaylight(hourly.is_day, index),
  }));
}
