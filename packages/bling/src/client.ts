import { HttpClient, BearerAuth, paginate, type Auth } from '@lkw-connectors/core';
import type { Pedido, Nota, Expedicao, BlingResponse, BlingListResponse } from './types.js';

export interface BlingClientOptions {
  /** Default: https://api.bling.com.br/Api/v3 */
  baseUrl?: string;
  accessToken?: string;
  auth?: Auth;
  timeoutMs?: number;
}

const DEFAULT_BASE = 'https://api.bling.com.br/Api/v3';

export class BlingClient {
  readonly http: HttpClient;
  readonly pedidos: PedidosResource;
  readonly notas: NotasResource;
  readonly expedicoes: ExpedicoesResource;

  constructor(opts: BlingClientOptions) {
    const auth = opts.auth ?? (opts.accessToken ? new BearerAuth(opts.accessToken) : undefined);
    if (!auth) throw new Error('BlingClient: provide either { auth } or { accessToken }');
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
    const r = await this.http.get<BlingResponse<Pedido>>(`/pedidos/vendas/${id}`);
    return r.data.data;
  }

  async list(filter: { idsSituacoes?: number[]; dataEmissaoInicial?: string; dataEmissaoFinal?: string; pagina?: number; limite?: number } = {}) {
    const q: Record<string, string | number> = {};
    if (filter.idsSituacoes) q['idsSituacoes[]'] = filter.idsSituacoes.join(',');
    if (filter.dataEmissaoInicial) q.dataEmissaoInicial = filter.dataEmissaoInicial;
    if (filter.dataEmissaoFinal) q.dataEmissaoFinal = filter.dataEmissaoFinal;
    if (filter.pagina) q.pagina = filter.pagina;
    if (filter.limite) q.limite = filter.limite;
    const r = await this.http.get<BlingListResponse<Pedido>>('/pedidos/vendas', { query: q });
    return r.data;
  }

  iterate(filter: Omit<Parameters<PedidosResource['list']>[0], 'pagina'> = {}) {
    return paginate<BlingListResponse<Pedido>, Pedido, number>({
      fetchPage: (cursor) => this.list({ ...filter, pagina: Number(cursor ?? 1) }),
      extract: (p) => p.data,
      next: (p, prev) => (p.pagination && p.pagination.page < p.pagination.totalPages ? Number(prev ?? 1) + 1 : null),
    });
  }

  async create(body: Partial<Pedido>) {
    const r = await this.http.post<BlingResponse<Pedido>>('/pedidos/vendas', body);
    return r.data.data;
  }

  async cancelar(id: number, motivo?: string) {
    const r = await this.http.post<BlingResponse<{ ok: boolean }>>(`/pedidos/vendas/${id}/cancelar`, { motivo });
    return r.data.data;
  }
}

export class NotasResource {
  constructor(private http: HttpClient) {}

  async get(id: number): Promise<Nota> {
    const r = await this.http.get<BlingResponse<Nota>>(`/nfe/${id}`);
    return r.data.data;
  }

  async emitirAPartirDePedido(pedidoId: number) {
    const r = await this.http.post<BlingResponse<Nota>>(`/nfe`, { pedido: { id: pedidoId } });
    return r.data.data;
  }
}

export class ExpedicoesResource {
  constructor(private http: HttpClient) {}

  async expedir(pedidoId: number, body: Partial<Expedicao>) {
    const r = await this.http.post<BlingResponse<Expedicao>>(`/pedidos/vendas/${pedidoId}/expedir`, body);
    return r.data.data;
  }
}
