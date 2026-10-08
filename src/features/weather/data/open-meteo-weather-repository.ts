import { fetchOpenMeteoForecast } from '@/features/weather/data/open-meteo-forecast.api';
import { mapOpenMeteoForecastToHourlyWeather } from '@/features/weather/data/open-meteo-forecast.mapper';
import { parseOpenMeteoForecastResponse } from '@/features/weather/data/open-meteo-forecast.schema';
import type {
  GetHourlyForecastInput,
  WeatherRepository,
} from '@/features/weather/domain/weather-repository';

/** WeatherRepository: Open-Meteo forecast → Zod → domain `HourlyWeather`. */
export const openMeteoWeatherRepository: WeatherRepository = {
  async getHourlyForecast(
    input: GetHourlyForecastInput,
    signal?: AbortSignal,
  ) {
    const payload = await fetchOpenMeteoForecast(input, signal);
    const response = parseOpenMeteoForecastResponse(payload);
    return mapOpenMeteoForecastToHourlyWeather(response);
  },
};
