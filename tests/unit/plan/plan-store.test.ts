import type { Location } from '@/features/location/domain/location';
import { isCalendarDate } from '@/features/plan/domain/plan';
import {
  createInitialPlanState,
  usePlanStore,
} from '@/features/plan/store/plan-store';

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

describe('usePlanStore', () => {
  beforeEach(() => {
    usePlanStore.setState(createInitialPlanState(new Date(2026, 9, 6)));
  });

  it('defaults activityId to null', () => {
    expect(usePlanStore.getState().activityId).toBeNull();
  });

  it('defaults location to null', () => {
    expect(usePlanStore.getState().location).toBeNull();
  });

  it('defaults date to a valid YYYY-MM-DD', () => {
    const { date } = usePlanStore.getState();

    expect(date).toBe('2026-10-06');
    expect(isCalendarDate(date)).toBe(true);
  });

  it('sets activityId', () => {
    usePlanStore.getState().setActivityId('running');

    expect(usePlanStore.getState().activityId).toBe('running');
  });

  it('clears activityId with null', () => {
    usePlanStore.getState().setActivityId('beach');
    usePlanStore.getState().setActivityId(null);

    expect(usePlanStore.getState().activityId).toBeNull();
  });

  it('sets location', () => {
    const location = createLocation();

    usePlanStore.getState().setLocation(location);

    expect(usePlanStore.getState().location).toEqual(location);
  });

  it('clears location with null', () => {
    usePlanStore.getState().setLocation(createLocation());
    usePlanStore.getState().setLocation(null);

    expect(usePlanStore.getState().location).toBeNull();
  });

  it('sets date', () => {
    usePlanStore.getState().setDate('2026-10-12');

    expect(usePlanStore.getState().date).toBe('2026-10-12');
  });

  it('resetPlan restores the initial state', () => {
    usePlanStore.getState().setActivityId('picnic');
    usePlanStore.getState().setLocation(createLocation());
    usePlanStore.getState().setDate('2026-11-01');

    usePlanStore.getState().resetPlan();

    const state = usePlanStore.getState();
    expect(state.activityId).toBeNull();
    expect(state.location).toBeNull();
    expect(isCalendarDate(state.date)).toBe(true);
  });

  it('does not expose repository or recommendation orchestration APIs', () => {
    const state = usePlanStore.getState();
    const keys = Object.keys(state).sort();

    expect(keys).toEqual([
      'activityId',
      'date',
      'location',
      'resetPlan',
      'setActivityId',
      'setDate',
      'setLocation',
    ]);
    expect(state).not.toHaveProperty('getHourlyForecast');
    expect(state).not.toHaveProperty('searchLocations');
    expect(state).not.toHaveProperty('recommendActivity');
  });
});
