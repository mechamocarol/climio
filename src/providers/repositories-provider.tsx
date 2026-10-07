import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { openMeteoWeatherRepository } from '@/features/weather/data/open-meteo-weather-repository';
import type { WeatherRepository } from '@/features/weather/domain/weather-repository';

export type Repositories = Readonly<{
  weather: WeatherRepository;
}>;

type RepositoriesProviderProps = {
  children: ReactNode;
  /** Partial overrides for tests or alternate implementations. */
  repositories?: Partial<Repositories>;
};

const RepositoriesContext = createContext<Repositories | null>(null);

/**
 * Minimal repository injection for application hooks.
 * Defaults to the Open-Meteo weather repository; overrides are for tests.
 */
export function RepositoriesProvider({
  children,
  repositories,
}: RepositoriesProviderProps) {
  const value = useMemo<Repositories>(
    () => ({
      weather: repositories?.weather ?? openMeteoWeatherRepository,
    }),
    [repositories?.weather],
  );

  return (
    <RepositoriesContext.Provider value={value}>
      {children}
    </RepositoriesContext.Provider>
  );
}

/** Returns the injected WeatherRepository. */
export function useWeatherRepository(): WeatherRepository {
  const context = useContext(RepositoriesContext);

  if (context === null) {
    throw new Error(
      'useWeatherRepository must be used within a RepositoriesProvider',
    );
  }

  return context.weather;
}
