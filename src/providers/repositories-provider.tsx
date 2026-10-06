import type { ReactNode } from 'react';

type RepositoriesProviderProps = {
  children: ReactNode;
};

/**
 * Placeholder for future dependency inversion of data repositories
 * (weather, location, etc.). No repositories are registered yet.
 */
export function RepositoriesProvider({ children }: RepositoriesProviderProps) {
  return children;
}
