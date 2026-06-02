/**
 * Subset of TOTVS Protheus response shapes — covers the fields that the
 * LKW logistics nodes typically need. Names mirror Protheus tables when
 * possible (SC5 = pedido, SF2 = nota, DAK = romaneio).
 *
 * These are deliberately permissive (most fields optional) because
 * Protheus customizations vary heavily by client implementation.
 */

export interface Pedido {
  /** SC5_FILIAL + SC5_NUM */
  numero: string;
  cliente: { codigo: string; loja: string; nome?: string };
  emissao: string; // YYYY-MM-DD
  status: 'PENDENTE' | 'LIBERADO' | 'BLOQUEADO' | 'FATURADO' | 'CANCELADO' | string;
  valor_total: number;
  itens: PedidoItem[];
  observacao?: string;
  raw?: Record<string, unknown>;
}

export interface PedidoItem {
  item: string;
  produto: { codigo: string; descricao?: string; um?: string };
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  peso_total?: number;
  volume_total?: number;
}

export interface Nota {
  /** SF2_FILIAL + SF2_DOC + SF2_SERIE */
  numero: string;
  serie: string;
  emissao: string;
  cliente: { codigo: string; loja: string };
  valor_total: number;
  peso_total?: number;
  status: 'EMITIDA' | 'CANCELADA' | 'AUTORIZADA' | string;
  chave_nfe?: string;
}

export interface Romaneio {
  /** DAK_FILIAL + DAK_COD */
  codigo: string;
  emissao: string;
  veiculo?: { placa: string; tipo?: string };
  motorista?: { cpf?: string; nome?: string };
  cdm_origem?: string;
  cdm_destino?: string;
  km_planejado?: number;
  peso_total?: number;
  volume_total?: number;
  notas: string[]; // numeros de nota
  status: 'EM_MONTAGEM' | 'LIBERADO' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADO' | string;
}

export interface Ocorrencia {
  /** DAK_OCOR ou tabela customizada */
  codigo: string;
  romaneio?: string;
  nota?: string;
  tipo: string; // ATRASO, AVARIA, ENTREGA_OK, RECUSA, etc
  data: string; // ISO
  descricao?: string;
  resolvido: boolean;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}
