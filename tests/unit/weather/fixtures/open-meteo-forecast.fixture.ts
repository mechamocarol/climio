import type { OpenMeteoForecastResponse } from '@/features/weather/data/open-meteo-forecast.dto';

/**
 * Compact fixture shaped like a real Open-Meteo Forecast hourly payload
 * (São Paulo, timezone=auto, single local day).
 */
export const openMeteoForecastHappyPathFixture: OpenMeteoForecastResponse = {
  hourly: {
    time: [
      '2026-10-08T00:00',
      '2026-10-08T14:00',
      '2026-10-08T19:00',
    ],
    temperature_2m: [16.2, 23.6, 19.5],
    apparent_temperature: [17.3, 25.9, 22.4],
    precipitation_probability: [86, 88, 99],
    precipitation: [0.4, 1.2, 0.0],
    wind_speed_10m: [8.1, 12.4, 10.9],
    wind_gusts_10m: [18.0, 30.2, 24.5],
    uv_index: [0.0, 8.8, 0.0],
    weather_code: [61, 3, 95],
    is_day: [0, 1, 0],
  },
};

/** Deep-clones a forecast DTO for mutation-isolation tests. */
export function cloneOpenMeteoForecastResponse(
  response: OpenMeteoForecastResponse,
): OpenMeteoForecastResponse {
  return structuredClone(response);
}
