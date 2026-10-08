import type { ActivityHours } from '@/features/recommendation/domain/types';

/**
 * Extracts the wall-clock hour (0–23) from an hourly forecast timestamp.
 * Prefers the ISO local-time hour component so Open-Meteo timestamps without
 * an offset are not reinterpreted in the host timezone.
 */
export function extractWallClockHour(timestamp: string): number {
  const match = /T(\d{2}):/.exec(timestamp);
  if (match?.[1] !== undefined) {
    return Number(match[1]);
  }

  if (/[zZ]$/.test(timestamp) || /[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return new Date(timestamp).getUTCHours();
  }

  return new Date(`${timestamp}Z`).getUTCHours();
}

/**
 * Whether a timestamp falls inside the activity's allowed hours.
 * Semantics: `startHour <= hour < endHour`.
 */
export function isWithinActivityHours(
  activityHours: ActivityHours,
  timestamp: string,
): boolean {
  const hour = extractWallClockHour(timestamp);
  return hour >= activityHours.startHour && hour < activityHours.endHour;
}
