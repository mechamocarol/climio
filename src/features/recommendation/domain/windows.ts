import { PREFERRED_WINDOW_DURATION_HOURS } from '@/features/recommendation/domain/recommendation-config';
import type {
  AnalyzedPeriod,
  PeriodStatus,
  RecommendationWindow,
} from '@/features/recommendation/domain/types';

const HOUR_MS = 60 * 60 * 1000;

const ELIGIBLE_STATUSES: ReadonlySet<PeriodStatus> = new Set([
  'IDEAL',
  'ACCEPTABLE',
]);

/**
 * Parse hourly timestamps as abstract UTC wall-clock values so continuity
 * does not depend on the host timezone (ISO without offset is common in domain fixtures).
 */
function parseHourTimestamp(timestamp: string): number {
  if (/[zZ]$/.test(timestamp) || /[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return Date.parse(timestamp);
  }
  return Date.parse(`${timestamp}Z`);
}

function addOneHour(timestamp: string): string {
  const next = new Date(parseHourTimestamp(timestamp) + HOUR_MS);
  if (/[zZ]$/.test(timestamp) || /[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return next.toISOString();
  }
  return next.toISOString().replace(/\.\d{3}Z$/, '');
}

function isConsecutiveHour(previousTimestamp: string, nextTimestamp: string): boolean {
  return parseHourTimestamp(nextTimestamp) - parseHourTimestamp(previousTimestamp) === HOUR_MS;
}

function isEligiblePeriod(period: AnalyzedPeriod): boolean {
  return !period.blocked && ELIGIBLE_STATUSES.has(period.status);
}

function buildWindow(group: readonly AnalyzedPeriod[]): RecommendationWindow {
  const first = group[0];
  const last = group[group.length - 1];
  if (first === undefined || last === undefined) {
    throw new Error('Cannot build a recommendation window from an empty period group');
  }

  const scoreSum = group.reduce((sum, period) => sum + period.score, 0);
  const percentageSum = group.reduce((sum, period) => sum + period.percentage, 0);
  const scores = group.map((period) => period.score);

  return {
    startTimestamp: first.weather.timestamp,
    endTimestamp: addOneHour(last.weather.timestamp),
    durationHours: group.length,
    averageScore: scoreSum / group.length,
    averagePercentage: percentageSum / group.length,
    minimumScore: Math.min(...scores),
    periods: group,
  };
}

/**
 * Expands one contiguous eligible run into practical candidates:
 * - sliding windows of `PREFERRED_WINDOW_DURATION_HOURS` (product "best time" length);
 * - every single eligible hour (1h fallback pool for C5).
 *
 * Maximal all-day runs are never emitted as a single window.
 */
function expandEligibleRun(
  group: readonly AnalyzedPeriod[],
): readonly RecommendationWindow[] {
  if (group.length === 0) {
    return [];
  }

  const windows: RecommendationWindow[] = [];
  const preferred = PREFERRED_WINDOW_DURATION_HOURS;

  if (group.length >= preferred) {
    for (let start = 0; start + preferred <= group.length; start += 1) {
      windows.push(buildWindow(group.slice(start, start + preferred)));
    }
  }

  for (const period of group) {
    windows.push(buildWindow([period]));
  }

  return windows;
}

function collectEligibleRuns(
  periods: readonly AnalyzedPeriod[],
): readonly (readonly AnalyzedPeriod[])[] {
  const sorted = [...periods].sort(
    (a, b) =>
      parseHourTimestamp(a.weather.timestamp) -
      parseHourTimestamp(b.weather.timestamp),
  );

  const runs: AnalyzedPeriod[][] = [];
  let currentGroup: AnalyzedPeriod[] = [];

  const flush = (): void => {
    if (currentGroup.length === 0) {
      return;
    }
    runs.push(currentGroup);
    currentGroup = [];
  };

  for (const period of sorted) {
    if (!isEligiblePeriod(period)) {
      flush();
      continue;
    }

    if (currentGroup.length === 0) {
      currentGroup.push(period);
      continue;
    }

    const previous = currentGroup[currentGroup.length - 1]!;
    if (isConsecutiveHour(previous.weather.timestamp, period.weather.timestamp)) {
      currentGroup.push(period);
    } else {
      flush();
      currentGroup.push(period);
    }
  }

  flush();
  return runs;
}

/**
 * Builds practical RecommendationWindows from analyzed hours.
 *
 * 1. Group consecutive eligible hours (IDEAL/ACCEPTABLE, not blocked).
 * 2. Expand each run into sliding preferred-duration windows + 1h atoms.
 *
 * Does not select the best window — that belongs to C5.
 */
export function buildRecommendationWindows(
  periods: readonly AnalyzedPeriod[],
): readonly RecommendationWindow[] {
  return collectEligibleRuns(periods).flatMap((run) => expandEligibleRun(run));
}
