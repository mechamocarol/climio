import { evaluateBlockingConditions } from '@/features/recommendation/domain/blocking-conditions';
import {
  scoreGust,
  scorePrecipitation,
  scoreTemperature,
  scoreUv,
  scoreWind,
} from '@/features/recommendation/domain/factor-scoring';
import { CLASSIFICATION_THRESHOLDS } from '@/features/recommendation/domain/recommendation-config';
import type {
  ActivityRules,
  AnalyzedPeriod,
  FactorScore,
  FactorScoreBreakdown,
  PeriodStatus,
  ScoreFactor,
} from '@/features/recommendation/domain/types';
import { isWeatherDataSufficient } from '@/features/recommendation/domain/weather-data-requirements';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

/** Stable order for factor evaluation (only weighted factors are scored). */
const SCORE_FACTORS: readonly ScoreFactor[] = [
  'temperature',
  'precipitation',
  'wind',
  'gust',
  'uv',
] as const;

const MAX_FACTOR_SCORE = 3;

function scoreWeightedFactor(
  rules: ActivityRules,
  factor: ScoreFactor,
  weather: HourlyWeather,
): FactorScore | null {
  switch (factor) {
    case 'temperature':
      return scoreTemperature(rules, weather.temperature);
    case 'precipitation':
      return scorePrecipitation(rules, weather.precipitationProbability);
    case 'wind':
      return scoreWind(rules, weather.windSpeed);
    case 'gust':
      return scoreGust(rules, weather.windGust);
    case 'uv':
      return scoreUv(rules, weather.uvIndex);
  }
}

/**
 * Classifies a continuous percentage using CLASSIFICATION_THRESHOLDS mins
 * as half-open lower bounds (e.g. 74.999 → ACCEPTABLE, 75 → IDEAL).
 */
export function classifyPercentage(percentage: number): PeriodStatus {
  if (percentage >= CLASSIFICATION_THRESHOLDS.IDEAL.min) {
    return 'IDEAL';
  }
  if (percentage >= CLASSIFICATION_THRESHOLDS.ACCEPTABLE.min) {
    return 'ACCEPTABLE';
  }
  if (percentage >= CLASSIFICATION_THRESHOLDS.UNFAVORABLE.min) {
    return 'UNFAVORABLE';
  }
  return 'INADEQUATE';
}

function buildFactorBreakdown(
  rules: ActivityRules,
  weather: HourlyWeather,
): FactorScoreBreakdown | null {
  const factors: Partial<Record<ScoreFactor, FactorScore>> = {};

  for (const factor of SCORE_FACTORS) {
    if (rules.weights[factor] === undefined) {
      continue;
    }

    const factorScore = scoreWeightedFactor(rules, factor, weather);
    if (factorScore === null) {
      return null;
    }
    factors[factor] = factorScore;
  }

  return factors;
}

function computeWeightedScore(
  factors: FactorScoreBreakdown,
  weights: ActivityRules['weights'],
): number | null {
  let weightedSum = 0;
  let weightSum = 0;

  for (const factor of SCORE_FACTORS) {
    const weight = weights[factor];
    const factorScore = factors[factor];
    if (weight === undefined || factorScore === undefined) {
      continue;
    }
    weightedSum += factorScore * weight;
    weightSum += weight;
  }

  if (weightSum === 0) {
    return null;
  }

  return weightedSum / weightSum;
}

/**
 * Analyzes a single hourly weather observation for one activity.
 * Returns null when required score/blocking data is missing (§22).
 * Daylight is ignored for scoring (contextual only — C5).
 */
export function analyzeHourlyWeather(
  rules: ActivityRules,
  weather: HourlyWeather,
): AnalyzedPeriod | null {
  if (!isWeatherDataSufficient(rules, weather)) {
    return null;
  }

  const factors = buildFactorBreakdown(rules, weather);
  if (factors === null) {
    return null;
  }

  const score = computeWeightedScore(factors, rules.weights);
  if (score === null) {
    return null;
  }

  const percentage = (score / MAX_FACTOR_SCORE) * 100;
  const blocking = evaluateBlockingConditions(rules, weather);
  const statusFromScore = classifyPercentage(percentage);

  return {
    weather,
    score,
    percentage,
    status: blocking.blocked ? 'INADEQUATE' : statusFromScore,
    factors,
    blocked: blocking.blocked,
    blockingReasons: blocking.reasons,
  };
}
