import { QueryClient } from '@tanstack/react-query';

import { createQueryClient, createTestQueryClient } from '@/infrastructure/api/query-client';

describe('createQueryClient', () => {
  it('returns a QueryClient with default options', () => {
    const client = createQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
    expect(client.getDefaultOptions().queries?.retry).toBe(1);
    expect(client.getDefaultOptions().queries?.staleTime).toBe(60_000);
  });

  it('returns a test QueryClient without retries', () => {
    const client = createTestQueryClient();

    expect(client.getDefaultOptions().queries?.retry).toBe(false);
    expect(client.getDefaultOptions().queries?.staleTime).toBe(0);
  });
});
