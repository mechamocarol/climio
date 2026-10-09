import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import { selectAlternativeWindows } from '@/features/recommendation/domain/alternatives';
import { selectBestWindow } from '@/features/recommendation/domain/best-window';
import { aggregateWindowFactors } from '@/features/recommendation/domain/factor-aggregation';
import { buildRecommendationExplanation } from '@/features/recommendation/domain/factor-explanation';
import { recommendActivity } from '@/features/recommendation/domain/recommendation-engine';
import { buildRecommendationWindows } from '@/features/recommendation/domain/windows';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    timestamp: '2026-10-06T10:00:00',
    temperature: 20,
    apparentTemperature: 21,
    precipitationProbability: 5,
    precipitation: 0,
    windSpeed: 10,
    windGust: 15,
    uvIndex: 2,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  };
}

/** Ideal running hour (all weighted factors score 3). */
function idealRunningHour(timestamp: string, overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return createWeather({
    timestamp,
    temperature: 20,
    precipitationProbability: 5,
    windSpeed: 10,
    windGust: 15,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  });
}

/** Ideal child_walk hour (all weighted factors score 3, including UV). */
function idealChildWalkHour(
  timestamp: string,
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  return createWeather({
    timestamp,
    temperature: 22,
    precipitationProbability: 5,
    windSpeed: 10,
    uvIndex: 2,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  });
}

function hourFromTimestamp(timestamp: string): number {
  return Number(/T(\d{2}):/.exec(timestamp)?.[1]);
}

describe('recommendActivity', () => {
  const runningRules = getActivityRules('running');

  it('returns a complete happy-path RecommendationResult', () => {
    const weather = [
      idealRunningHour('2026-10-06T10:00:00'),
      idealRunningHour('2026-10-06T11:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.activityId).toBe('running');
    expect(result.analyzedPeriods).toHaveLength(2);
    expect(result.recommendation).not.toBeNull();
    expect(result.recommendation?.durationHours).toBe(2);
    expect(result.alternatives).toEqual(
      selectAlternativeWindows(
        buildRecommendationWindows(result.analyzedPeriods),
        result.recommendation,
      ),
    );
    expect(result.explanation).toEqual(
      buildRecommendationExplanation(
        aggregateWindowFactors(result.recommendation!),
      ),
    );
    expect(Object.keys(result).sort()).toEqual([
      'activityId',
      'alternatives',
      'analyzedPeriods',
      'explanation',
      'recommendation',
    ]);
  });

  it('analyzes every valid hour and preserves input order in analyzedPeriods', () => {
    const weather = [
      idealRunningHour('2026-10-06T08:00:00'),
      idealRunningHour('2026-10-06T09:00:00'),
      idealRunningHour('2026-10-06T10:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.analyzedPeriods).toHaveLength(3);
    expect(result.analyzedPeriods.map((p) => p.weather.timestamp)).toEqual([
      '2026-10-06T08:00:00',
      '2026-10-06T09:00:00',
      '2026-10-06T10:00:00',
    ]);
  });

  it('drops hours that C3 cannot analyze and keeps valid ones', () => {
    const weather = [
      idealRunningHour('2026-10-06T10:00:00'),
      idealRunningHour('2026-10-06T11:00:00', { temperature: null }),
      idealRunningHour('2026-10-06T12:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.analyzedPeriods).toHaveLength(2);
    expect(result.analyzedPeriods.map((p) => p.weather.timestamp)).toEqual([
      '2026-10-06T10:00:00',
      '2026-10-06T12:00:00',
    ]);
    expect(result.analyzedPeriods.every((p) => p.weather.temperature !== null)).toBe(
      true,
    );
  });

  it('returns null recommendation, empty alternatives and empty explanation when no eligible window exists', () => {
    // Storm blocks every hour → INADEQUATE / blocked → C4 yields no windows
    const weather = [
      idealRunningHour('2026-10-06T10:00:00', { weatherCode: 95 }),
      idealRunningHour('2026-10-06T11:00:00', { weatherCode: 95 }),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.analyzedPeriods).toHaveLength(2);
    expect(result.recommendation).toBeNull();
    expect(result.alternatives).toEqual([]);
    expect(result.explanation).toEqual({
      positiveFactors: [],
      neutralFactors: [],
      negativeFactors: [],
    });
  });

  it('does not build an explanation from a nonexistent recommendation', () => {
    const weather = [idealRunningHour('2026-10-06T10:00:00', { weatherCode: 97 })];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation).toBeNull();
    expect(result.explanation).toEqual({
      positiveFactors: [],
      neutralFactors: [],
      negativeFactors: [],
    });
  });

  it('uses C5 recommendation and C6 alternatives without including the main window', () => {
    const weather = [
      idealRunningHour('2026-10-06T08:00:00'),
      idealRunningHour('2026-10-06T09:00:00'),
      // gap
      idealRunningHour('2026-10-06T12:00:00'),
      idealRunningHour('2026-10-06T13:00:00'),
      // gap
      idealRunningHour('2026-10-06T16:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });
    const windows = buildRecommendationWindows(result.analyzedPeriods);
    const expectedMain = selectBestWindow(windows, runningRules.prefersDaylight);

    expect(result.recommendation).toEqual(expectedMain);
    expect(result.recommendation).not.toBeNull();
    // Within one engine run, C6 must exclude the exact main reference from C5.
    expect(result.alternatives).not.toContain(result.recommendation);
    expect(result.alternatives.map((window) => window.startTimestamp)).toEqual(
      selectAlternativeWindows(windows, expectedMain).map(
        (window) => window.startTimestamp,
      ),
    );
  });

  it('builds explanation from the recommendation window only', () => {
    const weather = [
      idealRunningHour('2026-10-06T10:00:00'),
      idealRunningHour('2026-10-06T11:00:00'),
      idealRunningHour('2026-10-06T15:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation).not.toBeNull();
    expect(result.explanation).toEqual(
      buildRecommendationExplanation(
        aggregateWindowFactors(result.recommendation!),
      ),
    );
    expect(result.explanation.positiveFactors.length).toBeGreaterThan(0);
  });

  it('is deterministic for the same inputs', () => {
    const weather = [
      idealRunningHour('2026-10-06T10:00:00'),
      idealRunningHour('2026-10-06T11:00:00'),
      idealRunningHour('2026-10-06T14:00:00'),
    ];
    const input = { weather, rules: runningRules };

    expect(recommendActivity(input)).toEqual(recommendActivity(input));
  });

  it('does not mutate weather or rules', () => {
    const weather = [
      idealRunningHour('2026-10-06T10:00:00'),
      idealRunningHour('2026-10-06T11:00:00'),
    ];
    const weatherSnapshot = structuredClone(weather);
    const rulesSnapshot = structuredClone(runningRules);

    recommendActivity({ weather, rules: runningRules });

    expect(weather).toEqual(weatherSnapshot);
    expect(runningRules).toEqual(rulesSnapshot);
  });

  it('does not recommend a 24h window when the whole day is eligible', () => {
    const weather = Array.from({ length: 24 }, (_, hour) =>
      idealRunningHour(
        `2026-10-09T${String(hour).padStart(2, '0')}:00:00`,
      ),
    );

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation).not.toBeNull();
    expect(result.recommendation?.durationHours).toBe(2);
    expect(result.recommendation?.durationHours).not.toBe(24);
  });

  it('selects the higher-scoring practical 2h window over a weaker one', () => {
    const weather = [
      // Weaker morning stretch
      idealRunningHour('2026-10-09T08:00:00', {
        temperature: 18,
        windSpeed: 18,
      }),
      idealRunningHour('2026-10-09T09:00:00', {
        temperature: 18,
        windSpeed: 18,
      }),
      // Stronger afternoon stretch
      idealRunningHour('2026-10-09T17:00:00'),
      idealRunningHour('2026-10-09T18:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation?.startTimestamp).toBe('2026-10-09T17:00:00');
    expect(result.recommendation?.endTimestamp).toBe('2026-10-09T19:00:00');
    expect(result.recommendation?.durationHours).toBe(2);
  });

  it('falls back to a 1h window when no practical 2h window exists', () => {
    const weather = [
      idealRunningHour('2026-10-09T10:00:00'),
      // gap — no consecutive pair
      idealRunningHour('2026-10-09T14:00:00', {
        temperature: 18,
        windSpeed: 18,
      }),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation?.durationHours).toBe(1);
    expect(result.recommendation?.startTimestamp).toBe('2026-10-09T10:00:00');
  });

  it('keeps daylight preference within tolerance for practical windows', () => {
    expect(runningRules.prefersDaylight).toBe(true);

    const weather = [
      // Slightly better night window (within 5pp of daytime)
      idealRunningHour('2026-10-09T20:00:00', {
        windSpeed: 8,
        isDaylight: false,
      }),
      idealRunningHour('2026-10-09T21:00:00', {
        windSpeed: 8,
        isDaylight: false,
      }),
      // Daytime window — preferred inside daylight tolerance
      idealRunningHour('2026-10-09T10:00:00', {
        windSpeed: 14,
        isDaylight: true,
      }),
      idealRunningHour('2026-10-09T11:00:00', {
        windSpeed: 14,
        isDaylight: true,
      }),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation?.startTimestamp).toBe('2026-10-09T10:00:00');
    expect(result.recommendation?.durationHours).toBe(2);
  });


  it('returns alternatives that do not overlap the main practical window', () => {
    const weather = [
      idealRunningHour('2026-10-09T08:00:00'),
      idealRunningHour('2026-10-09T09:00:00'),
      idealRunningHour('2026-10-09T12:00:00'),
      idealRunningHour('2026-10-09T13:00:00'),
      idealRunningHour('2026-10-09T17:00:00'),
      idealRunningHour('2026-10-09T18:00:00'),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation).not.toBeNull();
    for (const alternative of result.alternatives) {
      expect(alternative).not.toBe(result.recommendation);
      const main = result.recommendation!;
      const overlaps =
        alternative.startTimestamp < main.endTimestamp &&
        main.startTimestamp < alternative.endTimestamp;
      expect(overlaps).toBe(false);
    }
  });

  it('does not recommend overnight hours when a worse but allowed window exists', () => {
    const weather = [
      // Perfect overnight climate — outside default outdoor hours (05–22)
      ...Array.from({ length: 5 }, (_, hour) =>
        idealRunningHour(`2026-10-09T0${hour}:00:00`),
      ),
      // Allowed window — slightly worse but still eligible
      idealRunningHour('2026-10-09T06:00:00', { windSpeed: 18 }),
      idealRunningHour('2026-10-09T07:00:00', { windSpeed: 18 }),
    ];

    const result = recommendActivity({ weather, rules: runningRules });

    expect(result.recommendation).not.toBeNull();
    expect(result.recommendation?.startTimestamp).toBe('2026-10-09T06:00:00');
    expect(result.recommendation?.durationHours).toBe(2);
    expect(hourFromTimestamp(result.recommendation!.startTimestamp)).toBeGreaterThanOrEqual(5);
    expect(hourFromTimestamp(result.recommendation!.startTimestamp)).toBeLessThan(22);
  });

  it('keeps all recommendation windows inside activity hours for child_walk', () => {
    const childRules = getActivityRules('child_walk');
    const weather = Array.from({ length: 24 }, (_, hour) =>
      idealChildWalkHour(
        `2026-10-09T${String(hour).padStart(2, '0')}:00:00`,
      ),
    );

    const result = recommendActivity({ weather, rules: childRules });
    const main = result.recommendation;

    expect(main).not.toBeNull();
    expect(main!.durationHours).toBe(2);

    const forbiddenStarts = [0, 1, 2, 3, 4, 5, 6, 7, 21, 22, 23];
    expect(forbiddenStarts).not.toContain(hourFromTimestamp(main!.startTimestamp));

    for (const period of main!.periods) {
      const hour = hourFromTimestamp(period.weather.timestamp);
      expect(hour).toBeGreaterThanOrEqual(8);
      expect(hour).toBeLessThan(21);
    }

    for (const alternative of result.alternatives) {
      for (const period of alternative.periods) {
        const hour = hourFromTimestamp(period.weather.timestamp);
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThan(21);
      }
    }
  });

  it('returns alternatives that do not overlap the main window or each other', () => {
    const weather = Array.from({ length: 10 }, (_, hour) =>
      idealRunningHour(`2026-10-07T${String(hour + 8).padStart(2, '0')}:00:00`),
    );

    const result = recommendActivity({ weather, rules: runningRules });
    const main = result.recommendation;

    expect(main).not.toBeNull();
    expect(result.alternatives).not.toContain(main);

    for (const alternative of result.alternatives) {
      expect(alternative.startTimestamp < main!.endTimestamp && main!.startTimestamp < alternative.endTimestamp).toBe(
        false,
      );
    }

    for (let i = 0; i < result.alternatives.length; i += 1) {
      for (let j = i + 1; j < result.alternatives.length; j += 1) {
        const a = result.alternatives[i]!;
        const b = result.alternatives[j]!;
        const overlaps =
          a.startTimestamp < b.endTimestamp && b.startTimestamp < a.endTimestamp;
        expect(overlaps).toBe(false);
      }
    }

    const starts = result.alternatives.map((window) => window.startTimestamp);
    expect(new Set(starts).size).toBe(starts.length);
  });

  it('never builds a 2h window that includes a forbidden hour', () => {
    const childRules = getActivityRules('child_walk');
    const weather = [
      idealChildWalkHour('2026-10-09T07:00:00'),
      idealChildWalkHour('2026-10-09T08:00:00'),
      idealChildWalkHour('2026-10-09T09:00:00'),
      idealChildWalkHour('2026-10-09T20:00:00'),
      idealChildWalkHour('2026-10-09T21:00:00'),
    ];

    const result = recommendActivity({ weather, rules: childRules });
    const windows = [
      result.recommendation,
      ...result.alternatives,
    ].filter((window): window is NonNullable<typeof window> => window !== null);

    expect(windows.length).toBeGreaterThan(0);
    for (const window of windows) {
      for (const period of window.periods) {
        const hour = hourFromTimestamp(period.weather.timestamp);
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThan(21);
      }
    }

    // 07:00 and 21:00 are analyzed but blocked / ineligible
    const seven = result.analyzedPeriods.find(
      (period) => period.weather.timestamp === '2026-10-09T07:00:00',
    );
    const twentyOne = result.analyzedPeriods.find(
      (period) => period.weather.timestamp === '2026-10-09T21:00:00',
    );
    expect(seven?.blocked).toBe(true);
    expect(seven?.blockingReasons).toContain('outside_activity_hours');
    expect(twentyOne?.blocked).toBe(true);
    expect(twentyOne?.blockingReasons).toContain('outside_activity_hours');
  });

  describe('location-local past-start filter (today only)', () => {
    const selectedDate = '2026-10-07';

    function dayHours(): HourlyWeather[] {
      return [
        idealRunningHour('2026-10-07T08:00'),
        idealRunningHour('2026-10-07T09:00'),
        idealRunningHour('2026-10-07T14:00'),
        idealRunningHour('2026-10-07T15:00'),
        idealRunningHour('2026-10-07T16:00'),
        idealRunningHour('2026-10-07T17:00'),
        idealRunningHour('2026-10-07T18:00'),
        idealRunningHour('2026-10-07T19:00'),
      ];
    }

    it('keeps morning windows when the selected date is in the future', () => {
      const futureWeather = [
        idealRunningHour('2026-10-08T08:00'),
        idealRunningHour('2026-10-08T09:00'),
        idealRunningHour('2026-10-08T14:00'),
        idealRunningHour('2026-10-08T15:00'),
        idealRunningHour('2026-10-08T16:00'),
        idealRunningHour('2026-10-08T17:00'),
        idealRunningHour('2026-10-08T18:00'),
        idealRunningHour('2026-10-08T19:00'),
      ];

      const result = recommendActivity({
        weather: futureWeather,
        rules: runningRules,
        selectedDate: '2026-10-08',
        locationLocalNow: {
          date: '2026-10-07',
          hour: 23,
          minute: 10,
        },
      });

      expect(result.recommendation?.startTimestamp).toBe('2026-10-08T08:00');
    });

    it('excludes windows that start before the location-local now on today', () => {
      const result = recommendActivity({
        weather: dayHours(),
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 15, minute: 30 },
      });

      expect(result.recommendation).not.toBeNull();
      expect(result.recommendation?.startTimestamp).toBe('2026-10-07T16:00');

      const starts = [
        result.recommendation?.startTimestamp,
        ...result.alternatives.map((window) => window.startTimestamp),
      ];
      expect(starts).not.toContain('2026-10-07T08:00');
      expect(starts).not.toContain('2026-10-07T14:00');
      expect(starts).not.toContain('2026-10-07T15:00');
    });

    it('allows a window that starts exactly at the location-local now', () => {
      const result = recommendActivity({
        weather: dayHours(),
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 16, minute: 0 },
      });

      expect(result.recommendation?.startTimestamp).toBe('2026-10-07T16:00');
    });

    it('excludes a window that already started even if it ends in the future', () => {
      const result = recommendActivity({
        weather: [
          idealRunningHour('2026-10-07T15:00'),
          idealRunningHour('2026-10-07T16:00'),
          idealRunningHour('2026-10-07T18:00'),
          idealRunningHour('2026-10-07T19:00'),
        ],
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 15, minute: 30 },
      });

      expect(result.recommendation?.startTimestamp).toBe('2026-10-07T18:00');
      expect(
        result.alternatives.every(
          (window) => window.startTimestamp >= '2026-10-07T16:00',
        ),
      ).toBe(true);
    });

    it('never returns a past primary recommendation on today', () => {
      const result = recommendActivity({
        weather: dayHours(),
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 15, minute: 30 },
      });

      expect(result.recommendation).not.toBeNull();
      expect(
        result.recommendation!.startTimestamp >= '2026-10-07T16:00',
      ).toBe(true);
    });

    it('never returns past alternatives on today and keeps them non-overlapping', () => {
      const result = recommendActivity({
        weather: dayHours(),
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 15, minute: 30 },
      });

      expect(result.alternatives.length).toBeGreaterThan(0);
      for (const alternative of result.alternatives) {
        expect(alternative.startTimestamp >= '2026-10-07T16:00').toBe(true);
      }

      const recomputed = selectAlternativeWindows(
        buildRecommendationWindows(
          result.analyzedPeriods.filter(
            (period) => period.weather.timestamp >= '2026-10-07T16:00',
          ),
        ),
        result.recommendation,
      );
      expect(result.alternatives).toEqual(recomputed);
    });

    it('returns null recommendation when every remaining today hour has passed', () => {
      const result = recommendActivity({
        weather: [
          idealRunningHour('2026-10-07T08:00'),
          idealRunningHour('2026-10-07T09:00'),
          idealRunningHour('2026-10-07T10:00'),
        ],
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 23, minute: 10 },
      });

      expect(result.recommendation).toBeNull();
      expect(result.alternatives).toEqual([]);
      expect(result.analyzedPeriods.length).toBe(3);
    });

    it('is deterministic for an injected location-local now', () => {
      const input = {
        weather: dayHours(),
        rules: runningRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 15, minute: 30 },
      } as const;

      expect(recommendActivity(input)).toEqual(recommendActivity(input));
    });

    it('still respects activityHours after applying the today filter', () => {
      const childRules = getActivityRules('child_walk');
      const result = recommendActivity({
        weather: [
          idealChildWalkHour('2026-10-07T05:00'),
          idealChildWalkHour('2026-10-07T07:00'),
          idealChildWalkHour('2026-10-07T08:00'),
          idealChildWalkHour('2026-10-07T09:00'),
          idealChildWalkHour('2026-10-07T21:00'),
        ],
        rules: childRules,
        selectedDate,
        locationLocalNow: { date: selectedDate, hour: 5, minute: 30 },
      });

      expect(result.recommendation).not.toBeNull();
      for (const period of result.recommendation!.periods) {
        const hour = hourFromTimestamp(period.weather.timestamp);
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThan(21);
      }
    });
  });
});

