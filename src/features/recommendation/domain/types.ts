import type { ActivityId } from '@/features/activity/domain/activities';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

/** Normalized factor score used by the business rules (0–3). */
export type FactorScore = 0 | 1 | 2 | 3;

/** Weather factors that may participate in scoring. */
export type ScoreFactor = 'temperature' | 'precipitation' | 'wind' | 'gust' | 'uv';

/** Weight applied to a factor in the score formula. */
export type ScoreWeight = number;

/**
 * Declarative score band for a continuous numeric factor.
 *
 * Integer-style ranges from the business rules are stored as continuous
 * half-open intervals based on the next documented integer boundary
 * (e.g. 15–25 → min 15 inclusive, max 26 exclusive). See business-rules §17.1.
 * Gust uses the explicit right-closed thresholds in §8.
 * Evaluation belongs to the Recommendation Engine.
 */
export type ScoreBand = Readonly<{
  min: number | null;
  max: number | null;
  minInclusive: boolean;
  maxInclusive: boolean;
  score: FactorScore;
}>;

export type ScoreBands = readonly ScoreBand[];

export type FactorWeights = Readonly<Partial<Record<ScoreFactor, ScoreWeight>>>;

/**
 * Domain weather fields from HourlyWeather that may be required
 * for score, blocking, or contextual preference evaluation.
 */
export type WeatherDataField =
  | 'temperature'
  | 'apparentTemperature'
  | 'precipitationProbability'
  | 'precipitation'
  | 'windSpeed'
  | 'windGust'
  | 'uvIndex'
  | 'weatherCode'
  | 'isDaylight';

/**
 * Per-activity weather data needs, separated by role.
 * Contextual fields (e.g. daylight) must not affect score/blocking sufficiency.
 */
export type WeatherDataRequirement = Readonly<{
  score: readonly WeatherDataField[];
  blocking: readonly WeatherDataField[];
  contextual: readonly WeatherDataField[];
}>;

export type PeriodStatus = 'IDEAL' | 'ACCEPTABLE' | 'UNFAVORABLE' | 'INADEQUATE';

/**
 * Blocking conditions defined by the MVP business rules.
 * Discriminated union — only conditions actually used by activities.
 */
export type BlockingCondition =
  | Readonly<{ type: 'significant_rain' }>
  | Readonly<{ type: 'storm' }>
  | Readonly<{ type: 'gust_above'; thresholdKmH: number }>
  | Readonly<{ type: 'apparent_temperature_above'; thresholdCelsius: number }>
  | Readonly<{ type: 'temperature_above'; thresholdCelsius: number }>;

export type BlockingConditionType = BlockingCondition['type'];

/**
 * Reasons a period may be ineligible for recommendation windows.
 * Weather blocking conditions plus activity-hours eligibility.
 */
export type BlockingReason = BlockingConditionType | 'outside_activity_hours';

/**
 * Allowed wall-clock hours for an activity (half-open).
 * `startHour <= hour < endHour` — e.g. 5–22 allows 05:00 through 21:00.
 */
export type ActivityHours = Readonly<{
  startHour: number;
  endHour: number;
}>;

/**
 * Declarative rules for one activity.
 * Contains configuration only — no evaluation functions.
 */
export type ActivityRules = Readonly<{
  activityId: ActivityId;
  temperatureBands: ScoreBands;
  precipitationBands: ScoreBands;
  windBands: ScoreBands;
  /** Present when gust participates in scoring for the activity. */
  gustBands: ScoreBands | null;
  /** Present only for activities that include UV in the score (pet_walk, child_walk). */
  uvBands: ScoreBands | null;
  weights: FactorWeights;
  blockingConditions: readonly BlockingCondition[];
  /**
   * Explicit allowed hours for the activity (eligibility, not score).
   * Independent from prefersDaylight.
   */
  activityHours: ActivityHours;
  prefersDaylight: boolean;
}>;

export type FactorScoreBreakdown = Readonly<Partial<Record<ScoreFactor, FactorScore>>>;

/**
 * Per-factor arithmetic means across a RecommendationWindow (C7.1).
 * Values may be decimal; classification belongs to C7.2.
 */
export type AggregatedFactorScores = Readonly<Partial<Record<ScoreFactor, number>>>;

/** Semantic classification of an aggregated factor score (C7.2). */
export type AggregatedFactorClassification = 'positive' | 'neutral' | 'negative';

/**
 * Semantic explanation of a recommendation result (C7.3).
 * Presentation copy is produced later by the UI layer — not here.
 */
export type RecommendationExplanation = Readonly<{
  positiveFactors: readonly ScoreFactor[];
  neutralFactors: readonly ScoreFactor[];
  negativeFactors: readonly ScoreFactor[];
}>;

/** Future engine output contract for one analyzed hour. */
export type AnalyzedPeriod = Readonly<{
  weather: HourlyWeather;
  score: number;
  percentage: number;
  status: PeriodStatus;
  factors: FactorScoreBreakdown;
  blocked: boolean;
  blockingReasons: readonly BlockingReason[];
}>;

/** Future engine output contract for a consecutive eligible window. */
export type RecommendationWindow = Readonly<{
  startTimestamp: string;
  endTimestamp: string;
  durationHours: number;
  averageScore: number;
  averagePercentage: number;
  minimumScore: number;
  periods: readonly AnalyzedPeriod[];
}>;

/** Future Recommendation Engine result contract. */
export type RecommendationResult = Readonly<{
  activityId: ActivityId;
  recommendation: RecommendationWindow | null;
  alternatives: readonly RecommendationWindow[];
  analyzedPeriods: readonly AnalyzedPeriod[];
  explanation: RecommendationExplanation;
}>;
