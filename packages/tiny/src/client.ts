import { HttpClient, BearerAuth, paginate, type Auth } from '@lkw-connectors/core';
import type { Pedido, Nota, Expedicao, TinyResponse, TinyListResponse } from './types.js';

export interface TinyClientOptions {
  /** Default: https://api.tiny.com.br/public-api/v3 */
  baseUrl?: string;
  accessToken?: string;
  auth?: Auth;
  timeoutMs?: number;
}

const DEFAULT_BASE = 'https://api.tiny.com.br/public-api/v3';

export class TinyClient {
  readonly http: HttpClient;
  readonly pedidos: PedidosResource;
  readonly notas: NotasResource;
  readonly expedicoes: ExpedicoesResource;

  constructor(opts: TinyClientOptions) {
    const auth = opts.auth ?? (opts.accessToken ? new BearerAuth(opts.accessToken) : undefined);
    if (!auth) throw new Error('TinyClient: provide either { auth } or { accessToken }');
    this.http = new HttpClient({
      baseUrl: opts.baseUrl ?? DEFAULT_BASE,
      auth,
      timeoutMs: opts.timeoutMs,
    });
    this.pedidos = new PedidosResource(this.http);
    this.notas = new NotasResource(this.http);
    this.expedicoes = new ExpedicoesResource(this.http);
  }
}

export class PedidosResource {
  constructor(private http: HttpClient) {}

  async get(id: number): Promise<Pedido> {
    const r = await this.http.get<TinyResponse<Pedido>>(`/pedidos/${id}`);
    return r.data.data;
  }

  async list(filter: { situacao?: number; dataInicial?: string; dataFinal?: string; pagina?: number; limite?: number } = {}) {
    const r = await this.http.get<TinyListResponse<Pedido>>('/pedidos', {
      query: { ...filter },
    });
    return r.data;
  }

  iterate(filter: Omit<Parameters<PedidosResource['list']>[0], 'pagina'> = {}) {
    return paginate<TinyListResponse<Pedido>, Pedido, number>({
      fetchPage: (cursor) => this.list({ ...filter, pagina: Number(cursor ?? 1) }),
      extract: (p) => p.data,
      next: (p, prev) => (p.metadata && p.metadata.currentPage < p.metadata.totalPages ? Number(prev ?? 1) + 1 : null),
    });
  }
}

export class NotasResource {
  constructor(private http: HttpClient) {}

  async get(id: number): Promise<Nota> {
    const r = await this.http.get<TinyResponse<Nota>>(`/notas/${id}`);
    return r.data.data;
  }

  async emitir(pedidoId: number) {
    const r = await this.http.post<TinyResponse<Nota>>(`/notas`, { pedidoId });
    return r.data.data;
  }
}

export class ExpedicoesResource {
  constructor(private http: HttpClient) {}

  async criar(body: Partial<Expedicao>) {
    const r = await this.http.post<TinyResponse<Expedicao>>(`/expedicoes`, body);
    return r.data.data;
  }
}
