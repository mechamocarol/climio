import {
  selectAlternativeWindows,
  windowsOverlap,
} from '@/features/recommendation/domain/alternatives';
import type {
  AnalyzedPeriod,
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
  status?: PeriodStatus;
  score?: number;
  percentage?: number;
}): AnalyzedPeriod {
  return {
    weather: createWeather(input.timestamp),
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
  averagePercentage?: number;
  minimumScore: number;
}): RecommendationWindow {
  const periods = Array.from({ length: input.durationHours }, (_, index) => {
    const hour = String(
      Number(input.startTimestamp.slice(11, 13)) + index,
    ).padStart(2, '0');
    const timestamp = `${input.startTimestamp.slice(0, 11)}${hour}:00:00`;
    return createPeriod({
      timestamp,
      score: input.averageScore,
      percentage: input.averagePercentage ?? input.averageScore * (100 / 3),
    });
  });

  return {
    startTimestamp: input.startTimestamp,
    endTimestamp: input.endTimestamp,
    durationHours: input.durationHours,
    averageScore: input.averageScore,
    averagePercentage: input.averagePercentage ?? input.averageScore * (100 / 3),
    minimumScore: input.minimumScore,
    periods,
  };
}

describe('windowsOverlap', () => {
  it('does not treat endpoint-touching windows as overlapping', () => {
    const morning = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const evening = createWindow({
      startTimestamp: '2026-10-06T12:00:00',
      endTimestamp: '2026-10-06T14:00:00',
      durationHours: 2,
      averageScore: 2.4,
      minimumScore: 2.3,
    });

    expect(windowsOverlap(morning, evening)).toBe(false);
  });

  it('detects partial overlap across the shared hour', () => {
    const a = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const partial = createWindow({
      startTimestamp: '2026-10-06T11:00:00',
      endTimestamp: '2026-10-06T13:00:00',
      durationHours: 2,
      averageScore: 2.4,
      minimumScore: 2.3,
    });

    expect(windowsOverlap(a, partial)).toBe(true);
  });

  it('detects nested and contained overlaps', () => {
    const nested = createWindow({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T20:00:00',
      durationHours: 3,
      averageScore: 2.3,
      minimumScore: 2.2,
    });
    const inner = createWindow({
      startTimestamp: '2026-10-06T18:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 1,
      averageScore: 2.2,
      minimumScore: 2.2,
    });

    expect(windowsOverlap(nested, inner)).toBe(true);
  });
});

describe('selectAlternativeWindows', () => {
  it('returns an empty list when windows is empty', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });

    expect(selectAlternativeWindows([], main)).toEqual([]);
  });

  it('returns an empty list when mainWindow is null', () => {
    const window = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });

    expect(selectAlternativeWindows([window], null)).toEqual([]);
  });

  it('returns a single valid alternative', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });
    const alt = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    expect(selectAlternativeWindows([main, alt], main)).toEqual([alt]);
  });

  it('returns fewer than 3 alternatives when that is all that remains', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T08:00:00',
      endTimestamp: '2026-10-06T10:00:00',
      durationHours: 2,
      averageScore: 2.9,
      minimumScore: 2.8,
    });
    const a = createWindow({
      startTimestamp: '2026-10-06T12:00:00',
      endTimestamp: '2026-10-06T13:00:00',
      durationHours: 1,
      averageScore: 2.4,
      minimumScore: 2.4,
    });
    const b = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T17:00:00',
      durationHours: 2,
      averageScore: 2.6,
      minimumScore: 2.5,
    });

    expect(selectAlternativeWindows([main, a, b], main)).toEqual([b, a]);
  });

  it('limits alternatives to a maximum of 3', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const alts = [1, 2, 3, 4].map((n) =>
      createWindow({
        startTimestamp: `2026-10-06T${String(8 + n * 2).padStart(2, '0')}:00:00`,
        endTimestamp: `2026-10-06T${String(10 + n * 2).padStart(2, '0')}:00:00`,
        durationHours: 2,
        averageScore: 2.5 - n * 0.1,
        minimumScore: 2.4 - n * 0.1,
      }),
    );

    const result = selectAlternativeWindows([main, ...alts], main);
    expect(result).toHaveLength(3);
    expect(result).toEqual([alts[0], alts[1], alts[2]]);
  });

  it('excludes the mainWindow itself', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });
    const alt = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T15:00:00',
      durationHours: 1,
      averageScore: 2.5,
      minimumScore: 2.5,
    });

    const result = selectAlternativeWindows([main, alt], main);
    expect(result).not.toContain(main);
    expect(result).toEqual([alt]);
  });

  it('excludes a fully overlapping window', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T13:00:00',
      durationHours: 3,
      averageScore: 2.8,
      minimumScore: 2.7,
    });
    const nested = createWindow({
      startTimestamp: '2026-10-06T11:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 1,
      averageScore: 2.9,
      minimumScore: 2.9,
    });
    const later = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T17:00:00',
      durationHours: 2,
      averageScore: 2.4,
      minimumScore: 2.3,
    });

    expect(selectAlternativeWindows([main, nested, later], main)).toEqual([later]);
  });

  it('excludes a partially overlapping window', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });
    const partial = createWindow({
      startTimestamp: '2026-10-06T18:00:00',
      endTimestamp: '2026-10-06T20:00:00',
      durationHours: 2,
      averageScore: 2.9,
      minimumScore: 2.8,
    });
    const later = createWindow({
      startTimestamp: '2026-10-06T20:00:00',
      endTimestamp: '2026-10-06T21:00:00',
      durationHours: 1,
      averageScore: 2.4,
      minimumScore: 2.4,
    });

    expect(selectAlternativeWindows([main, partial, later], main)).toEqual([later]);
  });

  it('keeps windows that only touch the main window at an endpoint', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T17:00:00',
      endTimestamp: '2026-10-06T19:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });
    const before = createWindow({
      startTimestamp: '2026-10-06T15:00:00',
      endTimestamp: '2026-10-06T17:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const after = createWindow({
      startTimestamp: '2026-10-06T19:00:00',
      endTimestamp: '2026-10-06T21:00:00',
      durationHours: 2,
      averageScore: 2.6,
      minimumScore: 2.5,
    });

    expect(selectAlternativeWindows([main, before, after], main)).toEqual([
      after,
      before,
    ]);
  });

  it('ranks by averageScore', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const lower = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.2,
      minimumScore: 2.1,
    });
    const higher = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.7,
      minimumScore: 2.6,
    });

    expect(selectAlternativeWindows([main, lower, higher], main)).toEqual([
      higher,
      lower,
    ]);
  });

  it('breaks ties with minimumScore', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const lowerMin = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.0,
    });
    const higherMin = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    expect(selectAlternativeWindows([main, lowerMin, higherMin], main)).toEqual([
      higherMin,
      lowerMin,
    ]);
  });

  it('breaks ties with durationHours', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const shorter = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const longer = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T17:00:00',
      durationHours: 3,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    expect(selectAlternativeWindows([main, shorter, longer], main)).toEqual([
      longer,
      shorter,
    ]);
  });

  it('breaks ties with earlier startTimestamp', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const later = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const earlier = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    expect(selectAlternativeWindows([main, later, earlier], main)).toEqual([
      earlier,
      later,
    ]);
  });

  it('is independent of input order', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const a = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.2,
      minimumScore: 2.1,
    });
    const b = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.7,
      minimumScore: 2.6,
    });

    expect(selectAlternativeWindows([main, a, b], main)).toEqual([b, a]);
    expect(selectAlternativeWindows([b, main, a], main)).toEqual([b, a]);
  });

  it('does not mutate input arrays or window objects', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const alt = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const windows = [main, alt];
    const windowsSnapshot = [...windows];
    const mainSnapshot = { ...main };
    const altSnapshot = { ...alt };

    selectAlternativeWindows(windows, main);

    expect(windows).toEqual(windowsSnapshot);
    expect(main).toEqual(mainSnapshot);
    expect(alt).toEqual(altSnapshot);
  });

  it('preserves the exact C4 window object references', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const alt = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T12:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    const result = selectAlternativeWindows([main, alt], main);
    expect(result[0]).toBe(alt);
  });

  it('does not create or split windows and keeps 1h alternatives alongside 2h ones', () => {
    const main = createWindow({
      startTimestamp: '2026-10-06T06:00:00',
      endTimestamp: '2026-10-06T08:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const oneHour = createWindow({
      startTimestamp: '2026-10-06T10:00:00',
      endTimestamp: '2026-10-06T11:00:00',
      durationHours: 1,
      averageScore: 2.9,
      minimumScore: 2.9,
    });
    const twoHour = createWindow({
      startTimestamp: '2026-10-06T14:00:00',
      endTimestamp: '2026-10-06T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    const result = selectAlternativeWindows([main, oneHour, twoHour], main);
    expect(result).toEqual([oneHour, twoHour]);
    expect(result[0]?.durationHours).toBe(1);
    expect(result[0]?.periods).toHaveLength(1);
    expect(result[1]?.periods).toHaveLength(2);
  });

  it('excludes 1h subsets that overlap the main 2h recommendation', () => {
    const main = createWindow({
      startTimestamp: '2026-10-07T10:00:00',
      endTimestamp: '2026-10-07T12:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const tenEleven = createWindow({
      startTimestamp: '2026-10-07T10:00:00',
      endTimestamp: '2026-10-07T11:00:00',
      durationHours: 1,
      averageScore: 3,
      minimumScore: 3,
    });
    const elevenTwelve = createWindow({
      startTimestamp: '2026-10-07T11:00:00',
      endTimestamp: '2026-10-07T12:00:00',
      durationHours: 1,
      averageScore: 3,
      minimumScore: 3,
    });
    const thirteenFifteen = createWindow({
      startTimestamp: '2026-10-07T13:00:00',
      endTimestamp: '2026-10-07T15:00:00',
      durationHours: 2,
      averageScore: 2.8,
      minimumScore: 2.7,
    });
    const sixteenEighteen = createWindow({
      startTimestamp: '2026-10-07T16:00:00',
      endTimestamp: '2026-10-07T18:00:00',
      durationHours: 2,
      averageScore: 2.6,
      minimumScore: 2.5,
    });

    expect(
      selectAlternativeWindows(
        [main, tenEleven, elevenTwelve, thirteenFifteen, sixteenEighteen],
        main,
      ),
    ).toEqual([thirteenFifteen, sixteenEighteen]);
  });

  it('does not select alternatives that overlap each other', () => {
    const main = createWindow({
      startTimestamp: '2026-10-07T08:00:00',
      endTimestamp: '2026-10-07T10:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const thirteenFifteen = createWindow({
      startTimestamp: '2026-10-07T13:00:00',
      endTimestamp: '2026-10-07T15:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const fourteenSixteen = createWindow({
      startTimestamp: '2026-10-07T14:00:00',
      endTimestamp: '2026-10-07T16:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });
    const sixteenEighteen = createWindow({
      startTimestamp: '2026-10-07T16:00:00',
      endTimestamp: '2026-10-07T18:00:00',
      durationHours: 2,
      averageScore: 2.5,
      minimumScore: 2.4,
    });

    const result = selectAlternativeWindows(
      [main, thirteenFifteen, fourteenSixteen, sixteenEighteen],
      main,
    );

    expect(result).toEqual([thirteenFifteen, sixteenEighteen]);
    expect(result).not.toContain(fourteenSixteen);
  });

  it('keeps alternatives unique by startTimestamp after selection', () => {
    const main = createWindow({
      startTimestamp: '2026-10-07T10:00:00',
      endTimestamp: '2026-10-07T12:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const candidates = [
      main,
      createWindow({
        startTimestamp: '2026-10-07T10:00:00',
        endTimestamp: '2026-10-07T11:00:00',
        durationHours: 1,
        averageScore: 3,
        minimumScore: 3,
      }),
      createWindow({
        startTimestamp: '2026-10-07T11:00:00',
        endTimestamp: '2026-10-07T12:00:00',
        durationHours: 1,
        averageScore: 3,
        minimumScore: 3,
      }),
      createWindow({
        startTimestamp: '2026-10-07T13:00:00',
        endTimestamp: '2026-10-07T15:00:00',
        durationHours: 2,
        averageScore: 2.7,
        minimumScore: 2.6,
      }),
      createWindow({
        startTimestamp: '2026-10-07T16:00:00',
        endTimestamp: '2026-10-07T18:00:00',
        durationHours: 2,
        averageScore: 2.5,
        minimumScore: 2.4,
      }),
    ];

    const result = selectAlternativeWindows(candidates, main);
    const starts = result.map((window) => window.startTimestamp);

    expect(new Set(starts).size).toBe(starts.length);
    expect(starts).not.toContain(main.startTimestamp);
  });

  it('is deterministic for the same inputs', () => {
    const main = createWindow({
      startTimestamp: '2026-10-07T08:00:00',
      endTimestamp: '2026-10-07T10:00:00',
      durationHours: 2,
      averageScore: 3,
      minimumScore: 3,
    });
    const windows = [
      main,
      createWindow({
        startTimestamp: '2026-10-07T12:00:00',
        endTimestamp: '2026-10-07T14:00:00',
        durationHours: 2,
        averageScore: 2.6,
        minimumScore: 2.5,
      }),
      createWindow({
        startTimestamp: '2026-10-07T13:00:00',
        endTimestamp: '2026-10-07T15:00:00',
        durationHours: 2,
        averageScore: 2.7,
        minimumScore: 2.6,
      }),
      createWindow({
        startTimestamp: '2026-10-07T16:00:00',
        endTimestamp: '2026-10-07T18:00:00',
        durationHours: 2,
        averageScore: 2.5,
        minimumScore: 2.4,
      }),
    ];

    expect(selectAlternativeWindows(windows, main)).toEqual(
      selectAlternativeWindows(windows, main),
    );
  });
});
