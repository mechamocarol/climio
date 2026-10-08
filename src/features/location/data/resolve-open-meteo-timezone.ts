import { z } from 'zod';

import type { DeviceCoordinates } from '@/features/location/data/get-current-device-location';
import { httpRequest } from '@/infrastructure/api/http-client';

const OPEN_METEO_FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

const openMeteoTimezoneResponseSchema = z.object({
  timezone: z.string().min(1),
});

export type ResolveOpenMeteoTimezoneInput = DeviceCoordinates;

/** Minimal Open-Meteo URL used solely to resolve IANA timezone for coordinates. */
export function buildOpenMeteoTimezoneUrl(
  input: ResolveOpenMeteoTimezoneInput,
): string {
  const url = new URL(OPEN_METEO_FORECAST_ENDPOINT);
  url.searchParams.set('latitude', String(input.latitude));
  url.searchParams.set('longitude', String(input.longitude));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('hourly', 'temperature_2m');
  return url.toString();
}

/** IANA timezone for coordinates via Open-Meteo `timezone=auto`. */
export async function resolveOpenMeteoTimezone(
  input: ResolveOpenMeteoTimezoneInput,
  signal?: AbortSignal,
): Promise<string> {
  const payload = await httpRequest<unknown>(buildOpenMeteoTimezoneUrl(input), {
    method: 'GET',
    signal,
  });

  return openMeteoTimezoneResponseSchema.parse(payload).timezone;
}
