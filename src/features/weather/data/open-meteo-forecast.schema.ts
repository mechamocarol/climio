import { z } from 'zod';

import type { OpenMeteoForecastResponse } from '@/features/weather/data/open-meteo-forecast.dto';

const nullableNumberSeriesSchema = z.array(z.number().nullable());

const isDaySeriesSchema = z.array(z.union([z.literal(0), z.literal(1), z.null()]));

/** Optional hourly series keys that must align with `hourly.time` when present. */
const ALIGNED_HOURLY_SERIES = [
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

const openMeteoForecastHourlySchema = z
  .object({
    time: z.array(z.string()),
    temperature_2m: nullableNumberSeriesSchema.optional(),
    apparent_temperature: nullableNumberSeriesSchema.optional(),
    precipitation_probability: nullableNumberSeriesSchema.optional(),
    precipitation: nullableNumberSeriesSchema.optional(),
    wind_speed_10m: nullableNumberSeriesSchema.optional(),
    wind_gusts_10m: nullableNumberSeriesSchema.optional(),
    uv_index: nullableNumberSeriesSchema.optional(),
    weather_code: nullableNumberSeriesSchema.optional(),
    is_day: isDaySeriesSchema.optional(),
  })
  .superRefine((hourly, ctx) => {
    const expectedLength = hourly.time.length;

    for (const key of ALIGNED_HOURLY_SERIES) {
      const series = hourly[key];
      if (series === undefined) {
        continue;
      }

      if (series.length !== expectedLength) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `hourly.${key} length (${series.length}) must match hourly.time length (${expectedLength})`,
        });
      }
    }
  });

export const openMeteoForecastResponseSchema = z.object({
  hourly: openMeteoForecastHourlySchema,
});

/**
 * Validates an unknown Open-Meteo Forecast payload against the Climio subset.
 * Rejects misaligned hourly series and invalid `is_day` values.
 */
export function parseOpenMeteoForecastResponse(
  input: unknown,
): OpenMeteoForecastResponse {
  return openMeteoForecastResponseSchema.parse(input);
}
