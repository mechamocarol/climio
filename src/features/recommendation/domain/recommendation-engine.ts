import { selectAlternativeWindows } from '@/features/recommendation/domain/alternatives';
import { selectBestWindow } from '@/features/recommendation/domain/best-window';
import { aggregateWindowFactors } from '@/features/recommendation/domain/factor-aggregation';
import { buildRecommendationExplanation } from '@/features/recommendation/domain/factor-explanation';
import { analyzeHourlyWeather } from '@/features/recommendation/domain/hourly-analysis';
import type {
  ActivityRules,
  AnalyzedPeriod,
  RecommendationExplanation,
  RecommendationResult,
} from '@/features/recommendation/domain/types';
import { buildRecommendationWindows } from '@/features/recommendation/domain/windows';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

export type RecommendationEngineInput = Readonly<{
  weather: readonly HourlyWeather[];
  rules: ActivityRules;
}>;

const EMPTY_EXPLANATION: RecommendationExplanation = {
  positiveFactors: [],
  neutralFactors: [],
  negativeFactors: [],
};

/**
 * Orchestrates C3 → C4 → C5 → C6 → C7.1 → C7.3 into a RecommendationResult.
 * Contains no weather business rules — only composition of existing domain functions.
 */
export function recommendActivity(
  input: RecommendationEngineInput,
): RecommendationResult {
  const { weather, rules } = input;

  const analyzedPeriods: AnalyzedPeriod[] = [];
  for (const hour of weather) {
    const analyzed = analyzeHourlyWeather(rules, hour);
    if (analyzed !== null) {
      analyzedPeriods.push(analyzed);
    }
  }

  const windows = buildRecommendationWindows(analyzedPeriods);
  const recommendation = selectBestWindow(windows, rules.prefersDaylight);
  const alternatives = selectAlternativeWindows(windows, recommendation);

  const explanation =
    recommendation === null
      ? EMPTY_EXPLANATION
      : buildRecommendationExplanation(aggregateWindowFactors(recommendation));

  return {
    activityId: rules.activityId,
    recommendation,
    alternatives,
    analyzedPeriods,
    explanation,
  };
}
