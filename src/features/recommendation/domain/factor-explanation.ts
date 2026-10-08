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
 * C7.3: maps aggregated factor scores into positive / neutral / negative lists.
 * Does not recalculate scores; empty categories are preserved; order is canonical.
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
