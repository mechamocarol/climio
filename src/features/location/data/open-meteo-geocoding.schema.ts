import { z } from 'zod';

import type { OpenMeteoGeocodingResponse } from '@/features/location/data/open-meteo-geocoding.dto';

const openMeteoGeocodingResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  admin1: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
});

export const openMeteoGeocodingResponseSchema = z.object({
  results: z.array(openMeteoGeocodingResultSchema).optional(),
});

/**
 * Validates an unknown Open-Meteo Geocoding payload against the Climio subset.
 * Rejects results that omit required identity or coordinate fields.
 */
export function parseOpenMeteoGeocodingResponse(
  input: unknown,
): OpenMeteoGeocodingResponse {
  return openMeteoGeocodingResponseSchema.parse(input);
}
