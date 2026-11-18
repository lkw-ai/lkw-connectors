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
 *   - client.pedidos         sales orders (pedidos de venda)
 *   - client.notas           fiscal invoices (notas fiscais)
 *   - client.romaneios       cargo manifests (romaneios de carga)
 *   - client.ocorrencias     cargo occurrences (ocorrências de carga)
 *
 * Each resource exposes list/get/create/update/cancel where applicable.
 * Pagination follows TOTVS convention: `page` + `pageSize` + `hasNext`.
 */
export { TotvsClient, type TotvsClientOptions } from './client.js';
export type { Pedido, Nota, Romaneio, Ocorrencia } from './types.js';
