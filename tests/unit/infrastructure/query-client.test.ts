import { QueryClient } from '@tanstack/react-query';

import { createQueryClient } from '@/infrastructure/api/query-client';

describe('createQueryClient', () => {
  it('returns a QueryClient', () => {
    const client = createQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
  });
});
