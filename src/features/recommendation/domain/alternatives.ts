import { MAX_ALTERNATIVE_PERIODS } from '@/features/recommendation/domain/recommendation-config';
import type { RecommendationWindow } from '@/features/recommendation/domain/types';

function parseTimestamp(timestamp: string): number {
  if (/[zZ]$/.test(timestamp) || /[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return Date.parse(timestamp);
  }
  return Date.parse(`${timestamp}Z`);
}

/**
 * Half-open interval overlap: [start, end).
 * Touching at an endpoint is not overlap.
 */
export function windowsOverlap(
  a: RecommendationWindow,
  b: RecommendationWindow,
): boolean {
  const aStart = parseTimestamp(a.startTimestamp);
  const aEnd = parseTimestamp(a.endTimestamp);
  const bStart = parseTimestamp(b.startTimestamp);
  const bEnd = parseTimestamp(b.endTimestamp);

  return aStart < bEnd && bStart < aEnd;
}

function compareAlternativeWindows(
  a: RecommendationWindow,
  b: RecommendationWindow,
): number {
  if (a.averageScore !== b.averageScore) {
    return b.averageScore - a.averageScore;
  }
  if (a.minimumScore !== b.minimumScore) {
    return b.minimumScore - a.minimumScore;
  }
  if (a.durationHours !== b.durationHours) {
    return b.durationHours - a.durationHours;
  }
  return parseTimestamp(a.startTimestamp) - parseTimestamp(b.startTimestamp);
}

/**
 * Selects up to 3 alternative windows for a primary recommendation.
 *
 * 1. Drop the main window (by reference) and any window that overlaps it
 *    using half-open intervals [startTimestamp, endTimestamp).
 * 2. Rank remaining candidates by objective metrics only
 *    (averageScore → minimumScore → durationHours → earlier start;
 *    no >=2h pool, no daylight preference).
 * 3. Greedily keep candidates that do not overlap any already selected
 *    alternative, up to MAX_ALTERNATIVE_PERIODS.
 */
export function selectAlternativeWindows(
  windows: readonly RecommendationWindow[],
  mainWindow: RecommendationWindow | null,
): readonly RecommendationWindow[] {
  if (mainWindow === null) {
    return [];
  }

  const ranked = windows
    .filter(
      (window) => window !== mainWindow && !windowsOverlap(window, mainWindow),
    )
    .sort(compareAlternativeWindows);

  const selected: RecommendationWindow[] = [];

  for (const candidate of ranked) {
    if (selected.length >= MAX_ALTERNATIVE_PERIODS) {
      break;
    }
    if (selected.some((chosen) => windowsOverlap(candidate, chosen))) {
      continue;
    }
    selected.push(candidate);
  }

  return selected;
}
