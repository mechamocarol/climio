/**
 * Normalized domain representation of one hourly weather observation.
 * Field names are domain-oriented, not Open-Meteo payload keys.
 */

export type HourlyWeather = Readonly<{
  /** ISO-8601 local timestamp for the hour. */
  timestamp: string;
  temperature: number | null;
  apparentTemperature: number | null;
  /** Probability in percent (0–100). */
  precipitationProbability: number | null;
  /** Precipitation amount in mm/h. */
  precipitation: number | null;
  /** Wind speed in km/h. */
  windSpeed: number | null;
  /** Wind gust speed in km/h. */
  windGust: number | null;
  uvIndex: number | null;
  weatherCode: number | null;
  isDaylight: boolean | null;
}>;
