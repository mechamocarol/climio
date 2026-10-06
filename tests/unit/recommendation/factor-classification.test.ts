import { classifyAggregatedFactorScore } from '@/features/recommendation/domain/factor-classification';
import type { AggregatedFactorClassification } from '@/features/recommendation/domain/types';

describe('classifyAggregatedFactorScore', () => {
  it.each([
    [3, 'positive'],
    [2.5, 'positive'],
    [2.4999999999999996, 'neutral'],
    [2, 'neutral'],
    [1.5, 'neutral'],
    [1.4999999999999998, 'negative'],
    [1, 'negative'],
    [0, 'negative'],
  ] as const satisfies readonly (readonly [number, AggregatedFactorClassification])[])(
    'classifies %s as %s',
    (score, expected) => {
      expect(classifyAggregatedFactorScore(score)).toBe(expected);
    },
  );

  it('uses the real decimal value without rounding', () => {
    expect(classifyAggregatedFactorScore(2.6666666666666665)).toBe('positive');
    expect(classifyAggregatedFactorScore(1.6666666666666667)).toBe('neutral');
    expect(classifyAggregatedFactorScore(1.3333333333333333)).toBe('negative');
  });

  it('treats the continuous boundaries exactly', () => {
    expect(classifyAggregatedFactorScore(2.5)).toBe('positive');
    expect(classifyAggregatedFactorScore(1.5)).toBe('neutral');
    expect(classifyAggregatedFactorScore(1.5 - Number.EPSILON)).toBe('negative');
  });
});
