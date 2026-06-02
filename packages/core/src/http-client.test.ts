import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from './http-client.js';
import { BasicAuth, BearerAuth } from './auth.js';
import { ConnectorError } from './errors.js';

describe('HttpClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
  });
  afterEach(() => vi.restoreAllMocks());

  function jsonResp(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });
  }

  it('sends Basic auth header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResp({ ok: true }));
    const c = new HttpClient({ baseUrl: 'https://api.test', auth: new BasicAuth('u', 'p') });
    await c.get('/foo');
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Basic /);
  });

  it('sends Bearer auth header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResp({ ok: true }));
    const c = new HttpClient({ baseUrl: 'https://api.test', auth: new BearerAuth('abc') });
    await c.get('/foo');
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc');
  });

  it('builds query strings', async () => {
    fetchMock.mockResolvedValueOnce(jsonResp({}));
    const c = new HttpClient({ baseUrl: 'https://api.test' });
    await c.get('/items', { query: { status: 'ACTIVE', limit: 50, includeNull: undefined } });
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain('status=ACTIVE');
    expect(url).toContain('limit=50');
    expect(url).not.toContain('includeNull');
  });

  it('serializes JSON bodies', async () => {
    fetchMock.mockResolvedValueOnce(jsonResp({ id: 1 }));
    const c = new HttpClient({ baseUrl: 'https://api.test' });
    await c.post('/items', { name: 'foo' });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBe('{"name":"foo"}');
  });

  it('throws ConnectorError with category for 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResp({ error: 'nope' }, 401));
    const c = new HttpClient({ baseUrl: 'https://api.test', retries: 0 });
    await expect(c.get('/x')).rejects.toMatchObject({ category: 'auth', status: 401 });
  });

  it('retries on 500 + recovers on 200', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResp({ msg: 'down' }, 500))
      .mockResolvedValueOnce(jsonResp({ msg: 'down' }, 500))
      .mockResolvedValueOnce(jsonResp({ ok: true }));
    const c = new HttpClient({ baseUrl: 'https://api.test', retries: 3, retryBaseMs: 1 });
    const r = await c.get<{ ok: boolean }>('/x');
    expect(r.data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on 4xx (except 429)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResp({ msg: 'bad request' }, 400));
    const c = new HttpClient({ baseUrl: 'https://api.test', retries: 5, retryBaseMs: 1 });
    await expect(c.get('/x')).rejects.toBeInstanceOf(ConnectorError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 rate limit', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResp({ msg: 'rate' }, 429))
      .mockResolvedValueOnce(jsonResp({ ok: true }));
    const c = new HttpClient({ baseUrl: 'https://api.test', retries: 2, retryBaseMs: 1 });
    const r = await c.get<{ ok: boolean }>('/x');
    expect(r.data.ok).toBe(true);
  });
});
