/**
 * Subset of Bling v3 response shapes — only the fields LKW logistics
 * workflows typically need (pedido, nota, expedição).
 *
 * Bling envelopes responses in `{ data: ... }` or `{ pagination, data }`.
 */
export interface Pedido {
  id: number;
  numero?: string;
  data: string;
  totalProdutos?: number;
  total?: number;
  contato: { id?: number; nome?: string; tipoPessoa?: string; numeroDocumento?: string };
  situacao: { id: number; valor?: number; nome?: string };
  itens?: PedidoItem[];
}

export interface PedidoItem {
  id?: number;
  codigo?: string;
  descricao?: string;
  quantidade: number;
  valor: number;
  unidade?: string;
}

export interface Nota {
  id: number;
  serie: number;
  numero: number;
  dataEmissao: string;
  chaveAcesso?: string;
  situacao: number;
  valorTotal?: number;
  contato?: { id?: number; nome?: string };
}

export interface Expedicao {
  pedidoId: number;
  transportadora?: { id?: number; nome?: string };
  freteEmpresa?: number;
  prazoEntrega?: number;
  codigoRastreio?: string;
}

export interface BlingResponse<T> {
  data: T;
}

export interface BlingListResponse<T> {
  data: T[];
  pagination?: { page: number; totalCount: number; totalPages: number };
}
