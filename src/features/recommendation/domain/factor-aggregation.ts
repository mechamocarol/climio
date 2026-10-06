import type {
  AggregatedFactorScores,
  RecommendationWindow,
  ScoreFactor,
} from '@/features/recommendation/domain/types';

const SCORE_FACTORS: readonly ScoreFactor[] = [
  'temperature',
  'precipitation',
  'wind',
  'gust',
  'uv',
] as const;

/**
 * Aggregates factor scores across a RecommendationWindow as arithmetic means.
 *
 * Only periods that include a given factor participate in that factor's average.
 * Absent factors are not treated as 0; a present score of 0 is included.
 * Means are not rounded. Does not classify factors (C7.2).
 */
export function aggregateWindowFactors(
  window: RecommendationWindow,
): AggregatedFactorScores {
  const sums: Partial<Record<ScoreFactor, number>> = {};
  const counts: Partial<Record<ScoreFactor, number>> = {};

  for (const period of window.periods) {
    for (const factor of SCORE_FACTORS) {
      const score = period.factors[factor];
      if (score === undefined) {
        continue;
      }
      sums[factor] = (sums[factor] ?? 0) + score;
      counts[factor] = (counts[factor] ?? 0) + 1;
    }
  }

  const aggregated: Partial<Record<ScoreFactor, number>> = {};
  for (const factor of SCORE_FACTORS) {
    const count = counts[factor];
    if (count === undefined) {
      continue;
    }
    aggregated[factor] = (sums[factor] ?? 0) / count;
  }

  return aggregated;
}
