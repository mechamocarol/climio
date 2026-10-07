import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  hourlyForecastQueryKey,
  useHourlyForecast,
} from '@/features/weather/hooks/use-hourly-forecast';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';
import type {
  GetHourlyForecastInput,
  WeatherRepository,
} from '@/features/weather/domain/weather-repository';
import { createTestQueryClient } from '@/infrastructure/api/query-client';
import { RepositoriesProvider } from '@/providers/repositories-provider';

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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function renderUseHourlyForecast(
  input: GetHourlyForecastInput | null | undefined,
  repository: WeatherRepository,
) {
  const queryClient = createTestQueryClient();
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      gcTime: 0,
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RepositoriesProvider repositories={{ weather: repository }}>
          {children}
        </RepositoriesProvider>
      </QueryClientProvider>
    );
  }

  const hook = await renderHook(() => useHourlyForecast(input), {
    wrapper: Wrapper,
  });

  return { ...hook, queryClient };
}

describe('useHourlyForecast', () => {
  const input: GetHourlyForecastInput = {
    latitude: -23.55,
    longitude: -46.63,
    date: '2026-10-08',
  };

  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();
      await cleanup?.();
    }
  });

  it('exposes HourlyWeather[] on success', async () => {
    const weather = [
      createWeather({ timestamp: '2026-10-08T14:00' }),
      createWeather({ timestamp: '2026-10-08T15:00', temperature: 24 }),
    ];
    const getHourlyForecast = jest.fn().mockResolvedValue(weather);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(input, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(rendered.result.current.data).toEqual(weather);
    expect(getHourlyForecast).toHaveBeenCalledTimes(1);
  });

  it('reflects pending state while the repository request is in flight', async () => {
    const deferred = createDeferred<HourlyWeather[]>();
    const getHourlyForecast = jest.fn().mockReturnValue(deferred.promise);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(input, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isPending).toBe(true);
    });
    expect(rendered.result.current.isLoading).toBe(true);
    expect(rendered.result.current.data).toBeUndefined();

    deferred.resolve([createWeather()]);

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });
  });

  it('exposes the original repository error', async () => {
    const error = new Error('forecast failed');
    const getHourlyForecast = jest.fn().mockRejectedValue(error);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(input, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isError).toBe(true);
    });

    expect(rendered.result.current.error).toBe(error);
  });

  it('does not call the repository when input is missing', async () => {
    const getHourlyForecast = jest.fn().mockResolvedValue([]);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(null, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    expect(rendered.result.current.fetchStatus).toBe('idle');
    expect(rendered.result.current.isPending).toBe(true);
    expect(getHourlyForecast).not.toHaveBeenCalled();
  });

  it('does not call the repository when date is empty', async () => {
    const getHourlyForecast = jest.fn().mockResolvedValue([]);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(
      { ...input, date: '' },
      repository,
    );
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    expect(rendered.result.current.fetchStatus).toBe('idle');
    expect(getHourlyForecast).not.toHaveBeenCalled();
  });

  it('uses latitude, longitude, and date in the query key', async () => {
    const weather = [createWeather()];
    const getHourlyForecast = jest.fn().mockResolvedValue(weather);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(input, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(rendered.queryClient.getQueryData(hourlyForecastQueryKey(input))).toEqual(
      weather,
    );
  });

  it('forwards the query AbortSignal to the repository', async () => {
    const getHourlyForecast = jest.fn().mockResolvedValue([createWeather()]);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(input, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(getHourlyForecast).toHaveBeenCalledWith(
      input,
      expect.any(AbortSignal),
    );
  });

  it('calls getHourlyForecast with the explicit input values', async () => {
    const getHourlyForecast = jest.fn().mockResolvedValue([createWeather()]);
    const repository: WeatherRepository = { getHourlyForecast };

    const rendered = await renderUseHourlyForecast(input, repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(getHourlyForecast.mock.calls[0]?.[0]).toEqual({
      latitude: -23.55,
      longitude: -46.63,
      date: '2026-10-08',
    });
  });
});
