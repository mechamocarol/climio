import { useQuery } from '@tanstack/react-query';

import { useLocationRepository } from '@/providers/repositories-provider';

export function searchLocationsQueryKey(query: string) {
  return ['location', 'search', { query }] as const;
}

function isValidSearchQuery(query: string): boolean {
  return query.trim().length > 0;
}

/**
 * Searches places by an explicit query string.
 * Does not read Plan stores, debounce input, or run recommendation logic.
 */
export function useSearchLocations(query: string) {
  const locationRepository = useLocationRepository();
  const trimmedQuery = query.trim();
  const enabled = isValidSearchQuery(query);

  return useQuery({
    queryKey: enabled
      ? searchLocationsQueryKey(trimmedQuery)
      : (['location', 'search', 'disabled'] as const),
    queryFn: ({ signal }) => {
      if (!isValidSearchQuery(query)) {
        throw new Error('Location search query ran without valid input');
      }

      return locationRepository.searchLocations(
        { query: trimmedQuery },
        signal,
      );
    },
    enabled,
  });
}
