import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import {
  analyzeHourlyWeather,
  classifyPercentage,
} from '@/features/recommendation/domain/hourly-analysis';
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

/** Weather that scores ideally for running (all factor scores = 3). */
function idealRunningWeather(
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  return createWeather({
    temperature: 20,
    precipitationProbability: 5,
    windSpeed: 10,
    windGust: 15,
    weatherCode: 1,
    ...overrides,
  });
}

describe('classifyPercentage', () => {
  it('classifies continuous boundaries with half-open upper bands', () => {
    expect(classifyPercentage(100)).toBe('IDEAL');
    expect(classifyPercentage(75)).toBe('IDEAL');
    expect(classifyPercentage(74.999)).toBe('ACCEPTABLE');
    expect(classifyPercentage(55)).toBe('ACCEPTABLE');
    expect(classifyPercentage(54.999)).toBe('UNFAVORABLE');
    expect(classifyPercentage(35)).toBe('UNFAVORABLE');
    expect(classifyPercentage(34.999)).toBe('INADEQUATE');
    expect(classifyPercentage(0)).toBe('INADEQUATE');
  });
});

describe('analyzeHourlyWeather', () => {
  describe('insufficient data', () => {
    it('returns null when required temperature is missing', () => {
      const rules = getActivityRules('running');
      expect(
        analyzeHourlyWeather(rules, idealRunningWeather({ temperature: null })),
      ).toBeNull();
    });

    it('returns null when weatherCode is missing (storm blocking)', () => {
      const rules = getActivityRules('running');
      expect(
        analyzeHourlyWeather(rules, idealRunningWeather({ weatherCode: null })),
      ).toBeNull();
    });

    it('returns null when windGust is missing for running', () => {
      const rules = getActivityRules('running');
      expect(
        analyzeHourlyWeather(rules, idealRunningWeather({ windGust: null })),
      ).toBeNull();
    });

    it('returns null when uvIndex is missing for pet_walk', () => {
      const rules = getActivityRules('pet_walk');
      expect(
        analyzeHourlyWeather(
          rules,
          createWeather({
            temperature: 20,
            apparentTemperature: 21,
            precipitationProbability: 10,
            precipitation: 0,
            windSpeed: 10,
            uvIndex: null,
            weatherCode: 1,
          }),
        ),
      ).toBeNull();
    });

    it('returns null when precipitation is missing for picnic (significant rain)', () => {
      const rules = getActivityRules('picnic');
      expect(
        analyzeHourlyWeather(
          rules,
          createWeather({
            temperature: 22,
            precipitationProbability: 5,
            precipitation: null,
            windSpeed: 8,
            windGust: 12,
            weatherCode: 1,
          }),
        ),
      ).toBeNull();
    });

    it('still analyzes when only contextual daylight is missing', () => {
      const rules = getActivityRules('running');
      const result = analyzeHourlyWeather(
        rules,
        idealRunningWeather({ isDaylight: null }),
      );

      expect(result).not.toBeNull();
      expect(result?.blocked).toBe(false);
    });
  });

  describe('weighted score and percentage', () => {
    it('yields 100% when all running factor scores are 3', () => {
      const result = analyzeHourlyWeather(
        getActivityRules('running'),
        idealRunningWeather(),
      );

      expect(result).toMatchObject({
        score: 3,
        percentage: 100,
        status: 'IDEAL',
        blocked: false,
        blockingReasons: [],
        factors: {
          temperature: 3,
          precipitation: 3,
          wind: 3,
          gust: 3,
        },
      });
      expect(result?.factors).not.toHaveProperty('uv');
    });

    it('yields 0% when all running factor scores are 0', () => {
      const result = analyzeHourlyWeather(
        getActivityRules('running'),
        createWeather({
          temperature: 40,
          precipitationProbability: 80,
          windSpeed: 40,
          windGust: 50,
          weatherCode: 1,
        }),
      );

      // gust 50 also triggers gust_above blocking → INADEQUATE regardless
      expect(result?.score).toBe(0);
      expect(result?.percentage).toBe(0);
      expect(result?.factors).toEqual({
        temperature: 0,
        precipitation: 0,
        wind: 0,
        gust: 0,
      });
    });

    it('weights higher-weight factors more heavily', () => {
      const rules = getActivityRules('running');
      // temperatures:4, precip:3, wind:2, gust:1 — all 3 except temperature 0
      const cold = analyzeHourlyWeather(
        rules,
        createWeather({
          temperature: 5,
          precipitationProbability: 5,
          windSpeed: 10,
          windGust: 15,
          weatherCode: 1,
        }),
      );
      // all 3 except precipitation 0
      const rainy = analyzeHourlyWeather(
        rules,
        createWeather({
          temperature: 20,
          precipitationProbability: 70,
          windSpeed: 10,
          windGust: 15,
          weatherCode: 1,
        }),
      );

      expect(cold?.factors.temperature).toBe(0);
      expect(rainy?.factors.precipitation).toBe(0);
      // Same zero-score factor but temperature weighs more → cold percentage lower
      expect(cold!.percentage).toBeLessThan(rainy!.percentage);
      expect(cold!.score).toBeCloseTo((0 * 4 + 3 * 3 + 3 * 2 + 3 * 1) / 10);
      expect(rainy!.score).toBeCloseTo((3 * 4 + 0 * 3 + 3 * 2 + 3 * 1) / 10);
    });

    it('does not round percentage to an integer', () => {
      const rules = getActivityRules('running');
      // temperature score 1 (weight 4), others 3 → 2.2/3*100 = 73.333...
      const result = analyzeHourlyWeather(
        rules,
        createWeather({
          temperature: 10,
          precipitationProbability: 5,
          windSpeed: 10,
          windGust: 15,
          weatherCode: 1,
        }),
      );

      expect(result).not.toBeNull();
      expect(result!.score).toBeCloseTo(2.2);
      expect(result!.percentage).toBeCloseTo((2.2 / 3) * 100);
      expect(result!.percentage).not.toBe(Math.round(result!.percentage));
    });
  });

  describe('blocking priority', () => {
    it('keeps score/percentage but forces INADEQUATE on storm', () => {
      const result = analyzeHourlyWeather(
        getActivityRules('running'),
        idealRunningWeather({ weatherCode: 95 }),
      );

      expect(result).toMatchObject({
        score: 3,
        percentage: 100,
        status: 'INADEQUATE',
        blocked: true,
        blockingReasons: ['storm'],
      });
    });

    it('forces INADEQUATE when gust exceeds 45 even with strong score', () => {
      const result = analyzeHourlyWeather(
        getActivityRules('running'),
        idealRunningWeather({
          // Keep other factors ideal; gust >45 blocks and also scores 0
          windGust: 46,
        }),
      );

      expect(result?.blocked).toBe(true);
      expect(result?.blockingReasons).toEqual(['gust_above']);
      expect(result?.status).toBe('INADEQUATE');
      expect(result?.factors.gust).toBe(0);
    });

    it('uses score-only status when nothing blocks', () => {
      const result = analyzeHourlyWeather(
        getActivityRules('running'),
        idealRunningWeather(),
      );

      expect(result?.blocked).toBe(false);
      expect(result?.status).toBe('IDEAL');
    });
  });

  describe('activity factor sets', () => {
    it('includes UV only for pet_walk and child_walk', () => {
      const pet = analyzeHourlyWeather(
        getActivityRules('pet_walk'),
        createWeather({
          temperature: 20,
          apparentTemperature: 21,
          precipitationProbability: 10,
          precipitation: 0,
          windSpeed: 10,
          uvIndex: 2,
          weatherCode: 1,
          windGust: null,
        }),
      );
      const child = analyzeHourlyWeather(
        getActivityRules('child_walk'),
        createWeather({
          temperature: 20,
          precipitationProbability: 10,
          precipitation: 0,
          windSpeed: 10,
          uvIndex: 2,
          weatherCode: 1,
          windGust: null,
        }),
      );
      const beach = analyzeHourlyWeather(
        getActivityRules('beach'),
        createWeather({
          temperature: 26,
          precipitationProbability: 5,
          precipitation: 0,
          windSpeed: 10,
          weatherCode: 1,
          windGust: null,
          uvIndex: null,
        }),
      );

      expect(pet?.factors).toEqual({
        temperature: 3,
        precipitation: 3,
        wind: 3,
        uv: 3,
      });
      expect(child?.factors).toHaveProperty('uv');
      expect(beach?.factors).not.toHaveProperty('uv');
      expect(beach?.factors).not.toHaveProperty('gust');
    });

    it('never includes daylight in factors', () => {
      for (const activityId of [
        'running',
        'pet_walk',
        'child_walk',
        'beach',
        'surfing',
        'picnic',
      ] as const) {
        const rules = getActivityRules(activityId);
        const weather = createWeather({
          temperature: 22,
          apparentTemperature: 22,
          precipitationProbability: 5,
          precipitation: 0,
          windSpeed: 12,
          windGust: 18,
          uvIndex: 3,
          weatherCode: 1,
          isDaylight: true,
        });
        const result = analyzeHourlyWeather(rules, weather);
        expect(result).not.toBeNull();
        expect(Object.keys(result!.factors)).not.toContain('isDaylight');
        expect(Object.keys(result!.factors)).not.toContain('daylight');
      }
    });

    it('includes gust in factors only when weighted (surfing yes, beach no)', () => {
      const surfing = analyzeHourlyWeather(
        getActivityRules('surfing'),
        createWeather({
          temperature: 22,
          precipitationProbability: 20,
          windSpeed: 15,
          windGust: 20,
          weatherCode: 1,
        }),
      );
      const beach = analyzeHourlyWeather(
        getActivityRules('beach'),
        createWeather({
          temperature: 26,
          precipitationProbability: 5,
          precipitation: 0,
          windSpeed: 10,
          weatherCode: 1,
          windGust: null,
        }),
      );

      expect(surfing?.factors).toHaveProperty('gust');
      expect(beach?.factors).not.toHaveProperty('gust');
    });

    it('preserves the original weather reference including timestamp', () => {
      const weather = idealRunningWeather({ timestamp: '2026-10-06T07:00:00' });
      const result = analyzeHourlyWeather(getActivityRules('running'), weather);

      expect(result?.weather).toBe(weather);
      expect(result?.weather.timestamp).toBe('2026-10-06T07:00:00');
    });
  });
});
