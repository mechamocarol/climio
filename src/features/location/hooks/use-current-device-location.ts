import { useState } from 'react';

import {
  resolveCurrentLocation,
  type ResolveCurrentLocationFailureReason,
} from '@/features/location/data/resolve-current-location';
import type { Location } from '@/features/location/domain/location';

export type CurrentDeviceLocationStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

export type CurrentDeviceLocationError = Readonly<{
  reason: ResolveCurrentLocationFailureReason;
  message?: string;
}>;

/**
 * Imperative resolution of the device GPS into a domain `Location`.
 * Does not write to Plan / Zustand — callers pass the result to `onSelect`.
 */
export function useCurrentDeviceLocation() {
  const [status, setStatus] = useState<CurrentDeviceLocationStatus>('idle');
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<CurrentDeviceLocationError | null>(null);

  async function requestCurrentLocation(): Promise<Location | null> {
    setStatus('loading');
    setError(null);

    const result = await resolveCurrentLocation();

    if (result.ok) {
      setLocation(result.location);
      setError(null);
      setStatus('success');
      return result.location;
    }

    setLocation(null);
    setError({
      reason: result.reason,
      message: result.message,
    });
    setStatus('error');
    return null;
  }

  return {
    status,
    location,
    error,
    isLoading: status === 'loading',
    requestCurrentLocation,
  };
}
