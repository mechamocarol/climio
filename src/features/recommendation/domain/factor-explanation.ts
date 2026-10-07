import { classifyAggregatedFactorScore } from '@/features/recommendation/domain/factor-classification';
import type {
  AggregatedFactorScores,
  RecommendationExplanation,
  ScoreFactor,
} from '@/features/recommendation/domain/types';

const SCORE_FACTORS: readonly ScoreFactor[] = [
  'temperature',
  'precipitation',
  'wind',
  'gust',
  'uv',
];

/**
 * Builds a structured RecommendationExplanation from aggregated factor scores.
 *
 * Uses C7.2 classification; does not recalculate, round, or invent factors.
 * Categories always exist (empty arrays when unused). Order is canonical.
 */
export function buildRecommendationExplanation(
  aggregatedFactorScores: AggregatedFactorScores,
): RecommendationExplanation {
  const positiveFactors: ScoreFactor[] = [];
  const neutralFactors: ScoreFactor[] = [];
  const negativeFactors: ScoreFactor[] = [];

  for (const factor of SCORE_FACTORS) {
    const score = aggregatedFactorScores[factor];
    if (score === undefined) {
      continue;
    }

    const classification = classifyAggregatedFactorScore(score);
    switch (classification) {
      case 'positive':
        positiveFactors.push(factor);
        break;
      case 'neutral':
        neutralFactors.push(factor);
        break;
      case 'negative':
        negativeFactors.push(factor);
        break;
    }
  }

  return {
    positiveFactors,
    neutralFactors,
    negativeFactors,
  };
}
