import type { Location } from '@/features/location/domain/location';

const MAX_RECENT_LOCATIONS = 5;

let recentLocations: Location[] = [];

/** Remembers a location for the in-session "Buscas recentes" list. */
export function rememberRecentLocation(location: Location): void {
  recentLocations = [
    location,
    ...recentLocations.filter((item) => item.id !== location.id),
  ].slice(0, MAX_RECENT_LOCATIONS);
}

export function listRecentLocations(): readonly Location[] {
  return recentLocations;
}

export function formatLocationDetail(location: Location): string {
  return [location.region, location.country].filter(Boolean).join(' · ');
}
