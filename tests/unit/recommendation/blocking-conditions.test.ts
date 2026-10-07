import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import {
  evaluateBlockingCondition,
  evaluateBlockingConditions,
} from '@/features/recommendation/domain/blocking-conditions';
import { GUST_BLOCKING_THRESHOLD_KM_H } from '@/features/recommendation/domain/recommendation-config';
import type { ActivityRules, BlockingCondition } from '@/features/recommendation/domain/types';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    timestamp: '2026-10-06T10:00:00',
    temperature: 22,
    apparentTemperature: 23,
    precipitationProbability: 10,
    precipitation: 0,
    windSpeed: 12,
    windGust: 18,
    uvIndex: 4,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  };
}

describe('evaluateBlockingCondition — significant_rain', () => {
  const condition: BlockingCondition = { type: 'significant_rain' };

  it('is false just below probability threshold with no amount', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ precipitationProbability: 59.999, precipitation: 0 }),
      ),
    ).toBe(false);
  });

  it('is true at probability threshold', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ precipitationProbability: 60, precipitation: 0 }),
      ),
    ).toBe(true);
  });

  it('is true from high probability even when precipitation amount is null', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ precipitationProbability: 80, precipitation: null }),
      ),
    ).toBe(true);
  });

  it('is false when only amount is present and below threshold', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ precipitationProbability: null, precipitation: 1.999 }),
      ),
    ).toBe(false);
  });

  it('is true when only amount meets the mm/h threshold', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ precipitationProbability: null, precipitation: 2 }),
      ),
    ).toBe(true);
  });

  it('is null when both precipitation inputs are missing', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ precipitationProbability: null, precipitation: null }),
      ),
    ).toBeNull();
  });
});

describe('evaluateBlockingCondition — storm', () => {
  const condition: BlockingCondition = { type: 'storm' };

  it.each([
    [94, false],
    [95, true],
    [96, true],
    [97, true],
    [98, false],
    [99, true],
  ] as const)('weatherCode %s => %s', (weatherCode, expected) => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ weatherCode })),
    ).toBe(expected);
  });

  it('is null when weatherCode is missing', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ weatherCode: null })),
    ).toBeNull();
  });
});

describe('evaluateBlockingCondition — gust_above', () => {
  const condition: BlockingCondition = {
    type: 'gust_above',
    thresholdKmH: GUST_BLOCKING_THRESHOLD_KM_H,
  };

  it('does not block at exactly the threshold (strict >)', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ windGust: 45 })),
    ).toBe(false);
  });

  it('blocks immediately above the threshold', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ windGust: 45.0001 })),
    ).toBe(true);
    expect(
      evaluateBlockingCondition(condition, createWeather({ windGust: 50 })),
    ).toBe(true);
  });

  it('is null when windGust is missing', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ windGust: null })),
    ).toBeNull();
  });
});

describe('evaluateBlockingCondition — apparent_temperature_above', () => {
  const condition: BlockingCondition = {
    type: 'apparent_temperature_above',
    thresholdCelsius: 32,
  };

  it('does not block at exactly the threshold', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ apparentTemperature: 32 }),
      ),
    ).toBe(false);
  });

  it('blocks above the threshold', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ apparentTemperature: 32.0001 }),
      ),
    ).toBe(true);
  });

  it('is null when apparentTemperature is missing', () => {
    expect(
      evaluateBlockingCondition(
        condition,
        createWeather({ apparentTemperature: null }),
      ),
    ).toBeNull();
  });
});

describe('evaluateBlockingCondition — temperature_above', () => {
  const condition: BlockingCondition = {
    type: 'temperature_above',
    thresholdCelsius: 33,
  };

  it('does not block at exactly the threshold', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ temperature: 33 })),
    ).toBe(false);
  });

  it('blocks above the threshold', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ temperature: 33.0001 })),
    ).toBe(true);
  });

  it('is null when temperature is missing', () => {
    expect(
      evaluateBlockingCondition(condition, createWeather({ temperature: null })),
    ).toBeNull();
  });
});

describe('evaluateBlockingConditions', () => {
  it('returns not blocked when no condition is true (running, calm weather)', () => {
    const rules = getActivityRules('running');
    const result = evaluateBlockingConditions(rules, createWeather());

    expect(result).toEqual({ blocked: false, reasons: [] });
  });

  it('blocks with a single true condition (storm)', () => {
    const rules = getActivityRules('running');
    const result = evaluateBlockingConditions(
      rules,
      createWeather({ weatherCode: 95 }),
    );

    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual(['storm']);
  });

  it('collects multiple true conditions in declaration order (picnic)', () => {
    const rules = getActivityRules('picnic');
    expect(rules.blockingConditions.map((c) => c.type)).toEqual([
      'significant_rain',
      'storm',
      'gust_above',
    ]);

    const result = evaluateBlockingConditions(
      rules,
      createWeather({
        precipitationProbability: 70,
        weatherCode: 97,
        windGust: 50,
      }),
    );

    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual(['significant_rain', 'storm', 'gust_above']);
  });

  it('omits unevaluable conditions from reasons without inventing a block', () => {
    const rules = getActivityRules('running');
    const result = evaluateBlockingConditions(
      rules,
      createWeather({ weatherCode: null, windGust: null }),
    );

    expect(result).toEqual({ blocked: false, reasons: [] });
  });

  it('includes only conditions that evaluated to true', () => {
    const rules = getActivityRules('picnic');
    const result = evaluateBlockingConditions(
      rules,
      createWeather({
        precipitationProbability: 10,
        precipitation: 0,
        weatherCode: 95,
        windGust: 20,
      }),
    );

    expect(result.reasons).toEqual(['storm']);
    expect(result.reasons).not.toContain('significant_rain');
    expect(result.reasons).not.toContain('gust_above');
  });

  it('does not duplicate reasons', () => {
    const rules = getActivityRules('beach');
    const result = evaluateBlockingConditions(
      rules,
      createWeather({ precipitationProbability: 80, weatherCode: 99 }),
    );

    expect(result.reasons).toEqual(['significant_rain', 'storm']);
    expect(new Set(result.reasons).size).toBe(result.reasons.length);
  });

  it('deduplicates the same BlockingConditionType when listed more than once', () => {
    const base = getActivityRules('running');
    const rulesWithDuplicateStorm: ActivityRules = {
      ...base,
      blockingConditions: [{ type: 'storm' }, { type: 'storm' }],
    };

    const result = evaluateBlockingConditions(
      rulesWithDuplicateStorm,
      createWeather({ weatherCode: 95 }),
    );

    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual(['storm']);
  });

  it('returns not blocked when ActivityRules has no blocking conditions', () => {
    const base = getActivityRules('running');
    const rulesWithoutBlocking: ActivityRules = {
      ...base,
      blockingConditions: [],
    };

    const result = evaluateBlockingConditions(
      rulesWithoutBlocking,
      createWeather({ weatherCode: 95, windGust: 80 }),
    );

    expect(result).toEqual({ blocked: false, reasons: [] });
  });

  it('uses pet_walk apparent_temperature_above from ActivityRules', () => {
    const rules = getActivityRules('pet_walk');
    expect(
      rules.blockingConditions.some((c) => c.type === 'apparent_temperature_above'),
    ).toBe(true);

    expect(
      evaluateBlockingConditions(
        rules,
        createWeather({
          apparentTemperature: 32,
          precipitationProbability: 10,
          precipitation: 0,
          weatherCode: 1,
        }),
      ).blocked,
    ).toBe(false);

    expect(
      evaluateBlockingConditions(
        rules,
        createWeather({
          apparentTemperature: 32.1,
          precipitationProbability: 10,
          precipitation: 0,
          weatherCode: 1,
        }),
      ).reasons,
    ).toEqual(['apparent_temperature_above']);
  });

  it('uses child_walk temperature_above from ActivityRules', () => {
    const rules = getActivityRules('child_walk');

    expect(
      evaluateBlockingConditions(
        rules,
        createWeather({
          temperature: 33,
          precipitationProbability: 10,
          precipitation: 0,
          weatherCode: 1,
        }),
      ).blocked,
    ).toBe(false);

    expect(
      evaluateBlockingConditions(
        rules,
        createWeather({
          temperature: 33.1,
          precipitationProbability: 10,
          precipitation: 0,
          weatherCode: 1,
        }),
      ).reasons,
    ).toEqual(['temperature_above']);
  });
});
