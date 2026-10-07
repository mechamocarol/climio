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
 * Excludes the main window and any window that overlaps it temporally
 * using half-open intervals [startTimestamp, endTimestamp).
 * Ranking uses objective metrics only (no >=2h pool, no daylight preference).
 */
export function selectAlternativeWindows(
  windows: readonly RecommendationWindow[],
  mainWindow: RecommendationWindow | null,
): readonly RecommendationWindow[] {
  if (mainWindow === null) {
    return [];
  }

  const candidates = windows.filter(
    (window) => window !== mainWindow && !windowsOverlap(window, mainWindow),
  );

  return [...candidates]
    .sort(compareAlternativeWindows)
    .slice(0, MAX_ALTERNATIVE_PERIODS);
}
