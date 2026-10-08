import { z } from 'zod';

import type { DeviceCoordinates } from '@/features/location/data/get-current-device-location';
import { httpRequest } from '@/infrastructure/api/http-client';

const OPEN_METEO_FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

const openMeteoTimezoneResponseSchema = z.object({
  timezone: z.string().min(1),
});

export type ResolveOpenMeteoTimezoneInput = DeviceCoordinates;

/**
 * Builds a minimal Open-Meteo Forecast URL used only to resolve IANA timezone.
 * Does not fetch Climio hourly weather variables.
 */
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

/**
 * Resolves the IANA timezone for coordinates via Open-Meteo `timezone=auto`.
 * Kept separate from the weather repository on purpose.
 */
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
