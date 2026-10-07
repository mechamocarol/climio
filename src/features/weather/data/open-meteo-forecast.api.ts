import { httpRequest } from '@/infrastructure/api/http-client';

const OPEN_METEO_FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/** Fixed Climio MVP hourly variables — not derived from activity rules. */
export const OPEN_METEO_FORECAST_HOURLY_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'wind_speed_10m',
  'wind_gusts_10m',
  'uv_index',
  'weather_code',
  'is_day',
] as const;

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type OpenMeteoForecastApiInput = Readonly<{
  latitude: number;
  longitude: number;
  date: string;
}>;

function assertCalendarDate(date: string): void {
  if (!CALENDAR_DATE_PATTERN.test(date)) {
    throw new Error(`Invalid forecast date "${date}". Expected YYYY-MM-DD.`);
  }
}

/**
 * Builds the Open-Meteo Forecast URL for a single calendar day.
 * `date` is used as both start_date and end_date without Date parsing.
 */
export function buildOpenMeteoForecastUrl(input: OpenMeteoForecastApiInput): string {
  assertCalendarDate(input.date);

  const url = new URL(OPEN_METEO_FORECAST_ENDPOINT);
  url.searchParams.set('latitude', String(input.latitude));
  url.searchParams.set('longitude', String(input.longitude));
  url.searchParams.set('hourly', OPEN_METEO_FORECAST_HOURLY_VARIABLES.join(','));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', input.date);
  url.searchParams.set('end_date', input.date);
  return url.toString();
}

/**
 * Fetches the raw Open-Meteo Forecast payload.
 * Validation and domain mapping happen outside this data source.
 */
export async function fetchOpenMeteoForecast(
  input: OpenMeteoForecastApiInput,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = buildOpenMeteoForecastUrl(input);
  return httpRequest<unknown>(url, { method: 'GET', signal });
}
