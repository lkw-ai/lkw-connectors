/**
 * Normalized error class for all connector failures (HTTP, auth, parsing).
 *
 * Encapsulates the original payload + machine-readable category so callers
 * can decide retry vs give-up without parsing strings.
 */
export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly category: 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'parse' | 'unknown',
    public readonly status?: number,
    public readonly body?: unknown,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ConnectorError';
  }

  get retryable(): boolean {
    return this.category === 'network' || this.category === 'rate_limit' || (this.category === 'server' && (this.status ?? 500) >= 500);
  }

  static fromResponse(status: number, body: unknown, url: string): ConnectorError {
    if (status === 401 || status === 403) {
      return new ConnectorError(`auth failed (${status}) for ${url}`, 'auth', status, body);
    }
    if (status === 429) {
      return new ConnectorError(`rate limit (429) for ${url}`, 'rate_limit', status, body);
    }
    if (status >= 500) {
      return new ConnectorError(`server error (${status}) for ${url}`, 'server', status, body);
    }
    if (status >= 400) {
      return new ConnectorError(`client error (${status}) for ${url}`, 'client', status, body);
    }
    return new ConnectorError(`unexpected status ${status} for ${url}`, 'unknown', status, body);
  }
}
