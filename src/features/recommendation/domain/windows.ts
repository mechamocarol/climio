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
 * Groups consecutive eligible AnalyzedPeriod hours into RecommendationWindows.
 *
 * Eligible: status IDEAL or ACCEPTABLE, and not blocked.
 * Continuity: next hour starts exactly 1h after the previous hour's timestamp.
 * Does not select the best window — that belongs to a later step.
 */
export function buildRecommendationWindows(
  periods: readonly AnalyzedPeriod[],
): readonly RecommendationWindow[] {
  const sorted = [...periods].sort(
    (a, b) =>
      parseHourTimestamp(a.weather.timestamp) - parseHourTimestamp(b.weather.timestamp),
  );

  const windows: RecommendationWindow[] = [];
  let currentGroup: AnalyzedPeriod[] = [];

  const flush = (): void => {
    if (currentGroup.length === 0) {
      return;
    }
    windows.push(buildWindow(currentGroup));
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
  return windows;
}
