/**
 * @lkw-connectors/totvs — typed client for TOTVS Protheus REST APIs.
 *
 * Targets the standard TOTVS REST modules (FWADAPTER, FWREST, FWMSAUDIT,
 * SFOAS) commonly exposed under the `/rest/` prefix of a Protheus instance.
 * Authentication is HTTP Basic by default; LDAP-backed setups also supported
 * via BasicAuth pointing at the proxy.
 *
 * Public surface:
 *   - TotvsClient            base client
 *   - client.pedidos         pedidos de venda
 *   - client.notas           notas fiscais
 *   - client.romaneios       romaneios de carga
 *   - client.ocorrencias     ocorrências de carga
 *
 * Each resource exposes list/get/create/update/cancel where applicable.
 * Pagination follows TOTVS convention: `page` + `pageSize` + `hasNext`.
 */
export { TotvsClient, type TotvsClientOptions } from './client.js';
export type { Pedido, Nota, Romaneio, Ocorrencia } from './types.js';
