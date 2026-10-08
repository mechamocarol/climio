import type { FactorScore, PeriodStatus, ScoreBands } from '@/features/recommendation/domain/types';

/** Classification thresholds on the normalized percentage (0–100). */
export const CLASSIFICATION_THRESHOLDS = {
  IDEAL: { min: 75, max: 100 },
  ACCEPTABLE: { min: 55, max: 74 },
  UNFAVORABLE: { min: 35, max: 54 },
  INADEQUATE: { min: 0, max: 34 },
} as const satisfies Record<PeriodStatus, Readonly<{ min: number; max: number }>>;

/**
 * Practical recommendation window length (hours).
 * C4 emits sliding candidates of this size from each eligible run;
 * C5 prefers the pool of windows with `durationHours >=` this value,
 * falling back to 1h windows when none exist.
 */
export const PREFERRED_WINDOW_DURATION_HOURS = 2;

/** Allow recommending a single IDEAL hour when no 2-hour window exists. */
export const ALLOW_IDEAL_SINGLE_HOUR_FALLBACK = true;

/**
 * Default allowed hours for outdoor MVP activities (half-open).
 * 05:00 inclusive → 22:00 exclusive.
 */
export const DEFAULT_OUTDOOR_ACTIVITY_HOURS = {
  startHour: 5,
  endHour: 22,
} as const;

/**
 * More conservative allowed hours for child_walk (half-open).
 * 06:00 inclusive → 21:00 exclusive.
 */
export const CHILD_WALK_ACTIVITY_HOURS = {
  startHour: 6,
  endHour: 21,
} as const;

/** Maximum number of alternative windows shown alongside the primary recommendation. */
export const MAX_ALTERNATIVE_PERIODS = 3;

/**
 * Daylight preference may apply when two options differ by at most this many
 * percentage points on the normalized score.
 */
export const DAYLIGHT_TIE_TOLERANCE_PERCENTAGE_POINTS = 5;

/**
 * WMO Weather Interpretation Codes used for thunderstorm blocking.
 * @see docs/product/mvp/business-rules.md §10
 */
export const STORM_WEATHER_CODES = [95, 96, 97, 99] as const;

export type StormWeatherCode = (typeof STORM_WEATHER_CODES)[number];

/** Significant rain thresholds used by blocking conditions. */
export const SIGNIFICANT_RAIN = {
  precipitationProbabilityMin: 60,
  precipitationMmPerHourMin: 2,
} as const;

/**
 * Shared gust score bands (km/h) from business-rules §8.
 *
 * Final continuous thresholds (right-closed interiors):
 * - ≤25 → score 3
 * - >25 and ≤35 → score 2
 * - >35 and ≤45 → score 1
 * - >45 → score 0
 *
 * Blocking uses the same upper cut: `gust > 45`.
 */
export const STANDARD_GUST_BANDS: ScoreBands = [
  { min: null, max: 25, minInclusive: false, maxInclusive: true, score: 3 },
  { min: 25, max: 35, minInclusive: false, maxInclusive: true, score: 2 },
  { min: 35, max: 45, minInclusive: false, maxInclusive: true, score: 1 },
  { min: 45, max: null, minInclusive: false, maxInclusive: false, score: 0 },
] as const;

/** Gust speed (km/h) above which listed activities become ineligible. */
export const GUST_BLOCKING_THRESHOLD_KM_H = 45;

/**
 * Shared UV score bands from business-rules §9.
 * Used only by pet_walk and child_walk in the MVP.
 *
 * Continuous half-open: 0–2 → [0, 3), 3–5 → [3, 6), 6–7 → [6, 8),
 * 8–10 → [8, 11), 11+ → [11, ∞).
 */
export const STANDARD_UV_BANDS: ScoreBands = [
  { min: 0, max: 3, minInclusive: true, maxInclusive: false, score: 3 },
  { min: 3, max: 6, minInclusive: true, maxInclusive: false, score: 2 },
  { min: 6, max: 8, minInclusive: true, maxInclusive: false, score: 1 },
  { min: 8, max: 11, minInclusive: true, maxInclusive: false, score: 0 },
  { min: 11, max: null, minInclusive: true, maxInclusive: false, score: 0 },
] as const;

export const FACTOR_SCORES = [0, 1, 2, 3] as const satisfies readonly FactorScore[];
