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
});
