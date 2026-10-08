import {
  extractWallClockHour,
  isWithinActivityHours,
} from '@/features/recommendation/domain/activity-hours';
import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import { evaluateBlockingConditions } from '@/features/recommendation/domain/blocking-conditions';
import {
  CHILD_WALK_ACTIVITY_HOURS,
  DEFAULT_OUTDOOR_ACTIVITY_HOURS,
} from '@/features/recommendation/domain/recommendation-config';
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
    uvIndex: 2,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  };
}

describe('extractWallClockHour', () => {
  it('reads the ISO local-time hour component', () => {
    expect(extractWallClockHour('2026-10-09T00:00:00')).toBe(0);
    expect(extractWallClockHour('2026-10-09T05:00:00')).toBe(5);
    expect(extractWallClockHour('2026-10-09T21:30:00')).toBe(21);
  });
});

describe('isWithinActivityHours — default outdoor 05–22', () => {
  const hours = DEFAULT_OUTDOOR_ACTIVITY_HOURS;

  it('allows 05:00, 12:00 and 21:00', () => {
    expect(isWithinActivityHours(hours, '2026-10-09T05:00:00')).toBe(true);
    expect(isWithinActivityHours(hours, '2026-10-09T12:00:00')).toBe(true);
    expect(isWithinActivityHours(hours, '2026-10-09T21:00:00')).toBe(true);
  });

  it('rejects 22:00 and 02:00', () => {
    expect(isWithinActivityHours(hours, '2026-10-09T22:00:00')).toBe(false);
    expect(isWithinActivityHours(hours, '2026-10-09T02:00:00')).toBe(false);
  });
});

describe('isWithinActivityHours — child_walk 06–21', () => {
  const hours = CHILD_WALK_ACTIVITY_HOURS;

  it('allows 06:00 and 20:00', () => {
    expect(isWithinActivityHours(hours, '2026-10-09T06:00:00')).toBe(true);
    expect(isWithinActivityHours(hours, '2026-10-09T20:00:00')).toBe(true);
  });

  it('rejects 21:00 and 02:00', () => {
    expect(isWithinActivityHours(hours, '2026-10-09T21:00:00')).toBe(false);
    expect(isWithinActivityHours(hours, '2026-10-09T02:00:00')).toBe(false);
  });
});

describe('evaluateBlockingConditions — activity hours', () => {
  it('marks hours outside the activity range as outside_activity_hours', () => {
    const rules = getActivityRules('running');
    const result = evaluateBlockingConditions(
      rules,
      createWeather('2026-10-09T02:00:00'),
    );

    expect(result.blocked).toBe(true);
    expect(result.reasons).toContain('outside_activity_hours');
  });

  it('does not add outside_activity_hours inside the allowed range', () => {
    const rules = getActivityRules('running');
    const result = evaluateBlockingConditions(
      rules,
      createWeather('2026-10-09T10:00:00'),
    );

    expect(result.reasons).not.toContain('outside_activity_hours');
  });

  it('blocks child_walk at 21:00 even with good weather', () => {
    const rules = getActivityRules('child_walk');
    const result = evaluateBlockingConditions(
      rules,
      createWeather('2026-10-09T21:00:00'),
    );

    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual(['outside_activity_hours']);
  });
});
