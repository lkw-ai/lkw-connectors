import { HttpClient, BasicAuth, paginate, type Auth } from '@lkw-connectors/core';
import type { SalesOrder, OutboundDelivery, Shipment, ODataResponse, ODataSingleResponse, ODataQuery } from './types.js';

export interface SapClientOptions {
  /** e.g. https://s4hana.cliente.com:44300/sap/opu/odata/sap */
  baseUrl: string;
  username?: string;
  password?: string;
  auth?: Auth;
  client?: string; // sap-client query param (typically 100/200/300)
  timeoutMs?: number;
}

export class SapClient {
  readonly http: HttpClient;
  private csrfToken: string | null = null;
  private cookieJar: string | null = null;
  private readonly clientParam?: string;

  readonly salesOrders: ODataResource<SalesOrder>;
  readonly outboundDeliveries: ODataResource<OutboundDelivery>;
  readonly shipments: ODataResource<Shipment>;

  constructor(opts: SapClientOptions) {
    const auth = opts.auth ?? (opts.username && opts.password ? new BasicAuth(opts.username, opts.password) : undefined);
    if (!auth) throw new Error('SapClient: provide either { auth } or { username, password }');
    this.clientParam = opts.client;
    this.http = new HttpClient({
      baseUrl: opts.baseUrl,
      auth,
      defaultHeaders: { Accept: 'application/json' },
      timeoutMs: opts.timeoutMs,
      onResponse: (r) => {
        // Cache CSRF on any GET response that includes it
        // (we re-grab via fetchCsrf when mutating)
      },
    });
    this.salesOrders = new ODataResource<SalesOrder>(this, 'API_SALES_ORDER_SRV', 'A_SalesOrder', 'SalesOrder');
    this.outboundDeliveries = new ODataResource<OutboundDelivery>(this, 'API_OUTBOUND_DELIVERY_SRV_0002', 'A_OutbDeliveryHeader', 'DeliveryDocument');
    this.shipments = new ODataResource<Shipment>(this, 'API_SHIPMENT_SRV', 'A_Shipment', 'Shipment');
  }

  /** Builds OData v2 query string from a structured query. */
  buildQuery(q?: ODataQuery): Record<string, string | number> {
    const out: Record<string, string | number> = { $format: 'json' };
    if (this.clientParam) out['sap-client'] = this.clientParam;
    if (!q) return out;
    if (q.$filter)  out['$filter']  = q.$filter;
    if (q.$select)  out['$select']  = q.$select;
    if (q.$expand)  out['$expand']  = q.$expand;
    if (q.$orderby) out['$orderby'] = q.$orderby;
    if (q.$top !== undefined) out['$top'] = q.$top;
    if (q.$skip !== undefined) out['$skip'] = q.$skip;
    if (q.$inlinecount) out['$inlinecount'] = q.$inlinecount;
    return out;
  }

  /** Performs the CSRF token fetch (required before any POST/PUT/DELETE in SAP). */
  async fetchCsrf(servicePath: string): Promise<{ token: string; cookie: string | null }> {
    const r = await this.http.get<unknown>(servicePath, {
      headers: { 'x-csrf-token': 'fetch' },
      raw: true, // we want headers, not body
    });
    this.csrfToken = r.headers['x-csrf-token'] || null;
    this.cookieJar = r.headers['set-cookie'] || null;
    if (!this.csrfToken) throw new Error('SAP returned no x-csrf-token on fetch request');
    return { token: this.csrfToken, cookie: this.cookieJar };
  }

  csrfHeaders(): Record<string, string> {
    if (!this.csrfToken) throw new Error('CSRF token not fetched yet — call fetchCsrf() first');
    return {
      'x-csrf-token': this.csrfToken,
      ...(this.cookieJar ? { Cookie: this.cookieJar } : {}),
    };
  }
}

// ──────────────────────────────────────────────────────────────────────
// Resource wrapper
// ──────────────────────────────────────────────────────────────────────

export class ODataResource<T> {
  constructor(
    private client: SapClient,
    private serviceName: string,
    private entitySet: string,
    private keyField: keyof T,
  ) {}

  private servicePath() { return `/${this.serviceName}/${this.entitySet}`; }

  async list(query?: ODataQuery): Promise<{ items: T[]; total?: number; next?: string }> {
    const r = await this.client.http.get<ODataResponse<T>>(this.servicePath(), { query: this.client.buildQuery(query) });
    return { items: r.data.d.results, total: r.data.d.__count ? Number(r.data.d.__count) : undefined, next: r.data.d.__next };
  }

  async get(key: string | number, query?: Omit<ODataQuery, '$top' | '$skip'>): Promise<T> {
    const r = await this.client.http.get<ODataSingleResponse<T>>(
      `${this.servicePath()}('${encodeURIComponent(String(key))}')`,
      { query: this.client.buildQuery(query) },
    );
    return r.data.d;
  }

  iterate(query?: Omit<ODataQuery, '$skip'>, pageSize = 100) {
    return paginate<{ items: T[] }, T, number>({
      fetchPage: (skip) => this.list({ ...query, $top: pageSize, $skip: Number(skip ?? 0) }),
      extract: (p) => p.items,
      next: (p, prev) => (p.items.length === pageSize ? Number(prev ?? 0) + pageSize : null),
    });
  }

  async create(body: Partial<T>): Promise<T> {
    await this.client.fetchCsrf(this.servicePath());
    const r = await this.client.http.post<ODataSingleResponse<T>>(this.servicePath(), body, {
      headers: this.client.csrfHeaders(),
      query: this.client.buildQuery(),
    });
    return r.data.d;
  }

  async update(key: string | number, patch: Partial<T>): Promise<void> {
    await this.client.fetchCsrf(this.servicePath());
    await this.client.http.patch<unknown>(`${this.servicePath()}('${encodeURIComponent(String(key))}')`, patch, {
      headers: this.client.csrfHeaders(),
      query: this.client.buildQuery(),
    });
  }

  async delete(key: string | number): Promise<void> {
    await this.client.fetchCsrf(this.servicePath());
    await this.client.http.delete(`${this.servicePath()}('${encodeURIComponent(String(key))}')`, {
      headers: this.client.csrfHeaders(),
      query: this.client.buildQuery(),
    });
  }
}
