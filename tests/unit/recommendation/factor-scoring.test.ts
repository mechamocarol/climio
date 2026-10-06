import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import {
  scoreGust,
  scoreNumericValue,
  scorePrecipitation,
  scoreTemperature,
  scoreUv,
  scoreWind,
} from '@/features/recommendation/domain/factor-scoring';
import { STANDARD_GUST_BANDS } from '@/features/recommendation/domain/recommendation-config';
import type { ScoreBands } from '@/features/recommendation/domain/types';

describe('scoreNumericValue', () => {
  const halfOpenBands: ScoreBands = [
    { min: 15, max: 26, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 26, max: 30, minInclusive: true, maxInclusive: false, score: 2 },
    { min: null, max: 15, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 30, max: null, minInclusive: true, maxInclusive: false, score: 1 },
  ];

  it('returns null for null or NaN without inventing a score', () => {
    expect(scoreNumericValue(null, halfOpenBands)).toBeNull();
    expect(scoreNumericValue(Number.NaN, halfOpenBands)).toBeNull();
  });

  it('respects inclusive lower and exclusive upper bounds', () => {
    expect(scoreNumericValue(15, halfOpenBands)).toBe(3);
    expect(scoreNumericValue(25.999, halfOpenBands)).toBe(3);
    expect(scoreNumericValue(26, halfOpenBands)).toBe(2);
    expect(scoreNumericValue(29.999, halfOpenBands)).toBe(2);
    expect(scoreNumericValue(30, halfOpenBands)).toBe(1);
  });

  it('respects open lower bound (value must be strictly greater than min)', () => {
    const bands: ScoreBands = [
      { min: 25, max: 35, minInclusive: false, maxInclusive: true, score: 2 },
    ];
    expect(scoreNumericValue(25, bands)).toBeNull();
    expect(scoreNumericValue(25.0001, bands)).toBe(2);
    expect(scoreNumericValue(35, bands)).toBe(2);
  });

  it('respects closed upper bound and open upper bound', () => {
    const closedMax: ScoreBands = [
      { min: null, max: 25, minInclusive: false, maxInclusive: true, score: 3 },
    ];
    const openMax: ScoreBands = [
      { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    ];

    expect(scoreNumericValue(25, closedMax)).toBe(3);
    expect(scoreNumericValue(25.1, closedMax)).toBeNull();
    expect(scoreNumericValue(15.999, openMax)).toBe(3);
    expect(scoreNumericValue(16, openMax)).toBeNull();
  });

  it('does not round decimal values before matching', () => {
    expect(scoreNumericValue(25.5, halfOpenBands)).toBe(3);
    expect(scoreNumericValue(25.999, halfOpenBands)).toBe(3);
  });

  it('is deterministic for the same inputs', () => {
    const a = scoreNumericValue(22.4, halfOpenBands);
    const b = scoreNumericValue(22.4, halfOpenBands);
    expect(a).toBe(b);
    expect(a).toBe(3);
  });
});

describe('scoreTemperature', () => {
  const running = getActivityRules('running');

  it('scores running temperature bands at boundaries and decimals', () => {
    expect(scoreTemperature(running, 15)).toBe(3);
    expect(scoreTemperature(running, 25.5)).toBe(3);
    expect(scoreTemperature(running, 25.999)).toBe(3);
    expect(scoreTemperature(running, 26)).toBe(2);
    expect(scoreTemperature(running, 12)).toBe(2);
    expect(scoreTemperature(running, 14.999)).toBe(2);
    expect(scoreTemperature(running, 8)).toBe(1);
    expect(scoreTemperature(running, 11.999)).toBe(1);
    expect(scoreTemperature(running, 7.999)).toBe(0);
    expect(scoreTemperature(running, 34)).toBe(0);
    expect(scoreTemperature(running, 33.999)).toBe(1);
  });

  it('returns null when temperature is missing', () => {
    expect(scoreTemperature(running, null)).toBeNull();
  });
});

describe('scorePrecipitation', () => {
  const skateboarding = getActivityRules('skateboarding');

  it('scores precipitation probability with half-open bands', () => {
    expect(scorePrecipitation(skateboarding, 0)).toBe(3);
    expect(scorePrecipitation(skateboarding, 10.999)).toBe(3);
    expect(scorePrecipitation(skateboarding, 11)).toBe(2);
    expect(scorePrecipitation(skateboarding, 20.999)).toBe(2);
    expect(scorePrecipitation(skateboarding, 21)).toBe(1);
    expect(scorePrecipitation(skateboarding, 30.999)).toBe(1);
    expect(scorePrecipitation(skateboarding, 31)).toBe(0);
  });

  it('returns null when precipitation probability is missing', () => {
    expect(scorePrecipitation(skateboarding, null)).toBeNull();
  });
});

describe('scoreWind', () => {
  const picnic = getActivityRules('picnic');

  it('scores picnic wind bands including exclusive upper bound for calm wind', () => {
    expect(scoreWind(picnic, 0)).toBe(3);
    expect(scoreWind(picnic, 10.999)).toBe(3);
    expect(scoreWind(picnic, 11)).toBe(2);
    expect(scoreWind(picnic, 15.999)).toBe(2);
    expect(scoreWind(picnic, 16)).toBe(1);
    expect(scoreWind(picnic, 25.999)).toBe(1);
    expect(scoreWind(picnic, 26)).toBe(0);
  });

  it('returns null when wind speed is missing', () => {
    expect(scoreWind(picnic, null)).toBeNull();
  });
});

describe('scoreGust', () => {
  const running = getActivityRules('running');
  const petWalk = getActivityRules('pet_walk');

  it('uses ActivityRules.gustBands (standard thresholds) without local thresholds', () => {
    expect(running.gustBands).toBe(STANDARD_GUST_BANDS);
  });

  it('scores the documented continuous gust thresholds', () => {
    expect(scoreGust(running, 0)).toBe(3);
    expect(scoreGust(running, 25)).toBe(3);
    expect(scoreGust(running, 25.0001)).toBe(2);
    expect(scoreGust(running, 35)).toBe(2);
    expect(scoreGust(running, 35.0001)).toBe(1);
    expect(scoreGust(running, 45)).toBe(1);
    expect(scoreGust(running, 45.0001)).toBe(0);
    expect(scoreGust(running, 80)).toBe(0);
  });

  it('returns null when gust value is missing', () => {
    expect(scoreGust(running, null)).toBeNull();
  });

  it('returns null when the activity has no gust bands', () => {
    expect(petWalk.gustBands).toBeNull();
    expect(scoreGust(petWalk, 20)).toBeNull();
    expect(scoreGust(petWalk, null)).toBeNull();
  });
});

describe('scoreUv', () => {
  const petWalk = getActivityRules('pet_walk');
  const running = getActivityRules('running');

  it('scores UV using pet_walk bands at half-open boundaries', () => {
    expect(scoreUv(petWalk, 0)).toBe(3);
    expect(scoreUv(petWalk, 2.999)).toBe(3);
    expect(scoreUv(petWalk, 3)).toBe(2);
    expect(scoreUv(petWalk, 5.999)).toBe(2);
    expect(scoreUv(petWalk, 6)).toBe(1);
    expect(scoreUv(petWalk, 7.999)).toBe(1);
    expect(scoreUv(petWalk, 8)).toBe(0);
    expect(scoreUv(petWalk, 10.999)).toBe(0);
    expect(scoreUv(petWalk, 11)).toBe(0);
    expect(scoreUv(petWalk, 15)).toBe(0);
  });

  it('returns null when UV is missing or activity has no UV bands', () => {
    expect(scoreUv(petWalk, null)).toBeNull();
    expect(running.uvBands).toBeNull();
    expect(scoreUv(running, 4)).toBeNull();
  });
});
