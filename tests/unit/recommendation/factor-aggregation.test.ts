import { aggregateWindowFactors } from '@/features/recommendation/domain/factor-aggregation';
import type {
  AnalyzedPeriod,
  FactorScoreBreakdown,
  PeriodStatus,
  RecommendationWindow,
} from '@/features/recommendation/domain/types';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(timestamp: string): HourlyWeather {
  return {
    timestamp,
    temperature: 22,
    apparentTemperature: 22,
    precipitationProbability: 5,
    precipitation: 0,
    windSpeed: 10,
    windGust: 15,
    uvIndex: 3,
    weatherCode: 1,
    isDaylight: true,
  };
}

function createPeriod(input: {
  timestamp: string;
  factors: FactorScoreBreakdown;
  status?: PeriodStatus;
  score?: number;
  percentage?: number;
}): AnalyzedPeriod {
  return {
    weather: createWeather(input.timestamp),
    score: input.score ?? 3,
    percentage: input.percentage ?? 100,
    status: input.status ?? 'IDEAL',
    factors: input.factors,
    blocked: false,
    blockingReasons: [],
  };
}

function createWindow(
  periods: readonly AnalyzedPeriod[],
): RecommendationWindow {
  const first = periods[0];
  const last = periods[periods.length - 1];
  if (first === undefined || last === undefined) {
    throw new Error('Window fixture requires at least one period');
  }

  return {
    startTimestamp: first.weather.timestamp,
    endTimestamp: last.weather.timestamp,
    durationHours: periods.length,
    averageScore: 2.5,
    averagePercentage: 80,
    minimumScore: 2,
    periods,
  };
}

describe('aggregateWindowFactors', () => {
  it('aggregates a single factor across multiple periods', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { temperature: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { temperature: 2 },
      }),
    ]);

    expect(aggregateWindowFactors(window)).toEqual({
      temperature: (3 + 3 + 2) / 3,
    });
  });

  it('aggregates multiple factors', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { temperature: 3, precipitation: 3, wind: 2 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 3, precipitation: 3, wind: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { temperature: 2, precipitation: 3, wind: 3 },
      }),
    ]);

    expect(aggregateWindowFactors(window)).toEqual({
      temperature: (3 + 3 + 2) / 3,
      precipitation: 3,
      wind: (2 + 3 + 3) / 3,
    });
  });

  it('does not round the arithmetic mean', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { temperature: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { temperature: 2 },
      }),
    ]);

    const result = aggregateWindowFactors(window);
    expect(result.temperature).toBe(2.6666666666666665);
    expect(result.temperature).not.toBe(Math.round(result.temperature!));
  });

  it('ignores absent factors and averages only periods where the factor exists', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { temperature: 3, precipitation: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 2 },
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { temperature: 3, precipitation: 1 },
      }),
    ]);

    expect(aggregateWindowFactors(window)).toEqual({
      temperature: (3 + 2 + 3) / 3,
      precipitation: (3 + 1) / 2,
    });
  });

  it('does not treat an absent factor as score 0', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { precipitation: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 2 },
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { precipitation: 1 },
      }),
    ]);

    const result = aggregateWindowFactors(window);
    expect(result.precipitation).toBe(2);
    expect(result.precipitation).not.toBe((3 + 0 + 1) / 3);
  });

  it('preserves score 0 as a valid value in the average', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { wind: 0 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { wind: 3 },
      }),
    ]);

    expect(aggregateWindowFactors(window)).toEqual({ wind: 1.5 });
  });

  it('returns the hour scores as equivalent numbers for a one-hour window', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T09:00:00',
        factors: { temperature: 2, precipitation: 3, wind: 1, gust: 0 },
      }),
    ]);

    expect(aggregateWindowFactors(window)).toEqual({
      temperature: 2,
      precipitation: 3,
      wind: 1,
      gust: 0,
    });
  });

  it('returns every factor when all are present across the window', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T10:00:00',
        factors: {
          temperature: 3,
          precipitation: 2,
          wind: 1,
          gust: 2,
          uv: 0,
        },
      }),
      createPeriod({
        timestamp: '2026-10-06T11:00:00',
        factors: {
          temperature: 3,
          precipitation: 2,
          wind: 1,
          gust: 2,
          uv: 2,
        },
      }),
    ]);

    expect(aggregateWindowFactors(window)).toEqual({
      temperature: 3,
      precipitation: 2,
      wind: 1,
      gust: 2,
      uv: 1,
    });
  });

  it('does not add factors that never appear', () => {
    const window = createWindow([
      createPeriod({
        timestamp: '2026-10-06T10:00:00',
        factors: { temperature: 3, wind: 2 },
      }),
    ]);

    const result = aggregateWindowFactors(window);
    expect(result).toEqual({ temperature: 3, wind: 2 });
    expect(result).not.toHaveProperty('precipitation');
    expect(result).not.toHaveProperty('gust');
    expect(result).not.toHaveProperty('uv');
  });

  it('does not mutate the RecommendationWindow or its AnalyzedPeriods', () => {
    const periodA = createPeriod({
      timestamp: '2026-10-06T17:00:00',
      factors: { temperature: 3, wind: 0 },
    });
    const periodB = createPeriod({
      timestamp: '2026-10-06T18:00:00',
      factors: { temperature: 2, wind: 3 },
    });
    const window = createWindow([periodA, periodB]);
    const windowSnapshot = structuredClone(window);
    const factorsASnapshot = { ...periodA.factors };
    const factorsBSnapshot = { ...periodB.factors };

    aggregateWindowFactors(window);

    expect(window).toEqual(windowSnapshot);
    expect(periodA.factors).toEqual(factorsASnapshot);
    expect(periodB.factors).toEqual(factorsBSnapshot);
  });

  it('is deterministic regardless of period order', () => {
    const ascending = createWindow([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { temperature: 3, precipitation: 3 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 2 },
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { temperature: 3, precipitation: 1 },
      }),
    ]);
    const descending = createWindow([
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        factors: { temperature: 3, precipitation: 1 },
      }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        factors: { temperature: 2 },
      }),
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        factors: { temperature: 3, precipitation: 3 },
      }),
    ]);

    expect(aggregateWindowFactors(ascending)).toEqual(
      aggregateWindowFactors(descending),
    );
  });
});
