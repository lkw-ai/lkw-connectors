/**
 * @lkw-connectors/bling — Bling API v3 (REST + OAuth2) connector.
 *
 * Public surface:
 *   - BlingClient + BearerAuth (token managed externally)
 *   - bling.pedidos       /pedidos/vendas
 *   - bling.notas         /nfe (nota fiscal eletrônica)
 *   - bling.expedicoes    /pedidos/vendas/{id}/expedir
 *
 * Auth: receive an OAuth2 access_token from your own token store.
 * Refresh tokens can be handled by passing a callback that swaps tokens
 * (see README).
 */
export { BlingClient, type BlingClientOptions } from './client.js';
export type { Pedido, Nota, Expedicao } from './types.js';
