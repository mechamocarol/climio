/**
 * Open-Meteo Forecast API response subset used by Climio.
 * Field names match the API contract (snake_case), not the domain model.
 */

export type OpenMeteoNullableNumberSeries = (number | null)[];

/** Hourly daylight flag as returned by Open-Meteo (`1` day, `0` night). */
export type OpenMeteoIsDaySeries = (0 | 1 | null)[];

export type OpenMeteoForecastHourly = {
  time: string[];
  temperature_2m?: OpenMeteoNullableNumberSeries;
  apparent_temperature?: OpenMeteoNullableNumberSeries;
  precipitation_probability?: OpenMeteoNullableNumberSeries;
  precipitation?: OpenMeteoNullableNumberSeries;
  wind_speed_10m?: OpenMeteoNullableNumberSeries;
  wind_gusts_10m?: OpenMeteoNullableNumberSeries;
  uv_index?: OpenMeteoNullableNumberSeries;
  weather_code?: OpenMeteoNullableNumberSeries;
  is_day?: OpenMeteoIsDaySeries;
};

/**
 * Minimal Forecast response shape required to produce `HourlyWeather[]`.
 * Extra API fields (elevation, models, …) are intentionally omitted.
 */
export type OpenMeteoForecastResponse = {
  hourly: OpenMeteoForecastHourly;
};
