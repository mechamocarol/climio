import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

/** Hourly forecast request: coordinates + calendar day (`YYYY-MM-DD`). */
export type GetHourlyForecastInput = Readonly<{
  latitude: number;
  longitude: number;
  date: string;
}>;

/** Port for hourly forecasts; callers depend on domain models, not a provider. */
export type WeatherRepository = {
  getHourlyForecast(
    input: GetHourlyForecastInput,
    signal?: AbortSignal,
  ): Promise<HourlyWeather[]>;
};
