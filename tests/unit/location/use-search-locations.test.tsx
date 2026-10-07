import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  searchLocationsQueryKey,
  useSearchLocations,
} from '@/features/location/hooks/use-search-locations';
import type { Location } from '@/features/location/domain/location';
import type { LocationRepository } from '@/features/location/domain/location-repository';
import { createTestQueryClient } from '@/infrastructure/api/query-client';
import { RepositoriesProvider } from '@/providers/repositories-provider';

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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function renderUseSearchLocations(
  query: string,
  repository: LocationRepository,
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
        <RepositoriesProvider repositories={{ location: repository }}>
          {children}
        </RepositoriesProvider>
      </QueryClientProvider>
    );
  }

  const hook = await renderHook(() => useSearchLocations(query), {
    wrapper: Wrapper,
  });

  return { ...hook, queryClient };
}

describe('useSearchLocations', () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();
      await cleanup?.();
    }
  });

  it('exposes Location[] on success', async () => {
    const locations = [
      createLocation(),
      createLocation({
        id: '3462944',
        name: 'Frei Paulo',
        region: 'Sergipe',
        timezone: 'America/Maceio',
      }),
    ];
    const searchLocations = jest.fn().mockResolvedValue(locations);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('São Paulo', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(rendered.result.current.data).toEqual(locations);
    expect(searchLocations).toHaveBeenCalledTimes(1);
  });

  it('reflects pending state while the repository request is in flight', async () => {
    const deferred = createDeferred<Location[]>();
    const searchLocations = jest.fn().mockReturnValue(deferred.promise);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('Campinas', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isPending).toBe(true);
    });
    expect(rendered.result.current.isLoading).toBe(true);
    expect(rendered.result.current.data).toBeUndefined();

    deferred.resolve([createLocation({ name: 'Campinas' })]);

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });
  });

  it('exposes the original repository error', async () => {
    const error = new Error('geocoding failed');
    const searchLocations = jest.fn().mockRejectedValue(error);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('São Paulo', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isError).toBe(true);
    });

    expect(rendered.result.current.error).toBe(error);
  });

  it('does not call the repository when the query is empty', async () => {
    const searchLocations = jest.fn().mockResolvedValue([]);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    expect(rendered.result.current.fetchStatus).toBe('idle');
    expect(rendered.result.current.isPending).toBe(true);
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it('does not call the repository when the query is whitespace-only', async () => {
    const searchLocations = jest.fn().mockResolvedValue([]);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('   ', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    expect(rendered.result.current.fetchStatus).toBe('idle');
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it('uses the trimmed query in the query key', async () => {
    const locations = [createLocation()];
    const searchLocations = jest.fn().mockResolvedValue(locations);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('  São Paulo  ', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(
      rendered.queryClient.getQueryData(searchLocationsQueryKey('São Paulo')),
    ).toEqual(locations);
  });

  it('forwards the query AbortSignal to the repository', async () => {
    const searchLocations = jest.fn().mockResolvedValue([createLocation()]);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('São Paulo', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(searchLocations).toHaveBeenCalledWith(
      { query: 'São Paulo' },
      expect.any(AbortSignal),
    );
  });

  it('calls searchLocations with the trimmed query via injected repository', async () => {
    const searchLocations = jest.fn().mockResolvedValue([createLocation()]);
    const repository: LocationRepository = { searchLocations };

    const rendered = await renderUseSearchLocations('  Campinas  ', repository);
    cleanups.push(async () => {
      await rendered.unmount();
      rendered.queryClient.clear();
    });

    await waitFor(() => {
      expect(rendered.result.current.isSuccess).toBe(true);
    });

    expect(searchLocations.mock.calls[0]?.[0]).toEqual({ query: 'Campinas' });
  });
});
