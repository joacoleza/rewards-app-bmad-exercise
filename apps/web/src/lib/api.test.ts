import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  AUTH_EXPIRED_EVENT,
  getAccessToken,
  setAccessToken,
} from './api';

function createJsonResponse(body: unknown, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('api auth refresh handling', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('dispatches auth expiration when refresh fails after a 401 response', async () => {
    setAccessToken('stale-token');

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          createJsonResponse(
            {
              error: 'UNAUTHORIZED',
              message: 'Expired token',
              field: null,
              statusCode: 401,
            },
            { ok: false, status: 401 },
          ),
        )
        .mockResolvedValueOnce(
          createJsonResponse(
            {
              error: 'UNAUTHORIZED',
              message: 'Invalid refresh token',
              field: null,
              statusCode: 401,
            },
            { ok: false, status: 401 },
          ),
        ),
    );

    const expiredHandler = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, expiredHandler);

    await expect(api.get('/protected')).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(expiredHandler).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();

    window.removeEventListener(AUTH_EXPIRED_EVENT, expiredHandler);
  });
});
