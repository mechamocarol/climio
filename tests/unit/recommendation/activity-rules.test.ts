import { ACTIVITY_IDS, isActivityId } from '@/features/activity/domain/activities';
import {
  ACTIVITY_RULES,
  ACTIVITY_RULES_BY_ID,
  assertActivityRulesCatalogIntegrity,
  listConfiguredActivityIds,
} from '@/features/recommendation/domain/activity-rules';
import {
  ALLOW_IDEAL_SINGLE_HOUR_FALLBACK,
  CHILD_WALK_ACTIVITY_HOURS,
  CLASSIFICATION_THRESHOLDS,
  DAYLIGHT_TIE_TOLERANCE_PERCENTAGE_POINTS,
  DEFAULT_OUTDOOR_ACTIVITY_HOURS,
  GUST_BLOCKING_THRESHOLD_KM_H,
  MAX_ALTERNATIVE_PERIODS,
  PREFERRED_WINDOW_DURATION_HOURS,
  SIGNIFICANT_RAIN,
  STANDARD_GUST_BANDS,
  STORM_WEATHER_CODES,
} from '@/features/recommendation/domain/recommendation-config';
import type { ScoreFactor } from '@/features/recommendation/domain/types';

const SCORE_FACTORS: readonly ScoreFactor[] = [
  'temperature',
  'precipitation',
  'wind',
  'gust',
  'uv',
];

const DAYLIGHT_ACTIVITY_IDS = new Set([
  'beach',
  'walking',
  'running',
  'cycling',
  'picnic',
  'kite',
]);

describe('activity catalog and recommendation configuration integrity', () => {
  it('defines exactly 10 MVP activities', () => {
    expect(ACTIVITY_IDS).toHaveLength(10);
  });

  it('defines exactly one ruleset per activity', () => {
    expect(listConfiguredActivityIds()).toHaveLength(10);
    assertActivityRulesCatalogIntegrity();
  });

  it('rejects duplicated activity rules', () => {
    const ids = ACTIVITY_RULES.map((rules) => rules.activityId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only valid activity ids in the rules catalog', () => {
    for (const rules of ACTIVITY_RULES) {
      expect(isActivityId(rules.activityId)).toBe(true);
      expect(ACTIVITY_RULES_BY_ID[rules.activityId]).toBe(rules);
    }
  });

  it('requires temperature, precipitation and wind bands for every activity', () => {
    for (const rules of ACTIVITY_RULES) {
      expect(rules.temperatureBands.length).toBeGreaterThan(0);
      expect(rules.precipitationBands.length).toBeGreaterThan(0);
      expect(rules.windBands.length).toBeGreaterThan(0);
    }
  });

  it('requires at least one factor weight per activity and only known factors', () => {
    for (const rules of ACTIVITY_RULES) {
      const weightEntries = Object.entries(rules.weights);
      expect(weightEntries.length).toBeGreaterThan(0);

      for (const [factor, weight] of weightEntries) {
        expect(SCORE_FACTORS).toContain(factor);
        expect(typeof weight).toBe('number');
        expect(weight).toBeGreaterThan(0);
      }
    }
  });

  it('includes UV bands only for pet_walk and child_walk', () => {
    for (const rules of ACTIVITY_RULES) {
      if (rules.activityId === 'pet_walk' || rules.activityId === 'child_walk') {
        expect(rules.uvBands).not.toBeNull();
        expect(rules.weights.uv).toBeDefined();
      } else {
        expect(rules.uvBands).toBeNull();
        expect(rules.weights.uv).toBeUndefined();
      }
    }
  });

  it('includes gust bands whenever gust has a weight', () => {
    for (const rules of ACTIVITY_RULES) {
      if (rules.weights.gust !== undefined) {
        expect(rules.gustBands).not.toBeNull();
      }
    }
  });

  it('marks daylight preference only for the documented activities', () => {
    for (const rules of ACTIVITY_RULES) {
      expect(rules.prefersDaylight).toBe(DAYLIGHT_ACTIVITY_IDS.has(rules.activityId));
    }
  });

  it('configures default outdoor activity hours 05–22 except child_walk 06–21', () => {
    for (const rules of ACTIVITY_RULES) {
      if (rules.activityId === 'child_walk') {
        expect(rules.activityHours).toEqual(CHILD_WALK_ACTIVITY_HOURS);
      } else {
        expect(rules.activityHours).toEqual(DEFAULT_OUTDOOR_ACTIVITY_HOURS);
      }
    }
  });

  it('exposes the documented global recommendation constants', () => {
    expect(CLASSIFICATION_THRESHOLDS.IDEAL).toEqual({ min: 75, max: 100 });
    expect(CLASSIFICATION_THRESHOLDS.ACCEPTABLE).toEqual({ min: 55, max: 74 });
    expect(CLASSIFICATION_THRESHOLDS.UNFAVORABLE).toEqual({ min: 35, max: 54 });
    expect(CLASSIFICATION_THRESHOLDS.INADEQUATE).toEqual({ min: 0, max: 34 });
    expect(PREFERRED_WINDOW_DURATION_HOURS).toBe(2);
    expect(ALLOW_IDEAL_SINGLE_HOUR_FALLBACK).toBe(true);
    expect(MAX_ALTERNATIVE_PERIODS).toBe(5);
    expect(DAYLIGHT_TIE_TOLERANCE_PERCENTAGE_POINTS).toBe(5);
    expect(DEFAULT_OUTDOOR_ACTIVITY_HOURS).toEqual({ startHour: 5, endHour: 22 });
    expect(CHILD_WALK_ACTIVITY_HOURS).toEqual({ startHour: 8, endHour: 21 });
    expect(STORM_WEATHER_CODES).toEqual([95, 96, 97, 99]);
    expect(SIGNIFICANT_RAIN).toEqual({
      precipitationProbabilityMin: 60,
      precipitationMmPerHourMin: 2,
    });
    expect(GUST_BLOCKING_THRESHOLD_KM_H).toBe(45);
  });

  it('configures gust score bands with the final continuous thresholds', () => {
    expect(STANDARD_GUST_BANDS).toEqual([
      { min: null, max: 25, minInclusive: false, maxInclusive: true, score: 3 },
      { min: 25, max: 35, minInclusive: false, maxInclusive: true, score: 2 },
      { min: 35, max: 45, minInclusive: false, maxInclusive: true, score: 1 },
      { min: 45, max: null, minInclusive: false, maxInclusive: false, score: 0 },
    ]);
  });

  it('keeps gust blocking strictly above 45 km/h', () => {
    for (const rules of ACTIVITY_RULES) {
      for (const condition of rules.blockingConditions) {
        if (condition.type === 'gust_above') {
          expect(condition.thresholdKmH).toBe(45);
        }
      }
    }
  });
});
