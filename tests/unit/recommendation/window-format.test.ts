import type { RecommendationWindow } from '@/features/recommendation/domain/types';
import {
  buildWhyThisWindowBody,
  buildWindowHeadline,
  formatLocalClockTime,
  formatWindowDurationLabel,
  formatWindowRangeLabel,
  formatWindowScorePercent,
  getDayPeriodLabel,
  getWindowQualityLabel,
  summarizeWindowWeather,
} from '@/features/recommendation/presentation/window-format';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  return {
    timestamp: '2026-10-07T17:00',
    temperature: 21,
    apparentTemperature: 21,
    precipitationProbability: 8,
    precipitation: 0,
    windSpeed: 9,
    windGust: 12,
    uvIndex: 3,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  };
}

function createWindow(
  overrides: Partial<RecommendationWindow> = {},
): RecommendationWindow {
  return {
    startTimestamp: '2026-10-07T17:00',
    endTimestamp: '2026-10-07T19:00',
    durationHours: 2,
    averageScore: 2.5,
    averagePercentage: 83.3,
    minimumScore: 2,
    periods: [
      {
        weather: createWeather({ timestamp: '2026-10-07T17:00', temperature: 21 }),
        score: 2.5,
        percentage: 83,
        status: 'ACCEPTABLE',
        factors: {},
        blocked: false,
        blockingReasons: [],
      },
      {
        weather: createWeather({
          timestamp: '2026-10-07T18:00',
          temperature: 20,
          precipitationProbability: 10,
          windSpeed: 11,
        }),
        score: 2.5,
        percentage: 83,
        status: 'ACCEPTABLE',
        factors: {},
        blocked: false,
        blockingReasons: [],
      },
    ],
    ...overrides,
  };
}

describe('window presentation formatters', () => {
  it('formats local clock times without timezone conversion', () => {
    expect(formatLocalClockTime('2026-10-07T17:00')).toBe('17:00');
    expect(formatWindowRangeLabel(createWindow())).toBe('17:00 – 19:00');
  });

  it('formats duration and rounded score percent', () => {
    expect(formatWindowDurationLabel(createWindow())).toBe('2 horas');
    expect(formatWindowDurationLabel(createWindow({ durationHours: 1 }))).toBe(
      '1 hora',
    );
    expect(formatWindowScorePercent(createWindow())).toBe('83%');
  });

  it('summarizes weather only from available period values', () => {
    const summary = summarizeWindowWeather(createWindow());

    expect(summary.temperatureLabel).toBe('21°');
    expect(summary.precipitationLabel).toBe('9%');
    expect(summary.windLabel).toBe('10 km/h');
  });

  it('returns null weather labels when values are missing', () => {
    const summary = summarizeWindowWeather(
      createWindow({
        periods: [
          {
            weather: createWeather({
              temperature: null,
              precipitationProbability: null,
              windSpeed: null,
            }),
            score: 1,
            percentage: 40,
            status: 'UNFAVORABLE',
            factors: {},
            blocked: false,
            blockingReasons: [],
          },
        ],
      }),
    );

    expect(summary.temperatureLabel).toBeNull();
    expect(summary.precipitationLabel).toBeNull();
    expect(summary.windLabel).toBeNull();
  });

  it('maps quality labels and day periods from the prototype bands', () => {
    expect(getWindowQualityLabel(92)).toBe('Excelente');
    expect(getWindowQualityLabel(60)).toBe('Bom');
    expect(getWindowQualityLabel(40)).toBe('Menos favorável');
    expect(getDayPeriodLabel('2026-10-07T17:30')).toBe('Fim de tarde');
  });

  it('builds prototype-style headline and weather-grounded why body', () => {
    expect(buildWindowHeadline(createWindow())).toBe(
      'Tempo fresco, seco e com vento leve.',
    );

    const why = buildWhyThisWindowBody(
      createWindow(),
      {
        positiveFactors: ['temperature', 'precipitation', 'wind'],
        neutralFactors: [],
        negativeFactors: [],
      },
      'Corrida',
    );

    expect(why).toContain('temperatura cai');
    expect(why).toContain('21°');
    expect(why).toContain('sem previsão relevante de chuva');
    expect(why).toContain('10 km/h');
    expect(why).toContain('corrida');
    expect(why).not.toContain('combinação favorável');
  });

  it('mentions real caveats when negative factors exist', () => {
    const why = buildWhyThisWindowBody(
      createWindow({
        periods: [
          {
            weather: createWeather({
              temperature: 29,
              precipitationProbability: 45,
              windSpeed: 22,
            }),
            score: 1.2,
            percentage: 40,
            status: 'UNFAVORABLE',
            factors: {},
            blocked: false,
            blockingReasons: [],
          },
        ],
      }),
      {
        positiveFactors: [],
        neutralFactors: [],
        negativeFactors: ['precipitation', 'wind'],
      },
      null,
    );

    expect(why).toContain('Atenção:');
    expect(why).toContain('45%');
    expect(why).toContain('22 km/h');
  });
});
