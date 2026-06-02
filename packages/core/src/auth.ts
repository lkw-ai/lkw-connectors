/**
 * Auth strategies — each implements a single `headers()` method that the
 * HttpClient calls before each request. Token-refreshing strategies cache
 * the token internally with an expiry margin.
 */

export interface Auth {
  /** Returns headers to merge into the outgoing request (e.g. { Authorization: '...' }) */
  headers(): Promise<Record<string, string>>;
}

export class BasicAuth implements Auth {
  private readonly token: string;
  constructor(user: string, pass: string) {
    this.token = Buffer.from(`${user}:${pass}`).toString('base64');
  }
  async headers() {
    return { Authorization: `Basic ${this.token}` };
  }
}

export class BearerAuth implements Auth {
  constructor(private readonly token: string) {}
  async headers() {
    return { Authorization: `Bearer ${this.token}` };
  }
}

/**
 * OAuth 2.0 — client credentials grant. Caches the access_token until 60s
 * before expiry then re-fetches.
 */
export class OAuth2ClientCredentials implements Auth {
  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(
    private readonly opts: {
      tokenUrl: string;
      clientId: string;
      clientSecret: string;
      scope?: string;
      audience?: string;
      extraParams?: Record<string, string>;
    },
  ) {}

  async headers() {
    if (!this.accessToken || Date.now() > this.expiresAt - 60_000) {
      await this.refresh();
    }
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  private async refresh() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.opts.clientId,
      client_secret: this.opts.clientSecret,
      ...(this.opts.scope ? { scope: this.opts.scope } : {}),
      ...(this.opts.audience ? { audience: this.opts.audience } : {}),
      ...(this.opts.extraParams || {}),
    });
    const r = await fetch(this.opts.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`OAuth2 token request failed (${r.status}): ${text.slice(0, 200)}`);
    }
    const json = (await r.json()) as { access_token: string; expires_in?: number };
    this.accessToken = json.access_token;
    this.expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;
  }
}
