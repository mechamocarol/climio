import type { ActivityId } from '@/features/activity/domain/activities';
import type { Location } from '@/features/location/domain/location';
import type { GetHourlyForecastInput } from '@/features/weather/domain/weather-repository';

/**
 * User selections that drive forecast and recommendation composition.
 * `date` is a calendar day in `YYYY-MM-DD` form (device-local by default).
 */
export type PlanState = Readonly<{
  activityId: ActivityId | null;
  location: Location | null;
  date: string;
}>;

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Formats a device-local calendar day as `YYYY-MM-DD`.
 * Accepts an optional `Date` for deterministic tests; does not store `Date` in Plan.
 */
export function getDefaultPlanDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isCalendarDate(date: string): boolean {
  return CALENDAR_DATE_PATTERN.test(date);
}

function hasForecastDate(date: string): boolean {
  return date.trim().length > 0;
}

/** Weather forecast needs a selected place and calendar day — not an activity. */
export function isPlanReadyForForecast(plan: PlanState): boolean {
  return plan.location !== null && hasForecastDate(plan.date);
}

/** Recommendation needs activity plus the same forecast prerequisites. */
export function isPlanReadyForRecommendation(plan: PlanState): boolean {
  return (
    plan.activityId !== null &&
    plan.location !== null &&
    hasForecastDate(plan.date)
  );
}

/**
 * Maps Plan selections to the Weather repository input.
 * Returns null when forecast prerequisites are missing.
 */
export function toHourlyForecastInput(
  plan: PlanState,
): GetHourlyForecastInput | null {
  if (!isPlanReadyForForecast(plan) || plan.location === null) {
    return null;
  }

  return {
    latitude: plan.location.latitude,
    longitude: plan.location.longitude,
    date: plan.date,
  };
}
