import type {
  AnalyzedPeriod,
  FactorScoreBreakdown,
  PeriodStatus,
} from '@/features/recommendation/domain/types';
import { buildRecommendationWindows } from '@/features/recommendation/domain/windows';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(timestamp: string, overrides: Partial<HourlyWeather> = {}): HourlyWeather {
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
    ...overrides,
  };
}

function createPeriod(input: {
  timestamp: string;
  status: PeriodStatus;
  score?: number;
  percentage?: number;
  blocked?: boolean;
  factors?: FactorScoreBreakdown;
}): AnalyzedPeriod {
  return {
    weather: createWeather(input.timestamp),
    score: input.score ?? 3,
    percentage: input.percentage ?? 100,
    status: input.status,
    factors: input.factors ?? { temperature: 3, precipitation: 3, wind: 3 },
    blocked: input.blocked ?? false,
    blockingReasons: input.blocked ? ['storm'] : [],
  };
}

describe('buildRecommendationWindows', () => {
  it('groups a continuous Ideal+Ideal+Acceptable sequence into one 3h window', () => {
    const periods = [
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL', score: 3, percentage: 100 }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        status: 'IDEAL',
        score: 2.7,
        percentage: 90,
      }),
      createPeriod({
        timestamp: '2026-10-06T19:00:00',
        status: 'ACCEPTABLE',
        score: 2.1,
        percentage: 70,
      }),
    ];

    const windows = buildRecommendationWindows(periods);

    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T20:00:00',
      durationHours: 3,
      averageScore: (3 + 2.7 + 2.1) / 3,
      averagePercentage: (100 + 90 + 70) / 3,
      minimumScore: 2.1,
    });
    expect(windows[0]?.periods).toHaveLength(3);
  });

  it('splits on UNFAVORABLE', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T18:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T19:00:00', status: 'ACCEPTABLE' }),
      createPeriod({ timestamp: '2026-10-06T20:00:00', status: 'UNFAVORABLE', score: 1.2, percentage: 40 }),
      createPeriod({ timestamp: '2026-10-06T21:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T22:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T20:00:00',
      durationHours: 3,
    });
    expect(windows[1]).toMatchObject({
      startTimestamp: '2026-10-06T21:00:00',
      endTimestamp: '2026-10-06T23:00:00',
      durationHours: 2,
    });
  });

  it('splits on INADEQUATE', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL' }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        status: 'INADEQUATE',
        score: 0.5,
        percentage: 10,
      }),
      createPeriod({ timestamp: '2026-10-06T19:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T18:00:00',
      durationHours: 1,
    });
    expect(windows[1]).toMatchObject({
      startTimestamp: '2026-10-06T19:00:00',
      endTimestamp: '2026-10-06T20:00:00',
      durationHours: 1,
    });
  });

  it('splits on blocked periods', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL' }),
      createPeriod({
        timestamp: '2026-10-06T18:00:00',
        status: 'INADEQUATE',
        blocked: true,
        score: 3,
        percentage: 100,
      }),
      createPeriod({ timestamp: '2026-10-06T19:00:00', status: 'ACCEPTABLE', score: 2, percentage: 70 }),
    ]);

    expect(windows).toHaveLength(2);
    expect(windows[0]?.durationHours).toBe(1);
    expect(windows[1]?.startTimestamp).toBe('2026-10-06T19:00:00');
  });

  it('excludes a blocked period even when status is IDEAL', () => {
    const windows = buildRecommendationWindows([
      createPeriod({
        timestamp: '2026-10-06T17:00:00',
        status: 'IDEAL',
        blocked: true,
        score: 3,
        percentage: 100,
      }),
      createPeriod({ timestamp: '2026-10-06T18:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T18:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 1,
    });
  });

  it('splits on a temporal gap of 2 hours', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T18:00:00', status: 'ACCEPTABLE', score: 2, percentage: 70 }),
      createPeriod({ timestamp: '2026-10-06T20:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 2,
    });
    expect(windows[1]).toMatchObject({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T21:00:00',
      durationHours: 1,
    });
  });

  it('builds a single 1h window', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T09:00:00', status: 'IDEAL', score: 2.8, percentage: 93.333 }),
    ]);

    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T09:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 1,
      averageScore: 2.8,
      averagePercentage: 93.333,
      minimumScore: 2.8,
    });
  });

  it('builds two independent windows separated by status', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T18:00:00', status: 'UNFAVORABLE', score: 1, percentage: 40 }),
      createPeriod({ timestamp: '2026-10-06T19:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T18:00:00',
    });
    expect(windows[1]).toMatchObject({
      startTimestamp: '2026-10-06T19:00:00',
      endTimestamp: '2026-10-06T20:00:00',
    });
  });

  it('sorts out-of-order input without mutating the original array', () => {
    const periods = [
      createPeriod({ timestamp: '2026-10-06T19:00:00', status: 'ACCEPTABLE', score: 2, percentage: 70 }),
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL', score: 3, percentage: 100 }),
      createPeriod({ timestamp: '2026-10-06T18:00:00', status: 'IDEAL', score: 2.5, percentage: 83.333 }),
    ];
    const originalOrder = periods.map((period) => period.weather.timestamp);

    const windows = buildRecommendationWindows(periods);

    expect(periods.map((period) => period.weather.timestamp)).toEqual(originalOrder);
    expect(windows).toHaveLength(1);
    expect(windows[0]?.startTimestamp).toBe('2026-10-06T17:00:00');
    expect(windows[0]?.endTimestamp).toBe('2026-10-06T20:00:00');
    expect(windows[0]?.periods.map((period) => period.weather.timestamp)).toEqual([
      '2026-10-06T17:00:00',
      '2026-10-06T18:00:00',
      '2026-10-06T19:00:00',
    ]);
  });

  it('groups a sequence of only ACCEPTABLE periods', () => {
    const windows = buildRecommendationWindows([
      createPeriod({
        timestamp: '2026-10-06T10:00:00',
        status: 'ACCEPTABLE',
        score: 2,
        percentage: 66.666,
      }),
      createPeriod({
        timestamp: '2026-10-06T11:00:00',
        status: 'ACCEPTABLE',
        score: 1.8,
        percentage: 60,
      }),
    ]);

    expect(windows).toHaveLength(1);
    expect(windows[0]?.durationHours).toBe(2);
    expect(windows[0]?.minimumScore).toBe(1.8);
  });

  it('groups a sequence of only IDEAL periods', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T07:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T08:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T09:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      startTimestamp: '2026-10-06T07:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 3,
      averageScore: 3,
      averagePercentage: 100,
      minimumScore: 3,
    });
  });

  it('returns no windows when every period is ineligible', () => {
    const windows = buildRecommendationWindows([
      createPeriod({
        timestamp: '2026-10-06T10:00:00',
        status: 'UNFAVORABLE',
        score: 1.2,
        percentage: 40,
      }),
      createPeriod({
        timestamp: '2026-10-06T11:00:00',
        status: 'INADEQUATE',
        score: 0.5,
        percentage: 10,
      }),
      createPeriod({
        timestamp: '2026-10-06T12:00:00',
        status: 'IDEAL',
        blocked: true,
        score: 3,
        percentage: 100,
      }),
    ]);

    expect(windows).toEqual([]);
  });

  it('does not invent periods for missing hours inside a gap', () => {
    const windows = buildRecommendationWindows([
      createPeriod({ timestamp: '2026-10-06T17:00:00', status: 'IDEAL' }),
      createPeriod({ timestamp: '2026-10-06T20:00:00', status: 'IDEAL' }),
    ]);

    expect(windows).toHaveLength(2);
    expect(windows[0]?.periods).toHaveLength(1);
    expect(windows[1]?.periods).toHaveLength(1);
  });
});
