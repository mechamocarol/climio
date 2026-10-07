import { fetchOpenMeteoGeocoding } from '@/features/location/data/open-meteo-geocoding.api';
import { mapOpenMeteoGeocodingToLocations } from '@/features/location/data/open-meteo-geocoding.mapper';
import { parseOpenMeteoGeocodingResponse } from '@/features/location/data/open-meteo-geocoding.schema';
import type {
  LocationRepository,
  SearchLocationsInput,
} from '@/features/location/domain/location-repository';

/**
 * Open-Meteo-backed LocationRepository.
 * Orchestrates HTTP fetch → Zod parse → domain mapping only.
 */
export const openMeteoLocationRepository: LocationRepository = {
  async searchLocations(input: SearchLocationsInput, signal?: AbortSignal) {
    const query = input.query.trim();
    if (query.length === 0) {
      return [];
    }

    const payload = await fetchOpenMeteoGeocoding({ name: query }, signal);
    const response = parseOpenMeteoGeocodingResponse(payload);
    return mapOpenMeteoGeocodingToLocations(response);
  },
};
