import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SummaryScreen from '@/app/summary';
import type { Location } from '@/features/location/domain/location';
import { toHourlyForecastInput } from '@/features/plan/domain/plan';
import {
  createInitialPlanState,
  usePlanStore,
} from '@/features/plan/store/plan-store';
import { usePlanRecommendation } from '@/features/recommendation/hooks/use-plan-recommendation';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';
import type { WeatherRepository } from '@/features/weather/domain/weather-repository';
import {
  hourlyForecastQueryKey,
  useHourlyForecast,
} from '@/features/weather/hooks/use-hourly-forecast';
import { createTestQueryClient } from '@/infrastructure/api/query-client';
import { RepositoriesProvider } from '@/providers/repositories-provider';
import { ThemeProvider } from '@/providers/theme-provider';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

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

function createWeather(overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    timestamp: '2026-10-08T14:00',
    temperature: 23.6,
    apparentTemperature: 25.9,
    precipitationProbability: 10,
    precipitation: 0,
    windSpeed: 12,
    windGust: 20,
    uvIndex: 5,
    weatherCode: 1,
    isDaylight: true,
    ...overrides,
  };
}

describe('Summary forecast prefetch', () => {
  const cleanups: Array<() => Promise<void>> = [];

  beforeEach(() => {
    usePlanStore.setState(createInitialPlanState(new Date(2026, 9, 8)));
  });

  afterEach(async () => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();
      await cleanup?.();
    }
    usePlanStore.setState(createInitialPlanState(new Date(2026, 9, 8)));
  });

  function createWrapper(
    repository: WeatherRepository,
    queryClient = createTestQueryClient(),
  ) {
    queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        gcTime: 0,
      },
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
          <QueryClientProvider client={queryClient}>
            <RepositoriesProvider repositories={{ weather: repository }}>
              <ThemeProvider>{children}</ThemeProvider>
            </RepositoriesProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      );
    }

    return { Wrapper, queryClient };
  }

  it('starts the hourly forecast query on Summary when location and date exist', async () => {
    const weather = [createWeather()];
    const getHourlyForecast = jest.fn().mockResolvedValue(weather);
    const repository: WeatherRepository = { getHourlyForecast };
    const location = createLocation();

    usePlanStore.setState({
      activityId: 'walking',
      location,
      date: '2026-10-08',
    });

    const { Wrapper, queryClient } = createWrapper(repository);
    const rendered = await render(<SummaryScreen />, { wrapper: Wrapper });
    cleanups.push(async () => {
      rendered.unmount();
      queryClient.clear();
    });

    expect(rendered.getByText('Quase lá')).toBeTruthy();

    await waitFor(() => {
      expect(getHourlyForecast).toHaveBeenCalledTimes(1);
    });

    expect(getHourlyForecast).toHaveBeenCalledWith(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        date: '2026-10-08',
      },
      expect.any(AbortSignal),
    );
    expect(
      queryClient.getQueryData(
        hourlyForecastQueryKey({
          latitude: location.latitude,
          longitude: location.longitude,
          date: '2026-10-08',
        }),
      ),
    ).toEqual(weather);
  });

  it('does not start the forecast query when location is missing', async () => {
    const getHourlyForecast = jest.fn().mockResolvedValue([]);
    const repository: WeatherRepository = { getHourlyForecast };

    usePlanStore.setState({
      activityId: 'walking',
      location: null,
      date: '2026-10-08',
    });

    const { Wrapper, queryClient } = createWrapper(repository);
    const rendered = await render(<SummaryScreen />, { wrapper: Wrapper });
    cleanups.push(async () => {
      rendered.unmount();
      queryClient.clear();
    });

    expect(toHourlyForecastInput(usePlanStore.getState())).toBeNull();
    expect(getHourlyForecast).not.toHaveBeenCalled();
  });

  it('lets Result reuse the same TanStack Query cache without a second fetch', async () => {
    const weather = [createWeather()];
    const getHourlyForecast = jest.fn().mockResolvedValue(weather);
    const repository: WeatherRepository = { getHourlyForecast };
    const location = createLocation();
    const input = {
      latitude: location.latitude,
      longitude: location.longitude,
      date: '2026-10-08',
    };

    usePlanStore.setState({
      activityId: 'walking',
      location,
      date: '2026-10-08',
    });

    // Match app staleTime so a warm Summary cache is reused by Result.
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        staleTime: 60_000,
        gcTime: 60_000,
      },
    });
    const { Wrapper } = createWrapper(repository, queryClient);

    const summary = await renderHook(() => useHourlyForecast(input), {
      wrapper: Wrapper,
    });
    cleanups.push(async () => {
      await summary.unmount();
    });

    await waitFor(() => {
      expect(summary.result.current.isSuccess).toBe(true);
    });

    const result = await renderHook(() => usePlanRecommendation(), {
      wrapper: Wrapper,
    });
    cleanups.push(async () => {
      await result.unmount();
      queryClient.clear();
    });

    await waitFor(() => {
      expect(result.result.current.forecastQuery.isSuccess).toBe(true);
    });

    expect(getHourlyForecast).toHaveBeenCalledTimes(1);
    expect(result.result.current.forecastQuery.data).toEqual(weather);
  });
});
