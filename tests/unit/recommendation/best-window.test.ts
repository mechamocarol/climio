import { isDaytimeWindow, selectBestWindow } from '@/features/recommendation/domain/best-window';
import type {
  AnalyzedPeriod,
  PeriodStatus,
  RecommendationWindow,
} from '@/features/recommendation/domain/types';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

function createWeather(
  timestamp: string,
  isDaylight: boolean | null = true,
): HourlyWeather {
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
    isDaylight,
  };
}

function createPeriod(input: {
  timestamp: string;
  status?: PeriodStatus;
  score?: number;
  percentage?: number;
  isDaylight?: boolean | null;
}): AnalyzedPeriod {
  return {
    weather: createWeather(
      input.timestamp,
      Object.prototype.hasOwnProperty.call(input, 'isDaylight')
        ? (input.isDaylight as boolean | null)
        : true,
    ),
    score: input.score ?? 3,
    percentage: input.percentage ?? 100,
    status: input.status ?? 'IDEAL',
    factors: { temperature: 3, precipitation: 3, wind: 3 },
    blocked: false,
    blockingReasons: [],
  };
}

function createWindow(input: {
  startTimestamp: string;
  endTimestamp: string;
  durationHours: number;
  averageScore: number;
  averagePercentage: number;
  minimumScore: number;
  daylightFlags?: readonly (boolean | null)[];
  /** Applied to every period in the window (defaults to IDEAL). */
  status?: PeriodStatus;
}): RecommendationWindow {
  const flags = input.daylightFlags ?? Array.from({ length: input.durationHours }, () => true);
  const periods = flags.map((isDaylight, index) => {
    const hour = String(Number(input.startTimestamp.slice(11, 13)) + index).padStart(2, '0');
    const timestamp = `${input.startTimestamp.slice(0, 11)}${hour}:00:00`;
    return createPeriod({
      timestamp,
      score: input.averageScore,
      percentage: input.averagePercentage,
      status: input.status ?? 'IDEAL',
      isDaylight,
    });
  });

  return {
    startTimestamp: input.startTimestamp,
    endTimestamp: input.endTimestamp,
    durationHours: input.durationHours,
    averageScore: input.averageScore,
    averagePercentage: input.averagePercentage,
    minimumScore: input.minimumScore,
    periods,
  };
}

describe('isDaytimeWindow', () => {
  it('is true when a strict majority of known values are daylight', () => {
    const window = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T13:00:00',
      durationHours: 3,
      averageScore: 2.5,
      averagePercentage: 80,
      minimumScore: 2.4,
      daylightFlags: [true, true, false],
    });
    expect(isDaytimeWindow(window)).toBe(true);
  });

  it('is false when a strict majority of known values are not daylight', () => {
    const window = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T23:00:00',
      durationHours: 3,
      averageScore: 2.5,
      averagePercentage: 80,
      minimumScore: 2.4,
      daylightFlags: [false, false, true],
    });
    expect(isDaytimeWindow(window)).toBe(false);
  });

  it('is false on a true/false tie among known values', () => {
    const window = createWindow({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 80,
      minimumScore: 2.4,
      daylightFlags: [true, false],
    });
    expect(isDaytimeWindow(window)).toBe(false);
  });

  it('is false when every isDaylight value is null', () => {
    const window = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 80,
      minimumScore: 2.4,
      daylightFlags: [null, null],
    });
    expect(isDaytimeWindow(window)).toBe(false);
  });

  it('ignores null when computing majority among known values', () => {
    const window = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T13:00:00',
      durationHours: 3,
      averageScore: 2.5,
      averagePercentage: 80,
      minimumScore: 2.4,
      daylightFlags: [true, null, true],
    });
    expect(isDaytimeWindow(window)).toBe(true);
  });
});

describe('selectBestWindow', () => {
  it('returns null for an empty list', () => {
    expect(selectBestWindow([], false)).toBeNull();
  });

  it('selects the window with the highest averageScore among >=2h windows', () => {
    const lower = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.4,
      averagePercentage: 80,
      minimumScore: 2.3,
    });
    const higher = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.8,
      averagePercentage: 93,
      minimumScore: 2.5,
    });

    expect(selectBestWindow([lower, higher], false)).toBe(higher);
  });

  it('prefers any >=2h window over a 1h window with a higher score', () => {
    const twoHour = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.2,
      averagePercentage: 73,
      minimumScore: 2.0,
    });
    const oneHour = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 1,
      averageScore: 3,
      averagePercentage: 100,
      minimumScore: 3,
    });

    expect(selectBestWindow([oneHour, twoHour], false)).toBe(twoHour);
  });

  it('prefers a 2h window over a higher-scoring 1h ACCEPTABLE window', () => {
    const twoHour = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.0,
      averagePercentage: 67,
      minimumScore: 1.8,
      status: 'ACCEPTABLE',
    });
    const acceptableHour = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 1,
      averageScore: 2.2,
      averagePercentage: 70,
      minimumScore: 2.2,
      status: 'ACCEPTABLE',
    });

    expect(selectBestWindow([acceptableHour, twoHour], false)).toBe(twoHour);
  });

  it('uses minimumScore as a tie-breaker', () => {
    const lowerMin = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 83,
      minimumScore: 2.0,
    });
    const higherMin = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 83,
      minimumScore: 2.4,
    });

    expect(selectBestWindow([lowerMin, higherMin], false)).toBe(higherMin);
  });

  it('uses durationHours as a tie-breaker after minimumScore', () => {
    const shorter = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 83,
      minimumScore: 2.4,
    });
    const longer = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T17:00:00',
      durationHours: 3,
      averageScore: 2.5,
      averagePercentage: 83,
      minimumScore: 2.4,
    });

    expect(selectBestWindow([shorter, longer], false)).toBe(longer);
  });

  it('uses earlier startTimestamp as the final tie-breaker', () => {
    const later = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 83,
      minimumScore: 2.4,
    });
    const earlier = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.5,
      averagePercentage: 83,
      minimumScore: 2.4,
    });

    expect(selectBestWindow([later, earlier], false)).toBe(earlier);
  });

  it('is independent of input order', () => {
    const a = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.2,
      averagePercentage: 73,
      minimumScore: 2.0,
    });
    const b = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.8,
      averagePercentage: 93,
      minimumScore: 2.5,
    });

    expect(selectBestWindow([a, b], false)).toBe(b);
    expect(selectBestWindow([b, a], false)).toBe(b);
  });

  it('does not mutate the input array', () => {
    const a = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.8,
      averagePercentage: 93,
      minimumScore: 2.5,
    });
    const b = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.2,
      averagePercentage: 73,
      minimumScore: 2.0,
    });
    const input = [a, b];
    const snapshot = [...input];

    selectBestWindow(input, false);

    expect(input).toEqual(snapshot);
  });

  it('ignores isDaylight when prefersDaylight is false', () => {
    const nightBetter = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T22:00:00',
      durationHours: 2,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [false, false],
    });
    const dayWorse = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.5,
      daylightFlags: [true, true],
    });

    expect(selectBestWindow([dayWorse, nightBetter], false)).toBe(nightBetter);
  });

  it('can prefer a daytime window within the 5pp tolerance', () => {
    const night = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T22:00:00',
      durationHours: 2,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [false, false],
    });
    const day = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.5,
      daylightFlags: [true, true],
    });

    // |90 - 87| = 3 <= 5 → daylight wins despite slightly lower score
    expect(selectBestWindow([night, day], true)).toBe(day);
  });

  it('does not let daylight override a >5pp score advantage', () => {
    const nightBetter = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T22:00:00',
      durationHours: 2,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [false, false],
    });
    const dayWorse = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.4,
      averagePercentage: 80,
      minimumScore: 2.3,
      daylightFlags: [true, true],
    });

    // |90 - 80| = 10 > 5 → score wins
    expect(selectBestWindow([dayWorse, nightBetter], true)).toBe(nightBetter);
  });

  it('does not treat all-null isDaylight as daytime', () => {
    const unknown = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.5,
      daylightFlags: [null, null],
    });
    const night = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T22:00:00',
      durationHours: 2,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [false, false],
    });

    expect(isDaytimeWindow(unknown)).toBe(false);
    expect(selectBestWindow([unknown, night], true)).toBe(night);
  });

  it('falls back to the best IDEAL 1h window when no >=2h window exists', () => {
    const firstHour = createWindow({
      startTimestamp: '2026-10-06T09:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 1,
      averageScore: 2.4,
      averagePercentage: 80,
      minimumScore: 2.4,
      status: 'IDEAL',
    });
    const betterHour = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 1,
      averageScore: 2.9,
      averagePercentage: 96,
      minimumScore: 2.9,
      status: 'IDEAL',
    });

    expect(selectBestWindow([firstHour, betterHour], false)).toBe(betterHour);
  });

  it('does not fall back to ACCEPTABLE 1h windows when no >=2h window exists', () => {
    const acceptableMorning = createWindow({
      startTimestamp: '2026-10-06T09:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 1,
      averageScore: 2.0,
      averagePercentage: 67,
      minimumScore: 2.0,
      status: 'ACCEPTABLE',
    });
    const acceptableAfternoon = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 1,
      averageScore: 2.2,
      averagePercentage: 73,
      minimumScore: 2.2,
      status: 'ACCEPTABLE',
    });

    expect(
      selectBestWindow([acceptableMorning, acceptableAfternoon], false),
    ).toBeNull();
  });

  it('ignores ACCEPTABLE 1h when mixing with IDEAL 1h fallback candidates', () => {
    const acceptableHigherScore = createWindow({
      startTimestamp: '2026-10-06T09:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 1,
      averageScore: 2.2,
      averagePercentage: 73,
      minimumScore: 2.2,
      status: 'ACCEPTABLE',
    });
    const ideal = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 1,
      averageScore: 2.3,
      averagePercentage: 77,
      minimumScore: 2.3,
      status: 'IDEAL',
    });

    expect(
      selectBestWindow([acceptableHigherScore, ideal], false),
    ).toBe(ideal);
  });

  it('applies daylight preference among IDEAL 1h fallback candidates', () => {
    const nightIdeal = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T21:00:00',
      durationHours: 1,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.7,
      status: 'IDEAL',
      daylightFlags: [false],
    });
    const dayIdeal = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T11:00:00',
      durationHours: 1,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.6,
      status: 'IDEAL',
      daylightFlags: [true],
    });

    expect(selectBestWindow([nightIdeal, dayIdeal], true)).toBe(dayIdeal);
  });

  it('handles multi-period daylight majority inside a window', () => {
    const mostlyDay = createWindow({
      startTimestamp: '2026-10-06T16:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 3,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.5,
      daylightFlags: [true, true, false],
    });
    const mostlyNight = createWindow({
      startTimestamp: '2026-10-06T19:00:00',
      endTimestamp: '2026-10-06T22:00:00',
      durationHours: 3,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [false, false, true],
    });

    expect(isDaytimeWindow(mostlyDay)).toBe(true);
    expect(isDaytimeWindow(mostlyNight)).toBe(false);
    expect(selectBestWindow([mostlyNight, mostlyDay], true)).toBe(mostlyDay);
  });

  it('does not treat a true/false daylight tie as daytime against a majority-daytime window within 5pp', () => {
    const tiedDaylight = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [true, false],
    });
    const majorityDaytime = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.5,
      daylightFlags: [true, true],
    });

    expect(isDaytimeWindow(tiedDaylight)).toBe(false);
    expect(isDaytimeWindow(majorityDaytime)).toBe(true);
    // |90 - 87| = 3 <= 5 → daytime preference applies; majority-daytime wins
    expect(selectBestWindow([tiedDaylight, majorityDaytime], true)).toBe(
      majorityDaytime,
    );
  });

  it('lets objective score criteria decide when a true/false daylight tie faces a night window', () => {
    const tiedDaylight = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.6,
      averagePercentage: 87,
      minimumScore: 2.5,
      daylightFlags: [true, false],
    });
    const night = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T22:00:00',
      durationHours: 2,
      averageScore: 2.7,
      averagePercentage: 90,
      minimumScore: 2.6,
      daylightFlags: [false, false],
    });

    expect(isDaytimeWindow(tiedDaylight)).toBe(false);
    expect(isDaytimeWindow(night)).toBe(false);
    // Both non-daytime within 5pp → no daylight preference; higher averageScore wins
    expect(selectBestWindow([tiedDaylight, night], true)).toBe(night);
  });
});
