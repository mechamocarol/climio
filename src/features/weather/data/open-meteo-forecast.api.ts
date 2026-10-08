import { httpRequest } from '@/infrastructure/api/http-client';

const OPEN_METEO_FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/** Hourly variables requested for every forecast (independent of activity rules). */
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

/** Forecast URL for one calendar day (`start_date` = `end_date` = `date`). */
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

/** Raw Open-Meteo forecast payload (validate/map outside this module). */
export async function fetchOpenMeteoForecast(
  input: OpenMeteoForecastApiInput,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = buildOpenMeteoForecastUrl(input);
  return httpRequest<unknown>(url, { method: 'GET', signal });
}
