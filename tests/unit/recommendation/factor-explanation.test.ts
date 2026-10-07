import { buildRecommendationExplanation } from '@/features/recommendation/domain/factor-explanation';
import type { AggregatedFactorScores } from '@/features/recommendation/domain/types';

describe('buildRecommendationExplanation', () => {
  it('returns all empty categories for an empty aggregated scores object', () => {
    expect(buildRecommendationExplanation({})).toEqual({
      positiveFactors: [],
      neutralFactors: [],
      negativeFactors: [],
    });
  });

  it.each([
    [3, 'positiveFactors'],
    [2.5, 'positiveFactors'],
    [2.4999999999999996, 'neutralFactors'],
    [2, 'neutralFactors'],
    [1.5, 'neutralFactors'],
    [1.4999999999999998, 'negativeFactors'],
    [0, 'negativeFactors'],
  ] as const)('places temperature score %s in %s', (score, category) => {
    const explanation = buildRecommendationExplanation({ temperature: score });

    expect(explanation).toEqual({
      positiveFactors: category === 'positiveFactors' ? ['temperature'] : [],
      neutralFactors: category === 'neutralFactors' ? ['temperature'] : [],
      negativeFactors: category === 'negativeFactors' ? ['temperature'] : [],
    });
  });

  it('places factors into the correct categories', () => {
    expect(
      buildRecommendationExplanation({
        temperature: 2.6666666666666665,
        precipitation: 3,
        wind: 1.8,
      }),
    ).toEqual({
      positiveFactors: ['temperature', 'precipitation'],
      neutralFactors: ['wind'],
      negativeFactors: [],
    });
  });

  it('preserves canonical ScoreFactor order within each category', () => {
    const explanation = buildRecommendationExplanation({
      uv: 3,
      gust: 3,
      wind: 3,
      precipitation: 3,
      temperature: 3,
    });

    expect(explanation.positiveFactors).toEqual([
      'temperature',
      'precipitation',
      'wind',
      'gust',
      'uv',
    ]);
  });

  it('does not depend on property order of the input object', () => {
    const a = buildRecommendationExplanation({
      wind: 3,
      temperature: 3,
      precipitation: 2,
    });
    const b = buildRecommendationExplanation({
      precipitation: 2,
      temperature: 3,
      wind: 3,
    });

    expect(a).toEqual(b);
    expect(a).toEqual({
      positiveFactors: ['temperature', 'wind'],
      neutralFactors: ['precipitation'],
      negativeFactors: [],
    });
  });

  it('does not add absent factors', () => {
    const explanation = buildRecommendationExplanation({
      temperature: 3,
      precipitation: 2,
    });

    expect(explanation).toEqual({
      positiveFactors: ['temperature'],
      neutralFactors: ['precipitation'],
      negativeFactors: [],
    });
    expect(explanation.positiveFactors).not.toContain('wind');
    expect(explanation.positiveFactors).not.toContain('gust');
    expect(explanation.positiveFactors).not.toContain('uv');
  });

  it('treats score 0 as present and negative, not as absence', () => {
    expect(buildRecommendationExplanation({ temperature: 0 })).toEqual({
      positiveFactors: [],
      neutralFactors: [],
      negativeFactors: ['temperature'],
    });
  });

  it('keeps all three categories even when some are empty', () => {
    const explanation = buildRecommendationExplanation({ temperature: 3 });

    expect(Object.keys(explanation).sort()).toEqual([
      'negativeFactors',
      'neutralFactors',
      'positiveFactors',
    ]);
    expect(explanation.neutralFactors).toEqual([]);
    expect(explanation.negativeFactors).toEqual([]);
  });

  it('does not duplicate factors across or within categories', () => {
    const explanation = buildRecommendationExplanation({
      temperature: 1.2,
      precipitation: 2.1,
      wind: 2.8,
    });

    const all = [
      ...explanation.positiveFactors,
      ...explanation.neutralFactors,
      ...explanation.negativeFactors,
    ];

    expect(all).toEqual(['wind', 'precipitation', 'temperature']);
    expect(new Set(all).size).toBe(all.length);
  });

  it('processes all five ScoreFactors when present', () => {
    expect(
      buildRecommendationExplanation({
        temperature: 3,
        precipitation: 2,
        wind: 1,
        gust: 2.5,
        uv: 0,
      }),
    ).toEqual({
      positiveFactors: ['temperature', 'gust'],
      neutralFactors: ['precipitation'],
      negativeFactors: ['wind', 'uv'],
    });
  });

  it('uses real decimal values for classification without rounding', () => {
    expect(
      buildRecommendationExplanation({
        temperature: 2.6666666666666665,
        precipitation: 1.6666666666666667,
        wind: 1.3333333333333333,
      }),
    ).toEqual({
      positiveFactors: ['temperature'],
      neutralFactors: ['precipitation'],
      negativeFactors: ['wind'],
    });
  });

  it('does not mutate the input object', () => {
    const input: AggregatedFactorScores = {
      temperature: 3,
      precipitation: 2,
    };
    const snapshot = { ...input };

    buildRecommendationExplanation(input);

    expect(input).toEqual(snapshot);
  });

  it('is deterministic for the same input', () => {
    const input: AggregatedFactorScores = {
      temperature: 2.4,
      wind: 0,
      precipitation: 3,
    };

    expect(buildRecommendationExplanation(input)).toEqual(
      buildRecommendationExplanation(input),
    );
  });

  it('follows the existing C7.2 continuous thresholds', () => {
    // Boundary behavior owned by classifyAggregatedFactorScore:
    // >= 2.5 positive, >= 1.5 && < 2.5 neutral, < 1.5 negative.
    expect(
      buildRecommendationExplanation({
        temperature: 2.5,
        precipitation: 1.5,
        wind: 1.5 - Number.EPSILON,
      }),
    ).toEqual({
      positiveFactors: ['temperature'],
      neutralFactors: ['precipitation'],
      negativeFactors: ['wind'],
    });
  });
});
