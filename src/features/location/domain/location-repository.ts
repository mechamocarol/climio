import type { Location } from '@/features/location/domain/location';

/**
 * Input for a city/place search.
 * `query` is the user-entered search term before trimming in the repository.
 */
export type SearchLocationsInput = Readonly<{
  query: string;
}>;

/**
 * Feature port for location search.
 * Callers receive domain models and do not depend on a specific geocoding provider.
 */
export type LocationRepository = {
  searchLocations(
    input: SearchLocationsInput,
    signal?: AbortSignal,
  ): Promise<Location[]>;
};
