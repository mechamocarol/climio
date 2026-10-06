import {
  openMeteoForecastResponseSchema,
  parseOpenMeteoForecastResponse,
} from '@/features/weather/data/open-meteo-forecast.schema';

import { openMeteoForecastHappyPathFixture } from './fixtures/open-meteo-forecast.fixture';

describe('openMeteoForecastResponseSchema', () => {
  it('accepts a valid Climio subset response', () => {
    const result = openMeteoForecastResponseSchema.safeParse(
      openMeteoForecastHappyPathFixture,
    );

    expect(result.success).toBe(true);
  });

  it('accepts responses that omit optional hourly series', () => {
    const result = openMeteoForecastResponseSchema.safeParse({
      hourly: {
        time: ['2026-10-08T14:00'],
        temperature_2m: [22],
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts null values inside hourly series', () => {
    const result = openMeteoForecastResponseSchema.safeParse({
      hourly: {
        time: ['2026-10-08T14:00'],
        temperature_2m: [null],
        is_day: [null],
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects misaligned hourly series relative to time', () => {
    const result = openMeteoForecastResponseSchema.safeParse({
      hourly: {
        time: [
          '2026-10-08T00:00',
          '2026-10-08T01:00',
          '2026-10-08T02:00',
        ],
        temperature_2m: [16, 17, 18],
        wind_speed_10m: [8, 9],
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const windIssue = result.error.issues.find(
        (issue) => issue.path.join('.') === 'hourly.wind_speed_10m',
      );
      expect(windIssue).toBeDefined();
      expect(windIssue?.message).toContain('must match hourly.time length');
    }
  });

  it('rejects invalid is_day values', () => {
    const result = openMeteoForecastResponseSchema.safeParse({
      hourly: {
        time: ['2026-10-08T14:00'],
        is_day: [2],
      },
    });

    expect(result.success).toBe(false);
  });

  it('parseOpenMeteoForecastResponse returns the validated DTO', () => {
    const parsed = parseOpenMeteoForecastResponse(openMeteoForecastHappyPathFixture);

    expect(parsed.hourly.time).toEqual(openMeteoForecastHappyPathFixture.hourly.time);
    expect(parsed.hourly.temperature_2m).toEqual(
      openMeteoForecastHappyPathFixture.hourly.temperature_2m,
    );
  });

  it('parseOpenMeteoForecastResponse throws on invalid input', () => {
    expect(() =>
      parseOpenMeteoForecastResponse({
        hourly: {
          time: ['2026-10-08T14:00'],
          precipitation: [1, 2],
        },
      }),
    ).toThrow();
  });
});
