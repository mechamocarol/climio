import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { openMeteoLocationRepository } from '@/features/location/data/open-meteo-location-repository';
import type { LocationRepository } from '@/features/location/domain/location-repository';
import { openMeteoWeatherRepository } from '@/features/weather/data/open-meteo-weather-repository';
import type { WeatherRepository } from '@/features/weather/domain/weather-repository';

export type Repositories = Readonly<{
  weather: WeatherRepository;
  location: LocationRepository;
}>;

type RepositoriesProviderProps = {
  children: ReactNode;
  /** Test / alternate repository overrides. */
  repositories?: Partial<Repositories>;
};

const RepositoriesContext = createContext<Repositories | null>(null);

/** Injects weather and location repositories (Open-Meteo by default). */
export function RepositoriesProvider({
  children,
  repositories,
}: RepositoriesProviderProps) {
  const value = useMemo<Repositories>(
    () => ({
      weather: repositories?.weather ?? openMeteoWeatherRepository,
      location: repositories?.location ?? openMeteoLocationRepository,
    }),
    [repositories?.weather, repositories?.location],
  );

  return (
    <RepositoriesContext.Provider value={value}>
      {children}
    </RepositoriesContext.Provider>
  );
}

export function useWeatherRepository(): WeatherRepository {
  const context = useContext(RepositoriesContext);

  if (context === null) {
    throw new Error(
      'useWeatherRepository must be used within a RepositoriesProvider',
    );
  }

  return context.weather;
}

export function useLocationRepository(): LocationRepository {
  const context = useContext(RepositoriesContext);

  if (context === null) {
    throw new Error(
      'useLocationRepository must be used within a RepositoriesProvider',
    );
  }

  return context.location;
}
