import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

const DEFAULT_STALE_TIME_MS = 60_000;
const DEFAULT_RETRY = 1;

type CreateQueryClientOptions = {
  retry?: number | boolean;
  staleTime?: number;
};

export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: options.retry ?? DEFAULT_RETRY,
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME_MS,
      },
    },
  });
}

export function createTestQueryClient(): QueryClient {
  return createQueryClient({ retry: false, staleTime: 0 });
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function setupReactQueryFocusManager(): () => void {
  if (Platform.OS === 'web') {
    return () => undefined;
  }

  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => subscription.remove();
}
