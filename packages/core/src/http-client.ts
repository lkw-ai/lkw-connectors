/**
 * Thin fetch wrapper with the things every connector needs:
 *   - base URL prefixing
 *   - injectable auth strategy (headers per-request)
 *   - JSON serialization, content-type negotiation
 *   - retry with exponential backoff on retryable errors
 *   - timeout via AbortController
 *   - normalized ConnectorError on failure
 */
import { ConnectorError } from './errors.js';
import type { Auth } from './auth.js';

export interface HttpClientOptions {
  baseUrl: string;
  auth?: Auth;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryBaseMs?: number;
  /** Hook called once per request after response — useful for logging */
  onResponse?: (ctx: { url: string; method: string; status: number; durationMs: number }) => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: unknown;
  /** If set, returns raw response without JSON parsing (e.g. for file downloads) */
  raw?: boolean;
  /** Override retries for this single call */
  retries?: number;
  /** Override timeout for this single call */
  timeoutMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class HttpClient {
  constructor(private readonly opts: HttpClientOptions) {}

  async request<T = unknown>(path: string, init: RequestOptions = {}): Promise<HttpResponse<T>> {
    const retries = init.retries ?? this.opts.retries ?? 3;
    const timeoutMs = init.timeoutMs ?? this.opts.timeoutMs ?? 30_000;
    const url = this.buildUrl(path, init.query);
    const method = init.method ?? 'GET';

    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= retries) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...(this.opts.defaultHeaders ?? {}),
          ...(init.headers ?? {}),
        };
        if (this.opts.auth) Object.assign(headers, await this.opts.auth.headers());
        if (init.body !== undefined && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
        const r = await fetch(url, {
          method,
          headers,
          signal: controller.signal,
          body: init.body === undefined ? undefined : typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
        });
        const durationMs = Date.now() - startedAt;
        this.opts.onResponse?.({ url, method, status: r.status, durationMs });

        const responseHeaders: Record<string, string> = {};
        r.headers.forEach((v, k) => { responseHeaders[k] = v; });

        if (init.raw) {
          return { status: r.status, data: (await r.arrayBuffer()) as unknown as T, headers: responseHeaders };
        }

        const ct = r.headers.get('content-type') || '';
        let data: any;
        if (ct.includes('json')) {
          const text = await r.text();
          try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        } else {
          data = await r.text();
        }

        if (!r.ok) {
          const err = ConnectorError.fromResponse(r.status, data, url);
          if (err.retryable && attempt < retries) {
            lastErr = err;
            attempt++;
            await this.backoff(attempt);
            continue;
          }
          throw err;
        }
        return { status: r.status, data: data as T, headers: responseHeaders };
      } catch (e: any) {
        if (e instanceof ConnectorError) throw e;
        const isAbort = e?.name === 'AbortError';
        const networkErr = new ConnectorError(isAbort ? `request timed out after ${timeoutMs}ms` : (e?.message || 'network error'), 'network', undefined, undefined, e);
        if (attempt < retries) {
          lastErr = networkErr;
          attempt++;
          await this.backoff(attempt);
          continue;
        }
        throw networkErr;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr ?? new ConnectorError('exhausted retries', 'unknown');
  }

  get<T = unknown>(path: string, init: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...init, method: 'GET' });
  }
  post<T = unknown>(path: string, body?: unknown, init: Omit<RequestOptions, 'method'> = {}) {
    return this.request<T>(path, { ...init, method: 'POST', body });
  }
  put<T = unknown>(path: string, body?: unknown, init: Omit<RequestOptions, 'method'> = {}) {
    return this.request<T>(path, { ...init, method: 'PUT', body });
  }
  patch<T = unknown>(path: string, body?: unknown, init: Omit<RequestOptions, 'method'> = {}) {
    return this.request<T>(path, { ...init, method: 'PATCH', body });
  }
  delete<T = unknown>(path: string, init: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const base = this.opts.baseUrl.endsWith('/') ? this.opts.baseUrl.slice(0, -1) : this.opts.baseUrl;
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(base + p);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private backoff(attempt: number): Promise<void> {
    const base = this.opts.retryBaseMs ?? 500;
    const jitter = Math.random() * 200;
    return new Promise((r) => setTimeout(r, base * 2 ** (attempt - 1) + jitter));
  }
}
