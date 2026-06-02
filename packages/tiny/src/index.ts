/**
 * @lkw-connectors/tiny — Tiny ERP API v3 (OAuth2 + Bearer token).
 *
 * Public surface:
 *   - TinyClient + BearerAuth (access_token managed externally)
 *   - tiny.pedidos      /pedidos
 *   - tiny.notas        /notas
 *   - tiny.expedicoes   /expedicoes
 *
 * Tiny v3 also supports webhooks (configurable in account UI) — receive
 * them with your normal HTTP trigger node and pass `secret` for HMAC check.
 */
export { TinyClient, type TinyClientOptions } from './client.js';
export type { Pedido, Nota, Expedicao } from './types.js';
