import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import {
  createQueryClient,
  setupReactQueryFocusManager,
} from '@/infrastructure/api/query-client';

import { RepositoriesProvider } from '@/providers/repositories-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => setupReactQueryFocusManager(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}
