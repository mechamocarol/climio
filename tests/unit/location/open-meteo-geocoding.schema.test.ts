import {
  openMeteoGeocodingResponseSchema,
  parseOpenMeteoGeocodingResponse,
} from '@/features/location/data/open-meteo-geocoding.schema';

import { openMeteoGeocodingHappyPathFixture } from './fixtures/open-meteo-geocoding.fixture';

describe('openMeteoGeocodingResponseSchema', () => {
  it('accepts a valid Climio subset response', () => {
    const result = openMeteoGeocodingResponseSchema.safeParse(
      openMeteoGeocodingHappyPathFixture,
    );

    expect(result.success).toBe(true);
  });

  it('accepts a response with missing results', () => {
    const result = openMeteoGeocodingResponseSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.results).toBeUndefined();
    }
  });

  it('accepts an empty results array', () => {
    const result = openMeteoGeocodingResponseSchema.safeParse({ results: [] });

    expect(result.success).toBe(true);
  });

  it('rejects results missing latitude', () => {
    const result = openMeteoGeocodingResponseSchema.safeParse({
      results: [
        {
          id: 1,
          name: 'Nowhere',
          longitude: -46.6,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects results missing longitude', () => {
    const result = openMeteoGeocodingResponseSchema.safeParse({
      results: [
        {
          id: 1,
          name: 'Nowhere',
          latitude: -23.5,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('parseOpenMeteoGeocodingResponse returns the validated DTO', () => {
    const parsed = parseOpenMeteoGeocodingResponse(
      openMeteoGeocodingHappyPathFixture,
    );

    expect(parsed.results?.[0]?.name).toBe('São Paulo');
    expect(parsed.results?.[0]?.latitude).toBe(-23.5475);
  });

  it('parseOpenMeteoGeocodingResponse throws on invalid input', () => {
    expect(() =>
      parseOpenMeteoGeocodingResponse({
        results: [{ id: 'bad', name: 'X' }],
      }),
    ).toThrow();
  });
});
