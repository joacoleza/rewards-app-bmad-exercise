import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useUsers, USERS_QUERY_KEY } from './useUsers';

function createJsonResponse(body: unknown, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    json: vi.fn().mockResolvedValue(body),
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const mockUsers = [
  {
    id: 1,
    email: 'manager@example.com',
    role: 'manager' as const,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 2,
    email: 'employee@example.com',
    role: 'employee' as const,
    createdAt: '2026-03-02T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(createJsonResponse(mockUsers, { ok: true, status: 200 })),
  );
});

describe('useUsers', () => {
  it('returns user array on successful fetch', async () => {
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUsers);
    expect(result.current.data).toHaveLength(2);
  });

  it('calls GET /api/users endpoint', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(createJsonResponse(mockUsers, { ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.any(Object),
    );
  });

  it('enters error state when API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          createJsonResponse(
            { error: 'FORBIDDEN', message: 'Insufficient permissions', statusCode: 403 },
            { ok: false, status: 403 },
          ),
        ),
    );

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });

  it('exports correct query key constant', () => {
    expect(USERS_QUERY_KEY).toEqual(['users']);
  });
});
