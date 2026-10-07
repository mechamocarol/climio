import type { Location } from '@/features/location/domain/location';
import {
  getDefaultPlanDate,
  isCalendarDate,
  isPlanReadyForForecast,
  isPlanReadyForRecommendation,
  toHourlyForecastInput,
  type PlanState,
} from '@/features/plan/domain/plan';

function createLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: '3448439',
    name: 'São Paulo',
    region: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5475,
    longitude: -46.63611,
    timezone: 'America/Sao_Paulo',
    ...overrides,
  };
}

function createPlan(overrides: Partial<PlanState> = {}): PlanState {
  return {
    activityId: null,
    location: null,
    date: '2026-10-08',
    ...overrides,
  };
}

describe('plan helpers', () => {
  it('isPlanReadyForForecast returns true when location and date exist', () => {
    const plan = createPlan({
      location: createLocation(),
      date: '2026-10-08',
    });

    expect(isPlanReadyForForecast(plan)).toBe(true);
  });

  it('isPlanReadyForForecast returns false without location', () => {
    const plan = createPlan({
      location: null,
      date: '2026-10-08',
    });

    expect(isPlanReadyForForecast(plan)).toBe(false);
  });

  it('isPlanReadyForForecast returns false without date', () => {
    const plan = createPlan({
      location: createLocation(),
      date: '',
    });

    expect(isPlanReadyForForecast(plan)).toBe(false);
  });

  it('isPlanReadyForForecast does not require an activity', () => {
    const plan = createPlan({
      activityId: null,
      location: createLocation(),
      date: '2026-10-08',
    });

    expect(isPlanReadyForForecast(plan)).toBe(true);
  });

  it('isPlanReadyForRecommendation returns true when activity, location and date exist', () => {
    const plan = createPlan({
      activityId: 'running',
      location: createLocation(),
      date: '2026-10-08',
    });

    expect(isPlanReadyForRecommendation(plan)).toBe(true);
  });

  it('isPlanReadyForRecommendation returns false without activity', () => {
    const plan = createPlan({
      activityId: null,
      location: createLocation(),
      date: '2026-10-08',
    });

    expect(isPlanReadyForRecommendation(plan)).toBe(false);
  });

  it('toHourlyForecastInput returns latitude, longitude and date', () => {
    const plan = createPlan({
      location: createLocation({
        latitude: -22.9,
        longitude: -47.06,
      }),
      date: '2026-10-09',
    });

    expect(toHourlyForecastInput(plan)).toEqual({
      latitude: -22.9,
      longitude: -47.06,
      date: '2026-10-09',
    });
  });

  it('toHourlyForecastInput returns null when forecast requirements are missing', () => {
    expect(
      toHourlyForecastInput(
        createPlan({
          location: null,
          date: '2026-10-08',
        }),
      ),
    ).toBeNull();

    expect(
      toHourlyForecastInput(
        createPlan({
          location: createLocation(),
          date: '',
        }),
      ),
    ).toBeNull();
  });

  it('helper functions do not mutate the Plan', () => {
    const location = createLocation();
    const plan = createPlan({
      activityId: 'cycling',
      location,
      date: '2026-10-08',
    });
    const snapshot = structuredClone(plan);

    isPlanReadyForForecast(plan);
    isPlanReadyForRecommendation(plan);
    toHourlyForecastInput(plan);

    expect(plan).toEqual(snapshot);
    expect(plan.location).toBe(location);
  });

  it('getDefaultPlanDate returns a valid YYYY-MM-DD device-local date', () => {
    const fixed = new Date(2026, 9, 6); // local calendar: 2026-10-06
    const date = getDefaultPlanDate(fixed);

    expect(date).toBe('2026-10-06');
    expect(isCalendarDate(date)).toBe(true);
  });
});
