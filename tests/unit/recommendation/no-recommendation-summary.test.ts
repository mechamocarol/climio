import type { AnalyzedPeriod } from '@/features/recommendation/domain/types';
import { buildNoRecommendationSummary } from '@/features/recommendation/presentation/no-recommendation-summary';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(
  timestamp: string,
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  return {
    timestamp,
    temperature: 22,
    apparentTemperature: 22,
    precipitationProbability: 10,
    precipitation: 0,
    windSpeed: 12,
    windGust: 18,
    uvIndex: 3,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  };
}

function createPeriod(input: {
  timestamp: string;
  blocked?: boolean;
  blockingReasons?: AnalyzedPeriod['blockingReasons'];
  status?: AnalyzedPeriod['status'];
  precipitationProbability?: number | null;
  windGust?: number | null;
  factors?: AnalyzedPeriod['factors'];
}): AnalyzedPeriod {
  return {
    weather: createWeather(input.timestamp, {
      precipitationProbability: input.precipitationProbability ?? 10,
      windGust: input.windGust ?? 18,
    }),
    score: 1,
    percentage: 30,
    status: input.status ?? 'INADEQUATE',
    factors: input.factors ?? {
      temperature: 2,
      precipitation: 0,
      wind: 1,
      gust: 0,
    },
    blocked: input.blocked ?? false,
    blockingReasons: input.blockingReasons ?? [],
  };
}

describe('buildNoRecommendationSummary', () => {
  it('returns the prototype empty-state framing', () => {
    const summary = buildNoRecommendationSummary([]);

    expect(summary.eyebrow).toBe('Melhor não arriscar');
    expect(summary.title).toBe('Nenhum horário adequado');
    expect(summary.reasons).toEqual([]);
    expect(summary.body).toContain('condições não fecharam bem');
  });

  it('summarizes significant rain and gusts with concrete details', () => {
    const periods = [
      createPeriod({
        timestamp: '2026-10-17T14:00:00',
        blocked: true,
        blockingReasons: ['significant_rain', 'gust_above'],
        precipitationProbability: 80,
        windGust: 42,
      }),
      createPeriod({
        timestamp: '2026-10-17T15:00:00',
        blocked: true,
        blockingReasons: ['significant_rain', 'gust_above'],
        precipitationProbability: 75,
        windGust: 40,
      }),
      createPeriod({
        timestamp: '2026-10-17T19:00:00',
        blocked: true,
        blockingReasons: ['significant_rain'],
        precipitationProbability: 70,
        windGust: 30,
      }),
    ];

    const summary = buildNoRecommendationSummary(periods);

    expect(summary.body).toContain('chuva forte');
    expect(summary.body).toContain('rajadas');
    expect(summary.reasons).toEqual([
      {
        id: 'rain',
        icon: 'cloud-rain',
        title: 'Chuva forte',
        detail: '80% entre 14h e 20h',
      },
      {
        id: 'gust',
        icon: 'wind',
        title: 'Rajadas',
        detail: 'Até 42 km/h',
      },
    ]);
  });

  it('ignores outside_activity_hours when picking weather reasons', () => {
    const periods = [
      createPeriod({
        timestamp: '2026-10-17T02:00:00',
        blocked: true,
        blockingReasons: ['outside_activity_hours'],
        precipitationProbability: 90,
        windGust: 50,
      }),
      createPeriod({
        timestamp: '2026-10-17T10:00:00',
        blocked: true,
        blockingReasons: ['gust_above'],
        precipitationProbability: 20,
        windGust: 48,
      }),
    ];

    const summary = buildNoRecommendationSummary(periods);

    expect(summary.reasons.map((reason) => reason.id)).toEqual(['gust']);
    expect(summary.reasons[0]?.detail).toBe('Até 48 km/h');
  });

  it('falls back to weakest scored factors when nothing is blocked', () => {
    const periods = [
      createPeriod({
        timestamp: '2026-10-17T10:00:00',
        status: 'UNFAVORABLE',
        precipitationProbability: 55,
        windGust: 28,
        factors: {
          temperature: 2,
          precipitation: 1,
          wind: 1,
          gust: 1,
        },
      }),
      createPeriod({
        timestamp: '2026-10-17T11:00:00',
        status: 'UNFAVORABLE',
        precipitationProbability: 50,
        windGust: 30,
        factors: {
          temperature: 2,
          precipitation: 1,
          wind: 1,
          gust: 1,
        },
      }),
    ];

    const summary = buildNoRecommendationSummary(periods);

    expect(summary.reasons.length).toBeGreaterThan(0);
    expect(summary.reasons.length).toBeLessThanOrEqual(2);
  });

  it('is deterministic for the same periods', () => {
    const periods = [
      createPeriod({
        timestamp: '2026-10-17T14:00:00',
        blocked: true,
        blockingReasons: ['significant_rain'],
        precipitationProbability: 80,
      }),
    ];

    expect(buildNoRecommendationSummary(periods)).toEqual(
      buildNoRecommendationSummary(periods),
    );
  });
});
