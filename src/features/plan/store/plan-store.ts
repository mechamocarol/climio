import { create } from 'zustand';

import type { ActivityId } from '@/features/activity/domain/activities';
import type { Location } from '@/features/location/domain/location';
import {
  getDefaultPlanDate,
  type PlanState,
} from '@/features/plan/domain/plan';

type PlanActions = {
  setActivityId: (activityId: ActivityId | null) => void;
  setLocation: (location: Location | null) => void;
  setDate: (date: string) => void;
  resetPlan: () => void;
};

export type PlanStore = PlanState & PlanActions;

export function createInitialPlanState(
  now: Date = new Date(),
): PlanState {
  return {
    activityId: null,
    location: null,
    date: getDefaultPlanDate(now),
  };
}

/** Session Plan selections (Activity + Location + Date). No server state. */
export const usePlanStore = create<PlanStore>((set) => ({
  ...createInitialPlanState(),
  setActivityId: (activityId) => set({ activityId }),
  setLocation: (location) => set({ location }),
  setDate: (date) => set({ date }),
  resetPlan: () => set(createInitialPlanState()),
}));
