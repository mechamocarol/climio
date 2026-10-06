import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

/**
 * Input for an hourly forecast request.
 * `date` is a calendar day in `YYYY-MM-DD` form (local calendar for the location).
 */
export type GetHourlyForecastInput = Readonly<{
  latitude: number;
  longitude: number;
  date: string;
}>;

/**
 * Feature port for hourly weather forecasts.
 * Callers receive domain models and do not depend on a specific weather provider.
 */
export type WeatherRepository = {
  getHourlyForecast(
    input: GetHourlyForecastInput,
    signal?: AbortSignal,
  ): Promise<HourlyWeather[]>;
};
