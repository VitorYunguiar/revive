import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { tokenStore } from '@/core/auth/token-store';
import { refreshAccessToken } from './client';

jest.mock('@/core/auth/token-store', () => ({ tokenStore: {
  getRefreshToken: jest.fn(), setRefreshToken: jest.fn(), clear: jest.fn(),
  setAccessToken: jest.fn(), getAccessToken: jest.fn(), setUser: jest.fn(),
} }));


const fetchMock = jest.fn<typeof fetch>();
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
  jest.mocked(tokenStore.getRefreshToken).mockResolvedValue('test-refresh');
});

describe('session recovery', () => {
  it('preserves credentials during a network outage', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(refreshAccessToken()).rejects.toMatchObject({ status: 0 });
    expect(tokenStore.clear).not.toHaveBeenCalled();
  });

  it('preserves credentials when the server is temporarily unavailable', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => '{}' } as Response);
    await expect(refreshAccessToken()).rejects.toMatchObject({ status: 503 });
    expect(tokenStore.clear).not.toHaveBeenCalled();
  });

  it('clears credentials only when refresh is rejected', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => '{}' } as Response);
    expect(await refreshAccessToken()).toBeNull();
    expect(tokenStore.clear).toHaveBeenCalledTimes(1);
  });

  it('shares concurrent refresh requests and persists the rotated token', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({
      access_token: 'access-new', refresh_token: 'refresh-new', usuario: { id: 'u', nome: 'Teste', email: 'test@example.com' },
    }) } as Response);
    expect(await Promise.all([refreshAccessToken(), refreshAccessToken()])).toEqual(['access-new', 'access-new']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tokenStore.setRefreshToken).toHaveBeenCalledWith('refresh-new');
  });
});
