import type { ActivityId } from '@/features/activity/domain/activities';
import { ACTIVITY_IDS } from '@/features/activity/domain/activities';
import {
  GUST_BLOCKING_THRESHOLD_KM_H,
  STANDARD_GUST_BANDS,
  STANDARD_UV_BANDS,
} from '@/features/recommendation/domain/recommendation-config';
import type { ActivityRules } from '@/features/recommendation/domain/types';

/**
 * Score bands store the continuous half-open interpretation of integer-style
 * ranges from business-rules.md (e.g. 15–25 → [15, 26)).
 * See §17.1. Gust bands use the explicit thresholds in §8.
 */

const GUST_ABOVE_45 = {
  type: 'gust_above',
  thresholdKmH: GUST_BLOCKING_THRESHOLD_KM_H,
} as const;

const STORM = { type: 'storm' } as const;
const SIGNIFICANT_RAIN = { type: 'significant_rain' } as const;

const runningRules: ActivityRules = {
  activityId: 'running',
  temperatureBands: [
    { min: 15, max: 26, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 12, max: 15, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 30, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 8, max: 12, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 30, max: 34, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 8, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 34, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 21, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 21, max: 41, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 41, max: 61, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 61, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 16, max: 26, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: STANDARD_GUST_BANDS,
  uvBands: null,
  weights: {
    temperature: 4,
    precipitation: 3,
    wind: 2,
    gust: 1,
  },
  blockingConditions: [STORM, GUST_ABOVE_45],
  prefersDaylight: true,
};

const skateboardingRules: ActivityRules = {
  activityId: 'skateboarding',
  temperatureBands: [
    { min: 16, max: 28, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 13, max: 16, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 28, max: 31, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 10, max: 13, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: 34, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 10, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 34, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 11, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 11, max: 21, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 21, max: 31, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 16, max: 21, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 21, max: 31, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: STANDARD_GUST_BANDS,
  uvBands: null,
  weights: {
    precipitation: 5,
    temperature: 2,
    wind: 2,
    gust: 3,
  },
  blockingConditions: [SIGNIFICANT_RAIN, STORM, GUST_ABOVE_45],
  prefersDaylight: false,
};

const cyclingRules: ActivityRules = {
  activityId: 'cycling',
  temperatureBands: [
    { min: 15, max: 29, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 12, max: 15, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 29, max: 32, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 8, max: 12, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 32, max: 35, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 8, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 35, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 21, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 21, max: 41, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 41, max: 61, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 61, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 16, max: 26, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: STANDARD_GUST_BANDS,
  uvBands: null,
  weights: {
    temperature: 3,
    precipitation: 3,
    wind: 4,
    gust: 3,
  },
  blockingConditions: [STORM, GUST_ABOVE_45],
  prefersDaylight: true,
};

const walkingRules: ActivityRules = {
  activityId: 'walking',
  temperatureBands: [
    { min: 12, max: 29, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 8, max: 12, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 29, max: 32, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 5, max: 8, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 32, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 5, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 31, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 31, max: 51, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 51, max: 71, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 71, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 21, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 21, max: 31, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 31, max: 41, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 41, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: STANDARD_GUST_BANDS,
  uvBands: null,
  weights: {
    temperature: 3,
    precipitation: 3,
    wind: 2,
    gust: 1,
  },
  blockingConditions: [STORM, GUST_ABOVE_45],
  prefersDaylight: true,
};

const petWalkRules: ActivityRules = {
  activityId: 'pet_walk',
  temperatureBands: [
    { min: 15, max: 26, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 12, max: 15, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 29, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 8, max: 12, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 29, max: 33, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 8, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 33, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 31, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 31, max: 51, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 51, max: 71, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 71, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 16, max: 26, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: null,
  uvBands: STANDARD_UV_BANDS,
  weights: {
    temperature: 5,
    precipitation: 2,
    wind: 2,
    uv: 2,
  },
  blockingConditions: [
    SIGNIFICANT_RAIN,
    STORM,
    { type: 'apparent_temperature_above', thresholdCelsius: 32 },
  ],
  prefersDaylight: false,
};

const childWalkRules: ActivityRules = {
  activityId: 'child_walk',
  temperatureBands: [
    { min: 16, max: 29, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 13, max: 16, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 29, max: 31, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 10, max: 13, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: 34, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 10, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 34, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 21, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 21, max: 41, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 41, max: 61, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 61, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 16, max: 26, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: null,
  uvBands: STANDARD_UV_BANDS,
  weights: {
    temperature: 4,
    precipitation: 3,
    wind: 2,
    uv: 3,
  },
  blockingConditions: [
    SIGNIFICANT_RAIN,
    STORM,
    { type: 'temperature_above', thresholdCelsius: 33 },
  ],
  prefersDaylight: false,
};

const beachRules: ActivityRules = {
  activityId: 'beach',
  temperatureBands: [
    { min: 24, max: 32, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 21, max: 24, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 32, max: 34, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 18, max: 21, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 34, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 18, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 11, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 11, max: 21, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 21, max: 41, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 41, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 16, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 16, max: 26, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: null,
  uvBands: null,
  weights: {
    temperature: 4,
    precipitation: 4,
    wind: 2,
  },
  blockingConditions: [SIGNIFICANT_RAIN, STORM],
  prefersDaylight: true,
};

const surfingRules: ActivityRules = {
  activityId: 'surfing',
  temperatureBands: [
    { min: 18, max: 31, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 15, max: 18, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 31, max: 34, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 12, max: 15, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 34, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 12, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 41, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 41, max: 61, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 61, max: 81, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 81, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: 10, max: 26, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 5, max: 10, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 31, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 0, max: 5, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: STANDARD_GUST_BANDS,
  uvBands: null,
  weights: {
    wind: 4,
    temperature: 2,
    precipitation: 1,
    gust: 3,
  },
  blockingConditions: [STORM, GUST_ABOVE_45],
  prefersDaylight: false,
};

const picnicRules: ActivityRules = {
  activityId: 'picnic',
  temperatureBands: [
    { min: 18, max: 28, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 15, max: 18, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 28, max: 31, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 10, max: 15, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: 35, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 10, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 35, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 11, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 11, max: 21, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 21, max: 31, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: null, max: 11, minInclusive: false, maxInclusive: false, score: 3 },
    { min: 11, max: 16, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 16, max: 26, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 26, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: null,
  uvBands: null,
  weights: {
    precipitation: 5,
    temperature: 3,
    wind: 3,
  },
  blockingConditions: [SIGNIFICANT_RAIN, STORM, GUST_ABOVE_45],
  prefersDaylight: true,
};

const kiteRules: ActivityRules = {
  activityId: 'kite',
  temperatureBands: [
    { min: 15, max: 29, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 12, max: 15, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 29, max: 32, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 8, max: 12, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 32, max: 35, minInclusive: true, maxInclusive: false, score: 1 },
    { min: null, max: 8, minInclusive: false, maxInclusive: false, score: 0 },
    { min: 35, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  precipitationBands: [
    { min: 0, max: 11, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 11, max: 21, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 21, max: 31, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  windBands: [
    { min: 10, max: 26, minInclusive: true, maxInclusive: false, score: 3 },
    { min: 5, max: 10, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 26, max: 31, minInclusive: true, maxInclusive: false, score: 2 },
    { min: 0, max: 5, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 31, max: 36, minInclusive: true, maxInclusive: false, score: 1 },
    { min: 36, max: null, minInclusive: true, maxInclusive: false, score: 0 },
  ],
  gustBands: STANDARD_GUST_BANDS,
  uvBands: null,
  weights: {
    wind: 5,
    gust: 3,
    precipitation: 3,
    temperature: 1,
  },
  blockingConditions: [SIGNIFICANT_RAIN, STORM, GUST_ABOVE_45],
  prefersDaylight: true,
};

export const ACTIVITY_RULES: readonly ActivityRules[] = [
  runningRules,
  skateboardingRules,
  cyclingRules,
  walkingRules,
  petWalkRules,
  childWalkRules,
  beachRules,
  surfingRules,
  picnicRules,
  kiteRules,
] as const;

export const ACTIVITY_RULES_BY_ID: Readonly<Record<ActivityId, ActivityRules>> = {
  running: runningRules,
  skateboarding: skateboardingRules,
  cycling: cyclingRules,
  walking: walkingRules,
  pet_walk: petWalkRules,
  child_walk: childWalkRules,
  beach: beachRules,
  surfing: surfingRules,
  picnic: picnicRules,
  kite: kiteRules,
};

export function getActivityRules(activityId: ActivityId): ActivityRules {
  return ACTIVITY_RULES_BY_ID[activityId];
}

export function listConfiguredActivityIds(): readonly ActivityId[] {
  return ACTIVITY_RULES.map((rules) => rules.activityId);
}

/** Ensures every catalog activity has exactly one rules entry. */
export function assertActivityRulesCatalogIntegrity(): void {
  const configuredIds = listConfiguredActivityIds();

  if (configuredIds.length !== ACTIVITY_IDS.length) {
    throw new Error(
      `Expected ${ACTIVITY_IDS.length} activity rules, found ${configuredIds.length}`,
    );
  }

  for (const id of ACTIVITY_IDS) {
    if (!configuredIds.includes(id)) {
      throw new Error(`Missing activity rules for ${id}`);
    }
  }

  const uniqueIds = new Set(configuredIds);
  if (uniqueIds.size !== configuredIds.length) {
    throw new Error('Duplicate activity rules detected');
  }
}
