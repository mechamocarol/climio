import type { AggregatedFactorClassification } from '@/features/recommendation/domain/types';

/**
 * Classifies an aggregated factor score produced by C7.1.
 *
 * Continuous thresholds (no rounding):
 * - score >= 2.5 → positive
 * - score >= 1.5 and < 2.5 → neutral
 * - score < 1.5 → negative
 */
export function classifyAggregatedFactorScore(
  score: number,
): AggregatedFactorClassification {
  if (score >= 2.5) {
    return 'positive';
  }
  if (score >= 1.5) {
    return 'neutral';
  }
  return 'negative';
}
