export interface Pedido {
  id: number;
  numero?: string;
  data: string;
  situacao: { id: number; descricao?: string };
  cliente: { id?: number; nome?: string; cpfCnpj?: string };
  totalProdutos?: number;
  total?: number;
  itens?: Array<{ produto?: { id?: number; codigo?: string; descricao?: string }; quantidade: number; valorUnitario: number; }>;
}

export interface Nota {
  id: number;
  serie: number;
  numero: number;
  chaveAcesso?: string;
  dataEmissao: string;
  situacao: { id: number; descricao?: string };
  valor?: number;
}

export interface Expedicao {
  pedidoId: number;
  formaEnvio?: { id?: number; descricao?: string };
  codigoRastreamento?: string;
  prazoEntrega?: number;
  dataExpedicao?: string;
}

export interface TinyResponse<T> {
  data: T;
}

export interface TinyListResponse<T> {
  data: T[];
  metadata?: { totalItems: number; totalPages: number; currentPage: number };
}
