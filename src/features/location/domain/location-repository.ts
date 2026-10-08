import type { Location } from '@/features/location/domain/location';

/** City/place search input (`query` is trimmed in the repository). */
export type SearchLocationsInput = Readonly<{
  query: string;
}>;

/** Port for location search; callers depend on domain `Location`, not a provider. */
export type LocationRepository = {
  searchLocations(
    input: SearchLocationsInput,
    signal?: AbortSignal,
  ): Promise<Location[]>;
};
