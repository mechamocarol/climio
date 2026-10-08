import {
  ALLOW_IDEAL_SINGLE_HOUR_FALLBACK,
  DAYLIGHT_TIE_TOLERANCE_PERCENTAGE_POINTS,
  PREFERRED_WINDOW_DURATION_HOURS,
} from '@/features/recommendation/domain/recommendation-config';
import type { RecommendationWindow } from '@/features/recommendation/domain/types';

/**
 * 1h fallback candidate: exactly one period and that period is IDEAL.
 * Uses existing C3 status — does not recompute score or classification.
 */
function isIdealSingleHourWindow(window: RecommendationWindow): boolean {
  if (window.durationHours !== 1 || window.periods.length !== 1) {
    return false;
  }
  return window.periods[0]?.status === 'IDEAL';
}

/**
 * A window is "daytime" when a strict majority of periods with known isDaylight
 * are true. null is ignored; all-null or a true/false tie → not daytime.
 */
export function isDaytimeWindow(window: RecommendationWindow): boolean {
  let daylightCount = 0;
  let knownCount = 0;

  for (const period of window.periods) {
    const isDaylight = period.weather.isDaylight;
    if (isDaylight === null) {
      continue;
    }
    knownCount += 1;
    if (isDaylight) {
      daylightCount += 1;
    }
  }

  if (knownCount === 0) {
    return false;
  }

  return daylightCount > knownCount - daylightCount;
}

function parseStartTimestamp(timestamp: string): number {
  if (/[zZ]$/.test(timestamp) || /[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return Date.parse(timestamp);
  }
  return Date.parse(`${timestamp}Z`);
}

function compareByScoreCriteria(a: RecommendationWindow, b: RecommendationWindow): number {
  if (a.averageScore !== b.averageScore) {
    return b.averageScore - a.averageScore;
  }
  if (a.minimumScore !== b.minimumScore) {
    return b.minimumScore - a.minimumScore;
  }
  if (a.durationHours !== b.durationHours) {
    return b.durationHours - a.durationHours;
  }
  return parseStartTimestamp(a.startTimestamp) - parseStartTimestamp(b.startTimestamp);
}

/**
 * Pairwise comparison for best-window selection.
 * Assumes both windows already belong to the same duration pool (>=2h or 1h).
 */
function compareWindows(
  a: RecommendationWindow,
  b: RecommendationWindow,
  prefersDaylight: boolean,
): number {
  if (prefersDaylight) {
    const percentageDelta = Math.abs(a.averagePercentage - b.averagePercentage);
    if (percentageDelta <= DAYLIGHT_TIE_TOLERANCE_PERCENTAGE_POINTS) {
      const aDaytime = isDaytimeWindow(a);
      const bDaytime = isDaytimeWindow(b);
      if (aDaytime !== bDaytime) {
        return aDaytime ? -1 : 1;
      }
    }
  }

  return compareByScoreCriteria(a, b);
}

/**
 * Selects the best recommendation window using deterministic ranking.
 *
 * 1. Prefer the >=2h pool when any such window exists.
 * 2. Otherwise, if `ALLOW_IDEAL_SINGLE_HOUR_FALLBACK`, use only 1h windows
 *    whose single period status is IDEAL (ACCEPTABLE 1h is never a fallback).
 * 3. Optionally prefer daytime windows within the 5pp percentage tolerance.
 * 4. Then averageScore → minimumScore → durationHours → earlier startTimestamp.
 */
export function selectBestWindow(
  windows: readonly RecommendationWindow[],
  prefersDaylight: boolean,
): RecommendationWindow | null {
  if (windows.length === 0) {
    return null;
  }

  const preferredDuration = windows.filter(
    (window) => window.durationHours >= PREFERRED_WINDOW_DURATION_HOURS,
  );

  const candidates =
    preferredDuration.length > 0
      ? preferredDuration
      : ALLOW_IDEAL_SINGLE_HOUR_FALLBACK
        ? windows.filter(isIdealSingleHourWindow)
        : [];

  if (candidates.length === 0) {
    return null;
  }

  const ranked = [...candidates].sort((a, b) => compareWindows(a, b, prefersDaylight));
  return ranked[0] ?? null;
}
