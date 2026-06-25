import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initApiClient, erpFetch, erpFetchAsync } from '../api-client';

describe('api-client.ts', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    initApiClient(() => null);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('initApiClient', () => {
    it('stores the getUser function for later use', () => {
      const getUserFn = () => ({ username: 'test', roleKey: 'admin' });
      initApiClient(getUserFn);
      erpFetch('/api/test');
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('erpFetch', () => {
    it('adds x-erp-role and x-erp-user headers when user is set', () => {
      initApiClient(() => ({ username: 'testuser', roleKey: 'admin' }));
      erpFetch('/api/test');
      const [, options] = fetchSpy.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('x-erp-role')).toBe('admin');
      expect(headers.get('x-erp-user')).toBe('testuser');
    });

    it('does not add headers when getUser returns null', () => {
      initApiClient(() => null);
      erpFetch('/api/test');
      const [, options] = fetchSpy.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('x-erp-role')).toBeNull();
      expect(headers.get('x-erp-user')).toBeNull();
    });

    it('does not add headers when getUser returns empty object', () => {
      initApiClient(() => ({}));
      erpFetch('/api/test');
      const [, options] = fetchSpy.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('x-erp-role')).toBeNull();
      expect(headers.get('x-erp-user')).toBeNull();
    });

    it('preserves existing headers', () => {
      initApiClient(() => ({ username: 'u', roleKey: 'r' }));
      erpFetch('/api/test', {
        headers: { 'Content-Type': 'application/json' },
      });
      const [, options] = fetchSpy.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-erp-role')).toBe('r');
    });

    it('passes through method and body', () => {
      initApiClient(() => ({ username: 'u', roleKey: 'r' }));
      const body = JSON.stringify({ name: 'test' });
      erpFetch('/api/test', { method: 'POST', body });
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('/api/test');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(body);
    });

    it('works before initApiClient is called (no crash)', () => {
      initApiClient(() => null);
      erpFetch('/api/test');
      expect(fetchSpy).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.any(Headers),
      }));
    });
  });

  describe('erpFetchAsync', () => {
    it('returns a promise that resolves to Response', async () => {
      initApiClient(() => ({ username: 'u', roleKey: 'r' }));
      const result = await erpFetchAsync('/api/test');
      expect(result).toBeInstanceOf(Response);
    });

    it('adds auth headers like erpFetch', async () => {
      initApiClient(() => ({ username: 'testuser', roleKey: 'owner' }));
      await erpFetchAsync('/api/test');
      const [, options] = fetchSpy.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('x-erp-role')).toBe('owner');
      expect(headers.get('x-erp-user')).toBe('testuser');
    });
  });
});