import { HttpClient, BasicAuth, paginate, type Auth } from '@lkw-connectors/core';
import type { Pedido, Nota, Romaneio, Ocorrencia, PageResponse } from './types.js';

export interface TotvsClientOptions {
  baseUrl: string;          // e.g. https://protheus.cliente.com.br/rest
  username?: string;
  password?: string;
  /** Use this instead of username/password if your Protheus is behind a custom auth */
  auth?: Auth;
  /** Empresa/Filial code header (Protheus). Most installs expect 'tenantId' or 'empresa' */
  tenantId?: string;
  filial?: string;
  defaultPageSize?: number;
  timeoutMs?: number;
}

export class TotvsClient {
  readonly http: HttpClient;
  private readonly pageSize: number;

  readonly pedidos: PedidosResource;
  readonly notas: NotasResource;
  readonly romaneios: RomaneiosResource;
  readonly ocorrencias: OcorrenciasResource;

  constructor(opts: TotvsClientOptions) {
    const auth = opts.auth ?? (opts.username && opts.password ? new BasicAuth(opts.username, opts.password) : undefined);
    if (!auth) throw new Error('TotvsClient: provide either { auth } or { username, password }');
    this.pageSize = opts.defaultPageSize ?? 50;
    this.http = new HttpClient({
      baseUrl: opts.baseUrl,
      auth,
      defaultHeaders: {
        ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
        ...(opts.filial ? { filial: opts.filial } : {}),
      },
      timeoutMs: opts.timeoutMs,
    });
    this.pedidos = new PedidosResource(this.http, this.pageSize);
    this.notas = new NotasResource(this.http, this.pageSize);
    this.romaneios = new RomaneiosResource(this.http, this.pageSize);
    this.ocorrencias = new OcorrenciasResource(this.http, this.pageSize);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Resources
// ──────────────────────────────────────────────────────────────────────

class BaseResource {
  constructor(protected http: HttpClient, protected pageSize: number) {}
}

export class PedidosResource extends BaseResource {
  async get(numero: string): Promise<Pedido> {
    const r = await this.http.get<Pedido>(`/pedidos/${encodeURIComponent(numero)}`);
    return r.data;
  }

  async list(filter: { status?: string; cliente?: string; dataInicio?: string; dataFim?: string; page?: number } = {}): Promise<PageResponse<Pedido>> {
    const r = await this.http.get<PageResponse<Pedido>>('/pedidos', { query: { ...filter, pageSize: this.pageSize } });
    return r.data;
  }

  /** Async iterator over all pedidos matching the filter */
  iterate(filter: { status?: string; cliente?: string; dataInicio?: string; dataFim?: string } = {}) {
    return paginate<PageResponse<Pedido>, Pedido, number>({
      fetchPage: (cursor) => this.list({ ...filter, page: Number(cursor ?? 1) }),
      extract: (p) => p.items,
      next: (p, prev) => (p.hasNext ? Number(prev ?? 1) + 1 : null),
    });
  }

  async create(body: Partial<Pedido>) {
    const r = await this.http.post<Pedido>('/pedidos', body);
    return r.data;
  }

  async liberar(numero: string) {
    const r = await this.http.post<{ ok: boolean }>(`/pedidos/${encodeURIComponent(numero)}/liberar`);
    return r.data;
  }
}

export class NotasResource extends BaseResource {
  async get(serie: string, numero: string): Promise<Nota> {
    const r = await this.http.get<Nota>(`/notas/${encodeURIComponent(serie)}/${encodeURIComponent(numero)}`);
    return r.data;
  }

  async list(filter: { status?: string; emissaoInicio?: string; emissaoFim?: string; page?: number } = {}) {
    const r = await this.http.get<PageResponse<Nota>>('/notas', { query: { ...filter, pageSize: this.pageSize } });
    return r.data;
  }

  iterate(filter: { status?: string; emissaoInicio?: string; emissaoFim?: string } = {}) {
    return paginate<PageResponse<Nota>, Nota, number>({
      fetchPage: (cursor) => this.list({ ...filter, page: Number(cursor ?? 1) }),
      extract: (p) => p.items,
      next: (p, prev) => (p.hasNext ? Number(prev ?? 1) + 1 : null),
    });
  }

  async emitir(pedido_numero: string) {
    const r = await this.http.post<Nota>('/notas/emitir', { pedido: pedido_numero });
    return r.data;
  }
}

export class RomaneiosResource extends BaseResource {
  async get(codigo: string): Promise<Romaneio> {
    const r = await this.http.get<Romaneio>(`/romaneios/${encodeURIComponent(codigo)}`);
    return r.data;
  }

  async list(filter: { status?: string; cdm?: string; page?: number } = {}) {
    const r = await this.http.get<PageResponse<Romaneio>>('/romaneios', { query: { ...filter, pageSize: this.pageSize } });
    return r.data;
  }

  iterate(filter: { status?: string; cdm?: string } = {}) {
    return paginate<PageResponse<Romaneio>, Romaneio, number>({
      fetchPage: (cursor) => this.list({ ...filter, page: Number(cursor ?? 1) }),
      extract: (p) => p.items,
      next: (p, prev) => (p.hasNext ? Number(prev ?? 1) + 1 : null),
    });
  }

  async criar(body: Partial<Romaneio>) {
    const r = await this.http.post<Romaneio>('/romaneios', body);
    return r.data;
  }

  async liberar(codigo: string) {
    const r = await this.http.post<{ ok: boolean }>(`/romaneios/${encodeURIComponent(codigo)}/liberar`);
    return r.data;
  }
}

export class OcorrenciasResource extends BaseResource {
  async list(filter: { romaneio?: string; nota?: string; tipo?: string; desde?: string; page?: number } = {}) {
    const r = await this.http.get<PageResponse<Ocorrencia>>('/ocorrencias', { query: { ...filter, pageSize: this.pageSize } });
    return r.data;
  }

  async registrar(body: Partial<Ocorrencia>) {
    const r = await this.http.post<Ocorrencia>('/ocorrencias', body);
    return r.data;
  }

  async resolver(codigo: string, observacao?: string) {
    const r = await this.http.post<Ocorrencia>(`/ocorrencias/${encodeURIComponent(codigo)}/resolver`, { observacao });
    return r.data;
  }
}
