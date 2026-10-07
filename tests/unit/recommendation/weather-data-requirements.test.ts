import { ACTIVITY_IDS, type ActivityId } from '@/features/activity/domain/activities';
import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import type { WeatherDataField } from '@/features/recommendation/domain/types';
import {
  getWeatherDataRequirements,
  isWeatherDataSufficient,
  listMissingRequiredWeatherFields,
  listRequiredWeatherFields,
} from '@/features/recommendation/domain/weather-data-requirements';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

/** Validated Part B matrix: required score/blocking fields + contextual daylight. */
const EXPECTED_REQUIREMENTS: Readonly<
  Record<
    ActivityId,
    Readonly<{
      required: readonly WeatherDataField[];
      contextual: readonly WeatherDataField[];
    }>
  >
> = {
  running: {
    required: [
      'temperature',
      'precipitationProbability',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: ['isDaylight'],
  },
  skateboarding: {
    required: [
      'temperature',
      'precipitationProbability',
      'precipitation',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: [],
  },
  cycling: {
    required: [
      'temperature',
      'precipitationProbability',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: ['isDaylight'],
  },
  walking: {
    required: [
      'temperature',
      'precipitationProbability',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: ['isDaylight'],
  },
  pet_walk: {
    required: [
      'temperature',
      'apparentTemperature',
      'precipitationProbability',
      'precipitation',
      'windSpeed',
      'uvIndex',
      'weatherCode',
    ],
    contextual: [],
  },
  child_walk: {
    required: [
      'temperature',
      'precipitationProbability',
      'precipitation',
      'windSpeed',
      'uvIndex',
      'weatherCode',
    ],
    contextual: [],
  },
  beach: {
    required: [
      'temperature',
      'precipitationProbability',
      'precipitation',
      'windSpeed',
      'weatherCode',
    ],
    contextual: ['isDaylight'],
  },
  surfing: {
    required: [
      'temperature',
      'precipitationProbability',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: [],
  },
  picnic: {
    required: [
      'temperature',
      'precipitationProbability',
      'precipitation',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: ['isDaylight'],
  },
  kite: {
    required: [
      'temperature',
      'precipitationProbability',
      'precipitation',
      'windSpeed',
      'windGust',
      'weatherCode',
    ],
    contextual: ['isDaylight'],
  },
};

function sorted(fields: readonly WeatherDataField[]): WeatherDataField[] {
  return [...fields].sort();
}

function createCompleteWeather(
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
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

function createWeatherForActivity(
  activityId: ActivityId,
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  const required = new Set(EXPECTED_REQUIREMENTS[activityId].required);
  const base = createCompleteWeather();

  return {
    ...base,
    apparentTemperature: required.has('apparentTemperature')
      ? base.apparentTemperature
      : null,
    precipitation: required.has('precipitation') ? base.precipitation : null,
    windGust: required.has('windGust') ? base.windGust : null,
    uvIndex: required.has('uvIndex') ? base.uvIndex : null,
    isDaylight: EXPECTED_REQUIREMENTS[activityId].contextual.includes('isDaylight')
      ? base.isDaylight
      : null,
    ...overrides,
  };
}

describe('weather data requirements', () => {
  describe('validated matrix per activity', () => {
    it.each(ACTIVITY_IDS)(
      'derives the documented required and contextual fields for %s',
      (activityId) => {
        const rules = getActivityRules(activityId);
        const requirements = getWeatherDataRequirements(rules);
        const expected = EXPECTED_REQUIREMENTS[activityId];

        expect(sorted(listRequiredWeatherFields(rules))).toEqual(
          sorted(expected.required),
        );
        expect(sorted(requirements.contextual)).toEqual(sorted(expected.contextual));
      },
    );
  });

  describe('isWeatherDataSufficient', () => {
    it.each(ACTIVITY_IDS)(
      'accepts a complete observation for %s',
      (activityId) => {
        const rules = getActivityRules(activityId);
        expect(
          isWeatherDataSufficient(rules, createWeatherForActivity(activityId)),
        ).toBe(true);
      },
    );

    it('rejects missing score data (temperature)', () => {
      const rules = getActivityRules('running');
      expect(
        isWeatherDataSufficient(
          rules,
          createWeatherForActivity('running', { temperature: null }),
        ),
      ).toBe(false);
      expect(
        listMissingRequiredWeatherFields(
          rules,
          createWeatherForActivity('running', { temperature: null }),
        ),
      ).toContain('temperature');
    });

    it('rejects missing blocking data (weatherCode) for every activity', () => {
      for (const activityId of ACTIVITY_IDS) {
        const rules = getActivityRules(activityId);
        expect(
          isWeatherDataSufficient(
            rules,
            createWeatherForActivity(activityId, { weatherCode: null }),
          ),
        ).toBe(false);
      }
    });

    it('treats null values as missing, not favorable', () => {
      const rules = getActivityRules('cycling');
      const weather = createWeatherForActivity('cycling', {
        windSpeed: null,
        windGust: null,
      });

      expect(isWeatherDataSufficient(rules, weather)).toBe(false);
      expect(listMissingRequiredWeatherFields(rules, weather)).toEqual(
        expect.arrayContaining(['windSpeed', 'windGust']),
      );
    });

    it('requires windGust for picnic even though gust is not a score factor', () => {
      const rules = getActivityRules('picnic');
      const requirements = getWeatherDataRequirements(rules);

      expect(requirements.score).not.toContain('windGust');
      expect(requirements.blocking).toContain('windGust');
      expect(listRequiredWeatherFields(rules)).toContain('windGust');

      expect(
        isWeatherDataSufficient(
          rules,
          createWeatherForActivity('picnic', { windGust: null }),
        ),
      ).toBe(false);
    });

    it('requires apparentTemperature only for pet_walk blocking', () => {
      const petRules = getActivityRules('pet_walk');
      const runningRules = getActivityRules('running');

      expect(getWeatherDataRequirements(petRules).blocking).toContain(
        'apparentTemperature',
      );
      expect(listRequiredWeatherFields(runningRules)).not.toContain(
        'apparentTemperature',
      );

      expect(
        isWeatherDataSufficient(
          petRules,
          createWeatherForActivity('pet_walk', { apparentTemperature: null }),
        ),
      ).toBe(false);

      expect(
        isWeatherDataSufficient(
          runningRules,
          createWeatherForActivity('running', { apparentTemperature: null }),
        ),
      ).toBe(true);
    });

    it('requires precipitation for pet_walk because significant rain can block', () => {
      const rules = getActivityRules('pet_walk');
      expect(getWeatherDataRequirements(rules).blocking).toEqual(
        expect.arrayContaining(['precipitationProbability', 'precipitation']),
      );
      expect(
        isWeatherDataSufficient(
          rules,
          createWeatherForActivity('pet_walk', { precipitation: null }),
        ),
      ).toBe(false);
    });

    it('does not require uvIndex for activities without UV scoring', () => {
      const running = getActivityRules('running');
      const beach = getActivityRules('beach');

      expect(listRequiredWeatherFields(running)).not.toContain('uvIndex');
      expect(listRequiredWeatherFields(beach)).not.toContain('uvIndex');
      expect(
        isWeatherDataSufficient(
          running,
          createWeatherForActivity('running', { uvIndex: null }),
        ),
      ).toBe(true);
    });

    it('requires uvIndex for pet_walk and child_walk', () => {
      for (const activityId of ['pet_walk', 'child_walk'] as const) {
        const rules = getActivityRules(activityId);
        expect(getWeatherDataRequirements(rules).score).toContain('uvIndex');
        expect(
          isWeatherDataSufficient(
            rules,
            createWeatherForActivity(activityId, { uvIndex: null }),
          ),
        ).toBe(false);
      }
    });

    it('does not invalidate a period when contextual daylight is missing', () => {
      const daylightActivities = ACTIVITY_IDS.filter(
        (id) => EXPECTED_REQUIREMENTS[id].contextual.includes('isDaylight'),
      );

      expect(daylightActivities.length).toBeGreaterThan(0);

      for (const activityId of daylightActivities) {
        const rules = getActivityRules(activityId);
        expect(getWeatherDataRequirements(rules).contextual).toEqual(['isDaylight']);
        expect(
          isWeatherDataSufficient(
            rules,
            createWeatherForActivity(activityId, { isDaylight: null }),
          ),
        ).toBe(true);
      }
    });

    it('accepts isDaylight false as present contextual data (still sufficient)', () => {
      const rules = getActivityRules('running');
      expect(
        isWeatherDataSufficient(
          rules,
          createWeatherForActivity('running', { isDaylight: false }),
        ),
      ).toBe(true);
    });

    it('keeps precipitation optional when significant rain is not a blocking rule', () => {
      const withoutSignificantRain = ACTIVITY_IDS.filter(
        (id) => !EXPECTED_REQUIREMENTS[id].required.includes('precipitation'),
      );

      expect(withoutSignificantRain).toEqual(
        expect.arrayContaining(['running', 'cycling', 'walking', 'surfing']),
      );

      for (const activityId of withoutSignificantRain) {
        const rules = getActivityRules(activityId);
        expect(listRequiredWeatherFields(rules)).not.toContain('precipitation');
        expect(
          isWeatherDataSufficient(
            rules,
            createWeatherForActivity(activityId, { precipitation: null }),
          ),
        ).toBe(true);
      }
    });

    it('separates score fields from blocking fields for running', () => {
      const requirements = getWeatherDataRequirements(getActivityRules('running'));

      expect(sorted(requirements.score)).toEqual(
        sorted(['temperature', 'precipitationProbability', 'windSpeed', 'windGust']),
      );
      expect(sorted(requirements.blocking)).toEqual(
        sorted(['weatherCode', 'windGust']),
      );
      expect(requirements.contextual).toEqual(['isDaylight']);
    });
  });
});
