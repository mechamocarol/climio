import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import {
  createQueryClient,
  setupReactQueryFocusManager,
} from '@/infrastructure/api/query-client';

import { RepositoriesProvider } from '@/providers/repositories-provider';
import { ThemeProvider } from '@/providers/theme-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => setupReactQueryFocusManager(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RepositoriesProvider>{children}</RepositoriesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
