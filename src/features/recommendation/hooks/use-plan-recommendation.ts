import { useMemo } from 'react';

import {
  isPlanReadyForRecommendation,
  toHourlyForecastInput,
  type PlanState,
} from '@/features/plan/domain/plan';
import { usePlanStore } from '@/features/plan/store/plan-store';
import { getActivityRules } from '@/features/recommendation/domain/activity-rules';
import { recommendActivity } from '@/features/recommendation/domain/recommendation-engine';
import type { RecommendationResult } from '@/features/recommendation/domain/types';
import { useHourlyForecast } from '@/features/weather/hooks/use-hourly-forecast';

/**
 * Thin orchestration: Plan → forecast input → Open-Meteo → recommendActivity.
 * Keeps API/query and engine composition out of screen components.
 */
export function usePlanRecommendation() {
  const activityId = usePlanStore((state) => state.activityId);
  const location = usePlanStore((state) => state.location);
  const date = usePlanStore((state) => state.date);

  const plan = useMemo<PlanState>(
    () => ({ activityId, location, date }),
    [activityId, date, location],
  );

  const planReady = isPlanReadyForRecommendation(plan);
  const forecastInput = toHourlyForecastInput(plan);
  const forecastQuery = useHourlyForecast(forecastInput);

  const recommendation = useMemo<RecommendationResult | null>(() => {
    if (!planReady || activityId === null || !forecastQuery.data) {
      return null;
    }

    return recommendActivity({
      weather: forecastQuery.data,
      rules: getActivityRules(activityId),
    });
  }, [activityId, forecastQuery.data, planReady]);

  return {
    plan,
    planReady,
    forecastInput,
    forecastQuery,
    recommendation,
  };
}
